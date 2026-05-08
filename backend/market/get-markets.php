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

    // ================= GET 6 MARKETS =================
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.fullname,
            u.profile_picture,
            u.cover_photo,
            u.address,
            u.nearby,
            u.status,

            vp.shop_name,
            vp.shop_description,
            vp.phone,

            bp.permit_image,
            bp.status AS permit_status

        FROM users u
        INNER JOIN vendor_profiles vp 
            ON vp.user_id = u.user_id
        LEFT JOIN business_permits bp 
            ON bp.user_id = u.user_id

        WHERE u.role = 'vendor'
        AND u.status = 'pending'

        ORDER BY u.created_at DESC
        LIMIT 6
    ");

    $stmt->execute();
    $result = $stmt->get_result();

    $markets = [];

    while ($row = $result->fetch_assoc()) {
        $markets[] = $row;
    }

    // ================= DETECT IF MORE THAN 5 =================
    $hasMore = count($markets) > 5;

    // only return 5 items to frontend display
    $visibleMarkets = array_slice($markets, 0, 5);

    response(true, "Markets fetched successfully", [
        "markets" => $visibleMarkets,
        "hasMore" => $hasMore
    ]);

} catch (Exception $e) {
    response(false, $e->getMessage());
}