<?php
include("../header.php");

header("Content-Type: application/json");

require_once "../dbConn.php";

try {

    // ================= GET SETTINGS =================
    $stmt = $conn->prepare("
        SELECT
            promotion_price_per_hour
        FROM admin_settings
        LIMIT 1
    ");

    $stmt->execute();

    $result = $stmt->get_result();

    $settings = $result->fetch_assoc();

    // ================= DEFAULT =================
    $price_per_hour = 20;

    if (
        $settings &&
        isset($settings['promotion_price_per_hour'])
    ) {
        $price_per_hour =
            (float)$settings['promotion_price_per_hour'];
    }

    echo json_encode([
        "success" => true,
        "price_per_hour" => $price_per_hour
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}