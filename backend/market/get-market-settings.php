<?php
include("../header.php");
header("Content-Type: application/json");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    $user = requireRole(["vendor", "admin"]);
    $user_id = $user->user_id;

    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.fullname,
            u.address,
            u.nearby,
            u.profile_picture,
            u.cover_photo,

            vp.shop_name,
            vp.shop_description,
            vp.phone
        FROM users u
        LEFT JOIN vendor_profiles vp 
            ON vp.user_id = u.user_id
        WHERE u.user_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    response(true, "Fetched successfully", $data);

} catch (Exception $e) {
    response(false, $e->getMessage());
}