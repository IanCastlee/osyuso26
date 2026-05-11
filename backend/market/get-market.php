<?php
include("../header.php");
header("Content-Type: application/json");

require_once "../dbConn.php";

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    $id = $_GET['id'] ?? null;

    if (!$id) {
        response(false, "Market ID is required");
    }

    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.fullname,
            u.address,
            u.nearby,
            u.status,

            vp.shop_name,
            vp.shop_description,
            vp.phone,
            vp.shop_logo,
            vp.shop_cover_photo,

            bp.permit_image,
            bp.status AS permit_status

        FROM users u
        INNER JOIN vendor_profiles vp 
            ON vp.user_id = u.user_id
        LEFT JOIN business_permits bp 
            ON bp.user_id = u.user_id

        WHERE u.user_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $id);

    $stmt->execute();

    $result = $stmt->get_result();

    $market = $result->fetch_assoc();

    response(true, "Market fetched successfully", [
        "market" => $market
    ]);

} catch (Exception $e) {
    response(false, $e->getMessage());
}