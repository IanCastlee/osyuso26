<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";

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
    $stmt = $conn->prepare("
        SELECT
            email,
            phone,
            fb_url
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $stmt->execute();
    $settings = $stmt->get_result()->fetch_assoc();

    if (!$settings) {
        $settings = [
            "email" => "osyuso38@gmail.com",
            "phone" => "+63 912 345 6789",
            "fb_url" => "https://www.facebook.com/osyuso"
        ];
    }

    response(true, "Public settings fetched", $settings);
} catch (Throwable $e) {
    error_log("Get public settings failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}