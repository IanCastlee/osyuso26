<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require "./middleware.php";
require_once "../dbConn.php";

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

    if (!$user || empty($user->user_id)) {
        response(false, "Unauthorized", null, 401);
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
        LIMIT 1
    ");

    $stmt->bind_param("i", $user->user_id);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if (!$data) {
        response(false, "User not found", null, 404);
    }

    response(true, "User fetched successfully", [
        "user" => $data
    ]);
} catch (Throwable $e) {
    error_log("Get authenticated user failed: " . $e->getMessage());

    response(false, "Failed to fetch user", null, 500);
}