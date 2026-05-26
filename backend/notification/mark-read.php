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
       $user = requireRole(["customer", "vendor", "admin"]);

    $user_id = (int)$user->user_id;

    $payload = json_decode(file_get_contents("php://input"), true);
    $notification_id = (int)($payload["notification_id"] ?? 0);

    if (!$notification_id) {
        response(false, "Missing notification ID", null, 400);
    }

    $stmt = $conn->prepare("
        UPDATE notifications
        SET is_read = 1,
            read_at = NOW()
        WHERE id = ?
            AND user_id = ?
    ");

    $stmt->bind_param("ii", $notification_id, $user_id);
    $stmt->execute();

    response(true, "Notification marked as read");
} catch (Throwable $e) {
    response(false, $e->getMessage(), null, 400);
}