<?php
ob_start();

include("../header.php");
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

date_default_timezone_set("Asia/Manila");

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

function saleLabel($saleType, $saleValue) {
    $saleValue = (float)$saleValue;

    if ($saleType === "percent") {
        $value = rtrim(rtrim(number_format($saleValue, 2), "0"), ".");
        return $value . "% OFF";
    }

    if ($saleType === "fixed") {
        return "₱" . number_format($saleValue, 2) . " OFF";
    }

    return null;
}

function applySalePricing($product) {
    $now = date("Y-m-d H:i:s");

    $originalPrice = (float)$product["price"];
    $finalPrice = $originalPrice;

    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    $saleStarted =
        empty($product["sale_starts_at"]) ||
        $product["sale_starts_at"] <= $now;

    $saleNotEnded =
        empty($product["sale_ends_at"]) ||
        $product["sale_ends_at"] >= $now;

    $isOnSale =
        $saleType !== "none" &&
        $saleValue > 0 &&
        $saleStarted &&
        $saleNotEnded;

    if ($isOnSale) {
        if ($saleType === "percent") {
            $finalPrice = $originalPrice - ($originalPrice * ($saleValue / 100));
        }

        if ($saleType === "fixed") {
            $finalPrice = $originalPrice - $saleValue;
        }

        $finalPrice = max(0, $finalPrice);
    }

    $product["price"] = $originalPrice;
    $product["original_price"] = $originalPrice;
    $product["final_price"] = $finalPrice;
    $product["is_on_sale"] = $isOnSale ? 1 : 0;
    $product["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

    return $product;
}

try {
    requireRole(["customer"]);

    if (!isset($_GET["product_id"])) {
        response(false, "Product ID is required", null, 400);
    }

    $product_id = (int)$_GET["product_id"];

    $query = "
        SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.unit_type,
            p.status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,
            p.created_at,

            pi.image_path,

            s.id AS shop_id,
            s.shop_name,
            s.shop_description,
            s.address,
            s.nearby_landmark,
            s.phone,

            u.user_id,
            u.fullname,
            u.profile_picture

        FROM products p

        LEFT JOIN product_images pi
            ON p.id = pi.product_id
            AND pi.is_primary = 1

        INNER JOIN shops s
            ON p.shop_id = s.id

        INNER JOIN users u
            ON s.owner_id = u.user_id

        WHERE p.id = ?
            AND p.status = 'active'

        LIMIT 1
    ";

    $stmt = $conn->prepare($query);

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        response(false, "Product not found", null, 404);
    }

    $product = $result->fetch_assoc();
    $product = applySalePricing($product);

    response(true, "Product fetched successfully", $product);
} catch (Throwable $e) {
    error_log("Reserve product failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}