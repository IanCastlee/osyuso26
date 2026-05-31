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
    $user = requireRole(["vendor", "admin"]);
    $user_id = getUserId($user);

    if (!$user_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $stmt = $conn->prepare("
        SELECT
            u.user_id,
            u.fullname,
            u.address,
            u.nearby,

            s.id AS shop_id,
            s.shop_name,
            s.shop_description,
            s.address AS shop_address,
            s.nearby_landmark,
            s.phone,
            s.shop_logo,
            s.shop_cover_photo,
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM users u
        LEFT JOIN shops s
            ON s.owner_id = u.user_id
        WHERE u.user_id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $data = $stmt->get_result()->fetch_assoc();

    if (!$data) {
        response(false, "Shop profile not found", null, 404);
    }

    $data["is_accepting_orders"] = isset($data["is_accepting_orders"])
        ? (int)$data["is_accepting_orders"]
        : 1;

    $data["operating_hours_enabled"] = isset($data["operating_hours_enabled"])
        ? (int)$data["operating_hours_enabled"]
        : 0;

    response(true, "Fetched successfully", $data);
} catch (Throwable $e) {
    error_log("Get market settings failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}