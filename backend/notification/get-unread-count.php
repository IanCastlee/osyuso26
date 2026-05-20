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
    $user = auth();
    $user_id = (int)$user->user_id;

    $stmt = $conn->prepare("
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = ?
            AND is_read = 0
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();

    response(true, "Unread count fetched", [
        "unread_count" => (int)($row["unread_count"] ?? 0)
    ]);
} catch (Throwable $e) {
    response(false, $e->getMessage(), null, 400);
}