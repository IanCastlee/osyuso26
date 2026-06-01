<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

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

function ensureAdminSettingsRow($conn) {
    $result = $conn->query("SELECT id FROM admin_settings ORDER BY id ASC LIMIT 1");

    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return (int)$row["id"];
    }

    $stmt = $conn->prepare("
        INSERT INTO admin_settings (
            promotion_price_per_hour,
            platform_commission_rate,
            payout_release_day,
            payout_release_time,
            payout_hold_days,
            email,
            phone,
            fb_url,
            created_at,
            updated_at
        )
        VALUES (0, 0, 1, '00:00:00', 0, '', '', '', NOW(), NOW())
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->execute();

    return (int)$stmt->insert_id;
}

try {
    requireRole(["admin"]);

    $settingsId = ensureAdminSettingsRow($conn);

    $stmt = $conn->prepare("
        SELECT
            id,
            promotion_price_per_hour,
            platform_commission_rate,
            payout_release_day,
            payout_release_time,
            payout_hold_days,
            email,
            phone,
            fb_url,
            created_at,
            updated_at
        FROM admin_settings
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $settingsId);
    $stmt->execute();

    $settings = $stmt->get_result()->fetch_assoc();

    if (!$settings) {
        response(false, "Admin settings not found", null, 404);
    }

    $settings["id"] = (int)$settings["id"];
    $settings["promotion_price_per_hour"] = (float)$settings["promotion_price_per_hour"];
    $settings["platform_commission_rate"] = (float)$settings["platform_commission_rate"];
    $settings["payout_release_day"] = (int)$settings["payout_release_day"];
    $settings["payout_hold_days"] = (int)$settings["payout_hold_days"];

    response(true, "Admin settings fetched successfully", $settings);
} catch (Throwable $e) {
    error_log("Get admin settings failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}