<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = [], $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($statusCode);

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

    if ($user_id <= 0) {
        response(false, "Unauthorized user", [], 401);
    }

    $stmt = $conn->prepare("
        UPDATE notifications
        SET
            is_read = 1,
            read_at = NOW()
        WHERE user_id = ?
            AND is_read = 0
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    response(true, "All notifications marked as read", [
        "updated_count" => $stmt->affected_rows
    ]);
} catch (Throwable $e) {
    error_log("Mark all notifications read failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}