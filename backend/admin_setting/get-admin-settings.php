<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

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
    requireRole(["admin"]);

    $stmt = $conn->prepare("
        SELECT
            id,
            promotion_price_per_hour,
            platform_commission_rate,
            email,
            phone,
            fb_url,
            created_at,
            updated_at
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $stmt->execute();
    $settings = $stmt->get_result()->fetch_assoc();

    if (!$settings) {
        $promotionPrice = 0.00;
        $commissionRate = 10.00;
        $email = "osyuso38@gmail.com";
        $phone = "+63 912 345 6789";
        $fbUrl = "https://www.facebook.com/osyuso";

        $insert = $conn->prepare("
            INSERT INTO admin_settings
            (
                promotion_price_per_hour,
                platform_commission_rate,
                email,
                phone,
                fb_url,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");

        $insert->bind_param(
            "ddsss",
            $promotionPrice,
            $commissionRate,
            $email,
            $phone,
            $fbUrl
        );

        $insert->execute();

        $settings = [
            "id" => $insert->insert_id,
            "promotion_price_per_hour" => $promotionPrice,
            "platform_commission_rate" => $commissionRate,
            "email" => $email,
            "phone" => $phone,
            "fb_url" => $fbUrl,
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ];
    }

    response(true, "Admin settings fetched", $settings);
} catch (Throwable $e) {
    error_log("Get admin settings failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}