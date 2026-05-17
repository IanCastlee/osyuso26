<?php
include("../header.php");
header("Content-Type: application/json");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null)
{
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    // ================= AUTH =================
    $user = requireRole(["vendor", "admin"]);

    $user_id = $user->user_id ?? $user['user_id'];

    // ================= GET SHOP PROFILE =================
    $stmt = $conn->prepare("
        SELECT 
            u.user_id,
            u.fullname,
            u.address,
            u.nearby,

            s.id AS shop_id,
            s.shop_name,
            s.shop_description,
            s.phone,
            s.shop_logo,
            s.shop_cover_photo
        FROM users u

        LEFT JOIN shops s
            ON s.owner_id = u.user_id

        WHERE u.user_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $user_id);

    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch shop profile");
    }

    $result = $stmt->get_result();

    $data = $result->fetch_assoc();

    if (!$data) {
        throw new Exception("Shop profile not found");
    }

    // ================= RESPONSE =================
    response(
        true,
        "Fetched successfully",
        $data
    );

} catch (Exception $e) {

    response(
        false,
        $e->getMessage()
    );
}