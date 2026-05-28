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

try {
    $user = requireRole(["customer"]);

    if (is_object($user)) {
        $user_id = (int)($user->user_id ?? 0);
    } elseif (is_array($user)) {
        $user_id = (int)($user["user_id"] ?? 0);
    } else {
        $user_id = 0;
    }

    if (!$user_id) {
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
            AND role = 'customer'
        LIMIT 1
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $customer = $stmt->get_result()->fetch_assoc();

    if (!$customer) {
        response(false, "Customer account not found", null, 404);
    }

    $statsStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total_orders,
            SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN payment_status = 'paid' AND claim_status = 'unclaimed' THEN 1 ELSE 0 END) AS to_claim_orders,
            SUM(CASE WHEN claim_status = 'claimed' THEN 1 ELSE 0 END) AS completed_orders
        FROM orders
        WHERE user_id = ?
    ");

    $statsStmt->bind_param("i", $user_id);
    $statsStmt->execute();

    $orderStats = $statsStmt->get_result()->fetch_assoc() ?: [];

    $cartStmt = $conn->prepare("
        SELECT COUNT(ci.cart_item_id) AS cart_items
        FROM carts c
        LEFT JOIN cart_items ci
            ON ci.cart_id = c.cart_id
        WHERE c.user_id = ?
            AND c.status = 'active'
    ");

    $cartStmt->bind_param("i", $user_id);
    $cartStmt->execute();

    $cartStats = $cartStmt->get_result()->fetch_assoc() ?: [];

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

            r.receipt_no
        FROM orders o
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN receipts r
            ON r.order_id = o.id
        WHERE o.user_id = ?
        ORDER BY o.id DESC
        LIMIT 5
    ");

    $recentStmt->bind_param("i", $user_id);
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
        "total_orders" => (int)($orderStats["total_orders"] ?? 0),
        "pending_orders" => (int)($orderStats["pending_orders"] ?? 0),
        "to_claim_orders" => (int)($orderStats["to_claim_orders"] ?? 0),
        "completed_orders" => (int)($orderStats["completed_orders"] ?? 0),
        "cart_items" => (int)($cartStats["cart_items"] ?? 0)
    ];

    response(true, "Account fetched successfully", [
        "user" => $customer,
        "stats" => $stats,
        "recent_orders" => $recentOrders
    ]);
} catch (Throwable $e) {
    error_log("Get customer account failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}