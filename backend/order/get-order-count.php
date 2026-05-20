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
    $user_id = (int)$user->user_id;

    $stmt = $conn->prepare("
        SELECT COUNT(*) AS order_count
        FROM orders
        WHERE user_id = ?
            AND payment_status = 'paid'
            AND claim_status = 'unclaimed'
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();

    response(true, "Order count fetched", [
        "order_count" => (int)($row["order_count"] ?? 0)
    ]);
} catch (Throwable $e) {
    error_log("Get order count failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}