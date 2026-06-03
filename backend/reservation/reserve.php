<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

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

function saleLabel($saleType, $saleValue) {
    $saleValue = (float)$saleValue;

    if ($saleType === "percent") {
        $value = rtrim(rtrim(number_format($saleValue, 2), "0"), ".");
        return $value . "% OFF";
    }

    if ($saleType === "fixed") {
        return "PHP " . number_format($saleValue, 2) . " OFF";
    }

    return null;
}

function applySalePricing($product) {
    $now = date("Y-m-d H:i:s");

    $originalPrice = (float)$product["price"];
    $finalPrice = $originalPrice;

    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    $saleStarted = empty($product["sale_starts_at"]) || $product["sale_starts_at"] <= $now;
    $saleNotEnded = empty($product["sale_ends_at"]) || $product["sale_ends_at"] >= $now;

    $isOnSale = $saleType !== "none" && $saleValue > 0 && $saleStarted && $saleNotEnded;

    if ($isOnSale) {
        if ($saleType === "percent") {
            $finalPrice = $originalPrice - ($originalPrice * ($saleValue / 100));
        }

        if ($saleType === "fixed") {
            $finalPrice = $originalPrice - $saleValue;
        }

        $finalPrice = max(0, $finalPrice);
    }

    $product["price"] = round($originalPrice, 2);
    $product["original_price"] = round($originalPrice, 2);
    $product["final_price"] = round($finalPrice, 2);
    $product["is_on_sale"] = $isOnSale ? 1 : 0;
    $product["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

    return $product;
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

    $data = [
        "high_price_threshold" => (float)($settings["high_price_threshold"] ?? 300),
        "normal_min" => (float)($settings["normal_kg_min_order"] ?? 0.50),
        "normal_step" => (float)($settings["normal_kg_order_step"] ?? 0.50),
        "high_min" => (float)($settings["high_price_kg_min_order"] ?? 0.25),
        "high_step" => (float)($settings["high_price_kg_order_step"] ?? 0.25),
    ];

    foreach (["normal_min", "normal_step", "high_min", "high_step"] as $key) {
        if ($data[$key] <= 0) {
            $data[$key] = str_contains($key, "high") ? 0.25 : 0.50;
        }
    }

    if ($data["high_price_threshold"] < 0) {
        $data["high_price_threshold"] = 300;
    }

    return $data;
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
    $isHighPrice = (float)$unitPrice >= $settings["high_price_threshold"];

    return [
        "min_order" => $isHighPrice ? $settings["high_min"] : $settings["normal_min"],
        "order_step" => $isHighPrice ? $settings["high_step"] : $settings["normal_step"],
        "is_high_price_kg" => $isHighPrice ? 1 : 0,
        "high_price_threshold" => $settings["high_price_threshold"]
    ];
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

try {
    requireRole(["customer"]);

    if (!isset($_GET["product_id"])) {
        response(false, "Product ID is required", null, 400);
    }

    $product_id = (int)$_GET["product_id"];

    $stmt = $conn->prepare("
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
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message,

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
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        response(false, "Product not found", null, 404);
    }

    $product = applySalePricing($result->fetch_assoc());
    $orderRule = getOrderRule($conn, $product["unit_type"], $product["final_price"]);

    $isShopOpen = isShopOpen($product);

    $product["is_shop_open"] = $isShopOpen ? 1 : 0;
    $product["shop_closed_message"] = $isShopOpen ? null : getShopClosedMessage($product);
    $product["shop_opens_at"] = $product["opens_at"];
    $product["shop_closes_at"] = $product["closes_at"];
    $product["min_order"] = $orderRule["min_order"];
    $product["order_step"] = $orderRule["order_step"];
    $product["kg_min_order"] = $orderRule["min_order"];
    $product["kg_order_step"] = $orderRule["order_step"];
    $product["is_high_price_kg"] = $orderRule["is_high_price_kg"];
    $product["high_price_threshold"] = $orderRule["high_price_threshold"];

    $product["is_purchasable"] =
        $isShopOpen &&
        ($product["status"] ?? "") === "active" &&
        (float)$product["stock"] > 0
            ? 1
            : 0;

    if (!$isShopOpen) {
        $product["unavailable_reason"] = $product["shop_closed_message"];
    } elseif ((float)$product["stock"] <= 0) {
        $product["unavailable_reason"] = "Out of stock.";
    } else {
        $product["unavailable_reason"] = null;
    }

    unset(
        $product["is_accepting_orders"],
        $product["operating_hours_enabled"],
        $product["opens_at"],
        $product["closes_at"],
        $product["closed_message"]
    );

    response(true, "Product fetched successfully", $product);
} catch (Throwable $e) {
    error_log("Reserve product failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 400);
}