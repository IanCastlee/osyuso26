<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

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
        $user_id = $user->user_id ?? null;
    } elseif (is_array($user)) {
        $user_id = $user["user_id"] ?? null;
    } else {
        $user_id = null;
    }

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

            pi.image_path,

            s.shop_name
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
        $row["order_id"] = (int)$row["order_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["shop_id"] = (int)$row["shop_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["weight"] = (float)$row["weight"];
        $row["unit_price"] = (float)$row["unit_price"];
        $row["total_amount"] = (float)$row["total_amount"];
        $row["stock"] = (float)$row["stock"];
        $row["claim_status"] = $row["claim_status"] ?: "unclaimed";

        $orders[] = $row;
    }

    response(true, "Orders fetched successfully", $orders);
} catch (Throwable $e) {
    error_log("Get customer orders failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}