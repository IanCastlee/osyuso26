<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

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

try {
    $authUser = requireRole(["vendor"]);
    $vendor_id = getUserId($authUser);

    if (!$vendor_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $stmt = $conn->prepare("
        SELECT
            user_id,
            profile_picture,
            fullname,
            address,
            nearby,
            email,
            role,
            status,
            email_verified,
            created_at,
            updated_at
        FROM users
        WHERE user_id = ?
            AND role = 'vendor'
        LIMIT 1
    ");

    $stmt->bind_param("i", $vendor_id);
    $stmt->execute();

    $vendor = $stmt->get_result()->fetch_assoc();

    if (!$vendor) {
        response(false, "Vendor account not found", null, 404);
    }

    $productStmt = $conn->prepare("
        SELECT COUNT(p.id) AS products_count
        FROM shops s
        LEFT JOIN products p
            ON p.shop_id = s.id
        WHERE s.owner_id = ?
    ");

    $productStmt->bind_param("i", $vendor_id);
    $productStmt->execute();

    $productStats = $productStmt->get_result()->fetch_assoc() ?: [];

    $orderStatsStmt = $conn->prepare("
        SELECT
            COUNT(o.id) AS total_orders,
            SUM(CASE WHEN o.payment_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN o.payment_status = 'paid' AND o.claim_status = 'unclaimed' THEN 1 ELSE 0 END) AS to_prepare_orders,
            SUM(CASE WHEN o.claim_status = 'claimed' THEN 1 ELSE 0 END) AS completed_orders
        FROM shops s
        LEFT JOIN orders o
            ON o.shop_id = s.id
        WHERE s.owner_id = ?
    ");

    $orderStatsStmt->bind_param("i", $vendor_id);
    $orderStatsStmt->execute();

    $orderStats = $orderStatsStmt->get_result()->fetch_assoc() ?: [];

    $earningsStmt = $conn->prepare("
        SELECT
            COALESCE(SUM(net_amount), 0) AS total_earnings,
            COALESCE(SUM(CASE WHEN status = 'available' THEN net_amount ELSE 0 END), 0) AS available_earnings
        FROM vendor_earnings
        WHERE vendor_id = ?
    ");

    $earningsStmt->bind_param("i", $vendor_id);
    $earningsStmt->execute();

    $earningStats = $earningsStmt->get_result()->fetch_assoc() ?: [];

    $recentStmt = $conn->prepare("
        SELECT
            o.id,
            o.quantity,
            o.weight,
            o.unit_price,
            o.total_amount,
            o.payment_status,
            o.claim_status,
            o.created_at,

            p.name AS product_name,
            p.unit_type,

            s.shop_name,

            cu.fullname AS customer_name,
            cu.email AS customer_email,

            r.receipt_no
        FROM orders o
        INNER JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN users cu
            ON cu.user_id = o.user_id
        LEFT JOIN receipts r
            ON r.order_id = o.id
        WHERE s.owner_id = ?
        ORDER BY o.id DESC
        LIMIT 5
    ");

    $recentStmt->bind_param("i", $vendor_id);
    $recentStmt->execute();

    $recentResult = $recentStmt->get_result();

    $recentOrders = [];

    while ($row = $recentResult->fetch_assoc()) {
        $amountLabel = ((float)$row["weight"] > 0)
            ? $row["weight"] . " kg"
            : $row["quantity"] . " pcs";

        $row["id"] = (int)$row["id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["weight"] = (float)$row["weight"];
        $row["unit_price"] = (float)$row["unit_price"];
        $row["total_amount"] = (float)$row["total_amount"];
        $row["amount_label"] = $amountLabel;

        $recentOrders[] = $row;
    }

    $stats = [
        "products_count" => (int)($productStats["products_count"] ?? 0),
        "total_orders" => (int)($orderStats["total_orders"] ?? 0),
        "pending_orders" => (int)($orderStats["pending_orders"] ?? 0),
        "to_prepare_orders" => (int)($orderStats["to_prepare_orders"] ?? 0),
        "completed_orders" => (int)($orderStats["completed_orders"] ?? 0),
        "total_earnings" => (float)($earningStats["total_earnings"] ?? 0),
        "available_earnings" => (float)($earningStats["available_earnings"] ?? 0)
    ];

    response(true, "Vendor account fetched successfully", [
        "user" => $vendor,
        "stats" => $stats,
        "recent_orders" => $recentOrders
    ]);
} catch (Throwable $e) {
    error_log("Get vendor account failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}