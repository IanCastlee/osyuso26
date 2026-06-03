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
    if (ob_get_length()) ob_clean();

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function getUserId($user) {
    if (is_object($user)) return (int)($user->user_id ?? 0);
    if (is_array($user)) return (int)($user["user_id"] ?? 0);
    return 0;
}

function isShopOpen($shop) {
    if (($shop["shop_status"] ?? "") !== "active") return false;
    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) return false;
    if ((int)($shop["operating_hours_enabled"] ?? 0) !== 1) return true;
    if (empty($shop["opens_at"]) || empty($shop["closes_at"])) return true;

    $now = date("H:i:s");
    $opensAt = $shop["opens_at"];
    $closesAt = $shop["closes_at"];

    if ($opensAt <= $closesAt) {
        return $now >= $opensAt && $now <= $closesAt;
    }

    return $now >= $opensAt || $now <= $closesAt;
}

function getShopClosedMessage($shop) {
    if (($shop["shop_status"] ?? "") !== "active") return "Shop is unavailable.";
    if (!empty($shop["closed_message"])) return $shop["closed_message"];
    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) return "Shop is closed now.";
    return "Shop is closed now. Please order during operating hours.";
}

function isSaleActive($product) {
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);
    $now = date("Y-m-d H:i:s");

    if ($saleType === "none" || $saleValue <= 0) return false;
    if (!empty($product["sale_starts_at"]) && $product["sale_starts_at"] > $now) return false;
    if (!empty($product["sale_ends_at"]) && $product["sale_ends_at"] < $now) return false;

    return true;
}

function calculateFinalPrice($product) {
    $originalPrice = round((float)$product["price"], 2);
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    if (!isSaleActive($product)) return $originalPrice;

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

function getKgOrderSettings($conn) {
    $stmt = $conn->prepare("
        SELECT
            high_price_threshold,
            normal_kg_min_order,
            normal_kg_order_step,
            high_price_kg_min_order,
            high_price_kg_order_step
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $stmt->execute();
    $settings = $stmt->get_result()->fetch_assoc() ?: [];

    return [
        "threshold" => max(0, (float)($settings["high_price_threshold"] ?? 300)),
        "normal_min" => max(0.01, (float)($settings["normal_kg_min_order"] ?? 0.50)),
        "normal_step" => max(0.01, (float)($settings["normal_kg_order_step"] ?? 0.50)),
        "high_min" => max(0.01, (float)($settings["high_price_kg_min_order"] ?? 0.25)),
        "high_step" => max(0.01, (float)($settings["high_price_kg_order_step"] ?? 0.25)),
    ];
}

function getOrderRule($conn, $unitType, $unitPrice) {
    if ($unitType !== "kg") {
        return [
            "min_order" => 1,
            "order_step" => 1,
            "is_high_price_kg" => 0,
            "high_price_threshold" => null
        ];
    }

    $settings = getKgOrderSettings($conn);
    $isHighPrice = (float)$unitPrice >= $settings["threshold"];

    return [
        "min_order" => $isHighPrice ? $settings["high_min"] : $settings["normal_min"],
        "order_step" => $isHighPrice ? $settings["high_step"] : $settings["normal_step"],
        "is_high_price_kg" => $isHighPrice ? 1 : 0,
        "high_price_threshold" => $settings["threshold"]
    ];
}

function isValidStepAmount($value, $min, $step) {
    $value = round((float)$value, 4);
    $min = round((float)$min, 4);
    $step = round((float)$step, 4);

    if ($value < $min) return false;
    if ($step <= 0) return true;

    $diff = round($value - $min, 4);
    $steps = round($diff / $step);
    $expected = round($steps * $step, 4);

    return abs($diff - $expected) < 0.0001;
}

$transactionStarted = false;

try {
    $user = requireRole(["customer"]);
    $user_id = getUserId($user);

    if (!$user_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        throw new Exception("Invalid JSON input");
    }

    $cart_item_id = filter_var($data["cart_item_id"] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($data["quantity"] ?? 0, FILTER_VALIDATE_INT);
    $weight = filter_var($data["weight"] ?? 0, FILTER_VALIDATE_FLOAT);

    $quantity = $quantity === false ? 0 : (int)$quantity;
    $weight = $weight === false ? 0 : (float)$weight;

    if (!$cart_item_id) {
        throw new Exception("Cart item required");
    }

    $conn->begin_transaction();
    $transactionStarted = true;

    $stmt = $conn->prepare("
        SELECT
            ci.cart_item_id,
            ci.cart_id,
            ci.product_id,

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
        FROM cart_items ci
        INNER JOIN carts c
            ON c.cart_id = ci.cart_id
        INNER JOIN products p
            ON p.id = ci.product_id
        INNER JOIN shops s
            ON s.id = p.shop_id
        WHERE ci.cart_item_id = ?
            AND c.user_id = ?
            AND c.status = 'active'
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("ii", $cart_item_id, $user_id);
    $stmt->execute();

    $item = $stmt->get_result()->fetch_assoc();

    if (!$item) {
        throw new Exception("Cart item not found or unauthorized");
    }

    if ($item["status"] !== "active") {
        throw new Exception("Product is not available");
    }

    if (!isShopOpen($item)) {
        throw new Exception(getShopClosedMessage($item));
    }

    $unit_type = $item["unit_type"];
    $stock = (float)$item["stock"];
    $price = calculateFinalPrice($item);
    $orderRule = getOrderRule($conn, $unit_type, $price);

    if ($stock <= 0) {
        throw new Exception("Out of stock");
    }

    if ($unit_type === "kg") {
        $weight = round($weight, 2);
        $minOrder = (float)$orderRule["min_order"];
        $orderStep = (float)$orderRule["order_step"];

        if ($weight < $minOrder) {
            throw new Exception("Minimum order is {$minOrder} kg");
        }

        if (!isValidStepAmount($weight, $minOrder, $orderStep)) {
            throw new Exception("Order weight must follow {$orderStep} kg increments");
        }

        if ($weight > $stock) {
            throw new Exception("Insufficient stock. Available stock: {$stock} kg");
        }

        $quantity = 0;
    } else {
        if ($quantity <= 0) {
            throw new Exception("Invalid quantity");
        }

        if ($quantity > $stock) {
            throw new Exception("Insufficient stock. Available stock: {$stock} pcs");
        }

        $weight = 0;
    }

    $stmt = $conn->prepare("
        UPDATE cart_items
        SET
            quantity = ?,
            weight = ?,
            price = ?,
            unit_type = ?
        WHERE cart_item_id = ?
    ");

    $stmt->bind_param(
        "iddsi",
        $quantity,
        $weight,
        $price,
        $unit_type,
        $cart_item_id
    );

    $stmt->execute();

    $stmt = $conn->prepare("
        UPDATE carts
        SET updated_at = NOW()
        WHERE cart_id = ?
    ");

    $cartId = (int)$item["cart_id"];
    $stmt->bind_param("i", $cartId);
    $stmt->execute();

    $conn->commit();

    response(true, "Cart updated successfully", [
        "cart_item_id" => (int)$cart_item_id,
        "quantity" => $quantity,
        "weight" => $weight,
        "unit_type" => $unit_type,
        "unit_price" => $price,
        "min_order" => $orderRule["min_order"],
        "order_step" => $orderRule["order_step"],
        "is_high_price_kg" => $orderRule["is_high_price_kg"],
        "high_price_threshold" => $orderRule["high_price_threshold"]
    ]);
} catch (Throwable $e) {
    if ($transactionStarted) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Update cart failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;