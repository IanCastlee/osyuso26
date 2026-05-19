<?php
include("../header.php");
header("Content-Type: application/json");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    $user = requireRole(["customer", "vendor", "admin"]);
    $user_id = $user->user_id;
    $role = $user->role;

    $order_id = (int)($_GET["order_id"] ?? 0);

    if (!$order_id) {
        response(false, "Missing order ID", null, 400);
    }

    if ($role === "admin") {
        $stmt = $conn->prepare("
            SELECT
                r.id,
                r.order_id,
                r.receipt_no,
                r.payment_provider,
                r.payment_reference,
                r.payment_method,
                r.payment_channel,
                r.amount_paid,
                r.paid_at,
                r.created_at
            FROM receipts r
            INNER JOIN orders o ON o.id = r.order_id
            WHERE r.order_id = ?
            LIMIT 1
        ");

        $stmt->bind_param("i", $order_id);
    } else {
        $stmt = $conn->prepare("
            SELECT
                r.id,
                r.order_id,
                r.receipt_no,
                r.payment_provider,
                r.payment_reference,
                r.payment_method,
                r.payment_channel,
                r.amount_paid,
                r.paid_at,
                r.created_at
            FROM receipts r
            INNER JOIN orders o ON o.id = r.order_id
            WHERE r.order_id = ?
              AND o.user_id = ?
            LIMIT 1
        ");

        $stmt->bind_param("ii", $order_id, $user_id);
    }

    $stmt->execute();
    $receipt = $stmt->get_result()->fetch_assoc();

    if (!$receipt) {
        response(false, "Receipt not available yet", null, 404);
    }

    response(true, "Receipt found", [
        "receipt" => $receipt
    ]);
} catch (Exception $e) {
    response(false, $e->getMessage(), null, 500);
}