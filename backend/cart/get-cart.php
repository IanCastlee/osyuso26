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
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,

            pi.image_path,

            s.shop_name
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

        $row["quantity"] = $quantity;
        $row["weight"] = $weight;
        $row["stock"] = (float)($row["stock"] ?? 0);

        $row["original_price"] = $priceData["original_price"];
        $row["final_price"] = $priceData["final_price"];
        $row["is_on_sale"] = $priceData["is_on_sale"] ? 1 : 0;
        $row["sale_label"] = $priceData["sale_label"];

        $row["price"] = $priceData["final_price"];
        $row["cart_price"] = (float)($row["cart_price"] ?? 0);

        $row["subtotal"] = round($priceData["final_price"] * $amount, 2);
        $row["original_subtotal"] = round($priceData["original_price"] * $amount, 2);
        $row["savings"] = max(0, round($row["original_subtotal"] - $row["subtotal"], 2));

        unset(
            $row["product_price"],
            $row["sale_type"],
            $row["sale_value"],
            $row["sale_starts_at"],
            $row["sale_ends_at"]
        );

        $items[] = $row;
    }

    response(true, "Cart fetched", $items);
} catch (Throwable $e) {
    error_log("Get cart failed: " . $e->getMessage());

    response(false, $e->getMessage(), [], 400);
}

exit;