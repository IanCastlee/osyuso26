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

            s.shop_name,
            s.shop_description,
            s.phone,
            s.shop_logo,
            s.shop_cover_photo,
            s.id AS shop_id,
            bp.permit_image,
            bp.status AS permit_status

        FROM users u
        INNER JOIN shops s 
            ON s.owner_id = u.user_id
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