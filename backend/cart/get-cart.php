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

function response($success, $message, $data = [], $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
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
    $originalPrice = round((float)$product["product_price"], 2);
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    if (!isSaleActive($product)) {
        return [
            "original_price" => $originalPrice,
            "final_price" => $originalPrice,
            "is_on_sale" => false,
            "sale_label" => null
        ];
    }

    if ($saleType === "percent") {
        $discountPercent = min($saleValue, 100);
        $finalPrice = max(0, $originalPrice - ($originalPrice * ($discountPercent / 100)));

        return [
            "original_price" => $originalPrice,
            "final_price" => round($finalPrice, 2),
            "is_on_sale" => true,
            "sale_label" => rtrim(rtrim(number_format($discountPercent, 2, ".", ""), "0"), ".") . "% OFF"
        ];
    }

    if ($saleType === "fixed") {
        $discount = min($saleValue, $originalPrice);
        $finalPrice = max(0, $originalPrice - $discount);

        return [
            "original_price" => $originalPrice,
            "final_price" => round($finalPrice, 2),
            "is_on_sale" => true,
            "sale_label" => "PHP " . number_format($discount, 2) . " OFF"
        ];
    }

    return [
        "original_price" => $originalPrice,
        "final_price" => $originalPrice,
        "is_on_sale" => false,
        "sale_label" => null
    ];
}

try {
    $user = requireRole(["customer"]);
    $user_id = (int)($user->user_id ?? 0);

    if ($user_id <= 0) {
        response(false, "Unauthorized user", [], 401);
    }

    $stmt = $conn->prepare("
        SELECT cart_id
        FROM carts
        WHERE user_id = ?
            AND status = 'active'
        LIMIT 1
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $cart = $stmt->get_result()->fetch_assoc();

    if (!$cart) {
        response(true, "Cart fetched", []);
    }

    $cart_id = (int)$cart["cart_id"];

    $stmt = $conn->prepare("
        SELECT
            ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.weight,
            ci.unit_type,
            ci.price AS cart_price,

            p.name,
            p.price AS product_price,
            p.stock,
            p.status AS product_status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,

            pi.image_path,

            s.shop_name,
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM cart_items ci
        INNER JOIN products p
            ON ci.product_id = p.id
        LEFT JOIN product_images pi
            ON p.id = pi.product_id
            AND pi.is_primary = 1
        INNER JOIN shops s
            ON p.shop_id = s.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at DESC
    ");

    $stmt->bind_param("i", $cart_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $items = [];

    while ($row = $result->fetch_assoc()) {
        $priceData = calculateFinalPrice($row);

        $quantity = (int)($row["quantity"] ?? 0);
        $weight = (float)($row["weight"] ?? 0);
        $unitType = $row["unit_type"] ?? "pcs";
        $amount = $unitType === "kg" ? $weight : $quantity;
        $stock = (float)($row["stock"] ?? 0);

        $isShopOpen = isShopOpen($row);
        $isProductActive = ($row["product_status"] ?? "") === "active";
        $hasStock = $stock > 0 && $amount <= $stock;
        $isPurchasable = $isShopOpen && $isProductActive && $hasStock;

        $row["quantity"] = $quantity;
        $row["weight"] = $weight;
        $row["stock"] = $stock;

        $row["original_price"] = $priceData["original_price"];
        $row["final_price"] = $priceData["final_price"];
        $row["is_on_sale"] = $priceData["is_on_sale"] ? 1 : 0;
        $row["sale_label"] = $priceData["sale_label"];

        $row["price"] = $priceData["final_price"];
        $row["cart_price"] = (float)($row["cart_price"] ?? 0);

        $row["subtotal"] = round($priceData["final_price"] * $amount, 2);
        $row["original_subtotal"] = round($priceData["original_price"] * $amount, 2);
        $row["savings"] = max(0, round($row["original_subtotal"] - $row["subtotal"], 2));

        $row["is_shop_open"] = $isShopOpen ? 1 : 0;
        $row["shop_closed_message"] = $isShopOpen ? null : getShopClosedMessage($row);
        $row["shop_opens_at"] = $row["opens_at"];
        $row["shop_closes_at"] = $row["closes_at"];
        $row["is_purchasable"] = $isPurchasable ? 1 : 0;

        if (!$isProductActive) {
            $row["unavailable_reason"] = "Product is no longer available.";
        } elseif (!$isShopOpen) {
            $row["unavailable_reason"] = $row["shop_closed_message"];
        } elseif (!$hasStock) {
            $row["unavailable_reason"] = "Insufficient stock.";
        } else {
            $row["unavailable_reason"] = null;
        }

        unset(
            $row["product_price"],
            $row["product_status"],
            $row["sale_type"],
            $row["sale_value"],
            $row["sale_starts_at"],
            $row["sale_ends_at"],
            $row["is_accepting_orders"],
            $row["operating_hours_enabled"],
            $row["opens_at"],
            $row["closes_at"],
            $row["closed_message"]
        );

        $items[] = $row;
    }

    response(true, "Cart fetched", $items);
} catch (Throwable $e) {
    error_log("Get cart failed: " . $e->getMessage());

    response(false, $e->getMessage(), [], 400);
}

exit;