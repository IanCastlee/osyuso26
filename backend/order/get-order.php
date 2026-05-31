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

try {
    $user = requireRole(["customer"]);
    $user_id = getUserId($user);

    if (!$user_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $stmt = $conn->prepare("
        SELECT
            o.id AS order_id,
            o.product_id,
            o.shop_id,
            o.quantity,
            o.weight,
            o.unit_price,
            o.total_amount,
            o.payment_status,
            o.claim_status,
            o.claimed_at,
            o.xendit_invoice_id,
            o.xendit_checkout_url,
            o.created_at,

            p.name AS product_name,
            p.unit_type,
            p.stock,
            p.status AS product_status,

            pi.image_path,

            s.shop_name,
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM orders o
        INNER JOIN products p
            ON p.id = o.product_id
        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        INNER JOIN shops s
            ON s.id = o.shop_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC, o.id DESC
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $orders = [];

    while ($row = $result->fetch_assoc()) {
        $isShopOpen = isShopOpen($row);
        $isProductActive = ($row["product_status"] ?? "") === "active";

        $row["order_id"] = (int)$row["order_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["shop_id"] = (int)$row["shop_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["weight"] = (float)$row["weight"];
        $row["unit_price"] = (float)$row["unit_price"];
        $row["total_amount"] = (float)$row["total_amount"];
        $row["stock"] = (float)$row["stock"];
        $row["claim_status"] = $row["claim_status"] ?: "unclaimed";

        $row["is_shop_open"] = $isShopOpen ? 1 : 0;
        $row["shop_closed_message"] = $isShopOpen ? null : getShopClosedMessage($row);
        $row["shop_opens_at"] = $row["opens_at"];
        $row["shop_closes_at"] = $row["closes_at"];

        if (!$isProductActive) {
            $row["unavailable_reason"] = "Product is no longer available.";
        } elseif (!$isShopOpen) {
            $row["unavailable_reason"] = $row["shop_closed_message"];
        } else {
            $row["unavailable_reason"] = null;
        }

        unset(
            $row["product_status"],
            $row["is_accepting_orders"],
            $row["operating_hours_enabled"],
            $row["opens_at"],
            $row["closes_at"],
            $row["closed_message"]
        );

        $orders[] = $row;
    }

    response(true, "Orders fetched successfully", $orders);
} catch (Throwable $e) {
    error_log("Get customer orders failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}