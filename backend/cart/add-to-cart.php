<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function getUserId($user) {
    if (is_object($user)) {
        return (int)($user->user_id ?? 0);
    }

    if (is_array($user)) {
        return (int)($user["user_id"] ?? 0);
    }

    return 0;
}

function getInputData() {
    if (!empty($_POST)) {
        return $_POST;
    }

    $json = json_decode(file_get_contents("php://input"), true);

    return is_array($json) ? $json : [];
}

function isShopOpen($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return false;
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return false;
    }

    if ((int)($shop["operating_hours_enabled"] ?? 0) !== 1) {
        return true;
    }

    if (empty($shop["opens_at"]) || empty($shop["closes_at"])) {
        return true;
    }

    $now = date("H:i:s");
    $opensAt = $shop["opens_at"];
    $closesAt = $shop["closes_at"];

    if ($opensAt <= $closesAt) {
        return $now >= $opensAt && $now <= $closesAt;
    }

    return $now >= $opensAt || $now <= $closesAt;
}

function getShopClosedMessage($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return "Shop is unavailable.";
    }

    if (!empty($shop["closed_message"])) {
        return $shop["closed_message"];
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return "Shop is closed now.";
    }

    return "Shop is closed now. Please order during operating hours.";
}

function isSaleActive($product) {
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);
    $now = date("Y-m-d H:i:s");

    if ($saleType === "none" || $saleValue <= 0) {
        return false;
    }

    if (!empty($product["sale_starts_at"]) && $product["sale_starts_at"] > $now) {
        return false;
    }

    if (!empty($product["sale_ends_at"]) && $product["sale_ends_at"] < $now) {
        return false;
    }

    return true;
}

function calculateFinalPrice($product) {
    $originalPrice = round((float)$product["price"], 2);
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    if (!isSaleActive($product)) {
        return $originalPrice;
    }

    if ($saleType === "percent") {
        $discountPercent = min($saleValue, 100);
        return round(max(0, $originalPrice - ($originalPrice * ($discountPercent / 100))), 2);
    }

    if ($saleType === "fixed") {
        $discount = min($saleValue, $originalPrice);
        return round(max(0, $originalPrice - $discount), 2);
    }

    return $originalPrice;
}

$transactionStarted = false;

try {
    $user = requireRole(["customer"]);
    $user_id = getUserId($user);

    if (!$user_id) {
        throw new Exception("Unauthorized user");
    }

    $input = getInputData();

    $product_id = filter_var($input["product_id"] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($input["quantity"] ?? 0, FILTER_VALIDATE_INT);
    $weight = filter_var($input["weight"] ?? 0, FILTER_VALIDATE_FLOAT);

    $quantity = $quantity === false ? 0 : (int)$quantity;
    $weight = $weight === false ? 0 : (float)$weight;

    if (!$product_id) {
        throw new Exception("Product ID is required");
    }

    $conn->begin_transaction();
    $transactionStarted = true;

    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.price,
            p.unit_type,
            p.stock,
            p.status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,

            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        WHERE p.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    if ($product["status"] !== "active") {
        throw new Exception("Product is not available");
    }

    if (!isShopOpen($product)) {
        throw new Exception(getShopClosedMessage($product));
    }

    $stock = (float)$product["stock"];

    if ($stock <= 0) {
        throw new Exception("Out of stock");
    }

    $price = calculateFinalPrice($product);
    $unit_type = $product["unit_type"];

    if ($unit_type === "kg") {
        $weight = round($weight, 2);

        if ($weight <= 0) {
            throw new Exception("Weight must be greater than zero");
        }

        $quantity = 0;
    } else {
        if ($quantity <= 0) {
            throw new Exception("Quantity must be greater than zero");
        }

        $weight = 0;
    }

    $stmt = $conn->prepare("
        SELECT cart_id
        FROM carts
        WHERE user_id = ?
            AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $cart = $stmt->get_result()->fetch_assoc();

    if (!$cart) {
        $stmt = $conn->prepare("
            INSERT INTO carts (user_id, status, created_at, updated_at)
            VALUES (?, 'active', NOW(), NOW())
        ");

        $stmt->bind_param("i", $user_id);
        $stmt->execute();

        $cart_id = $conn->insert_id;
    } else {
        $cart_id = (int)$cart["cart_id"];
    }

    $stmt = $conn->prepare("
        SELECT cart_item_id, quantity, weight
        FROM cart_items
        WHERE cart_id = ?
            AND product_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("ii", $cart_id, $product_id);
    $stmt->execute();

    $item = $stmt->get_result()->fetch_assoc();

    if ($item) {
        if ($unit_type === "kg") {
            $newWeight = round((float)$item["weight"] + $weight, 2);

            if ($newWeight > $stock) {
                throw new Exception("Insufficient stock. Available stock: {$stock} kg");
            }

            $stmt = $conn->prepare("
                UPDATE cart_items
                SET
                    weight = ?,
                    quantity = 0,
                    price = ?,
                    unit_type = ?
                WHERE cart_item_id = ?
            ");

            $stmt->bind_param(
                "ddsi",
                $newWeight,
                $price,
                $unit_type,
                $item["cart_item_id"]
            );
        } else {
            $newQty = (int)$item["quantity"] + $quantity;

            if ($newQty > $stock) {
                throw new Exception("Insufficient stock. Available stock: {$stock} pcs");
            }

            $stmt = $conn->prepare("
                UPDATE cart_items
                SET
                    quantity = ?,
                    weight = 0,
                    price = ?,
                    unit_type = ?
                WHERE cart_item_id = ?
            ");

            $stmt->bind_param(
                "idsi",
                $newQty,
                $price,
                $unit_type,
                $item["cart_item_id"]
            );
        }

        $stmt->execute();

        $cart_item_id = (int)$item["cart_item_id"];
    } else {
        $requestedAmount = $unit_type === "kg" ? $weight : $quantity;

        if ($requestedAmount > $stock) {
            $unitLabel = $unit_type === "kg" ? "kg" : "pcs";
            throw new Exception("Insufficient stock. Available stock: {$stock} {$unitLabel}");
        }

        $stmt = $conn->prepare("
            INSERT INTO cart_items
            (cart_id, product_id, quantity, weight, price, unit_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            "iiidds",
            $cart_id,
            $product_id,
            $quantity,
            $weight,
            $price,
            $unit_type
        );

        $stmt->execute();

        $cart_item_id = $conn->insert_id;
    }

    $stmt = $conn->prepare("
        UPDATE carts
        SET updated_at = NOW()
        WHERE cart_id = ?
    ");

    $stmt->bind_param("i", $cart_id);
    $stmt->execute();

    $conn->commit();

    response(true, "Added to cart successfully", [
        "cart_id" => $cart_id,
        "cart_item_id" => $cart_item_id,
        "product_id" => $product_id,
        "quantity" => $quantity,
        "weight" => $weight,
        "unit_type" => $unit_type,
        "unit_price" => $price
    ]);
} catch (Throwable $e) {
    if ($transactionStarted) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Add to cart failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;