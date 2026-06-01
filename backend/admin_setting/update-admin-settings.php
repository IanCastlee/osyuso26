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

function inputData() {
    $json = json_decode(file_get_contents("php://input"), true);
    return is_array($json) ? $json : $_POST;
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

function normalizeTimeValue($value) {
    $value = trim((string)$value);

    if (!preg_match("/^\d{2}:\d{2}(:\d{2})?$/", $value)) {
        response(false, "Invalid payout release time", null, 400);
    }

    if (strlen($value) === 5) {
        $value .= ":00";
    }

    $parts = explode(":", $value);
    $hour = (int)$parts[0];
    $minute = (int)$parts[1];
    $second = (int)$parts[2];

    if ($hour < 0 || $hour > 23 || $minute < 0 || $minute > 59 || $second < 0 || $second > 59) {
        response(false, "Invalid payout release time", null, 400);
    }

    return $value;
}

try {
    requireRole(["admin"]);

    $input = inputData();

    $promotionPricePerHour = isset($input["promotion_price_per_hour"])
        ? (float)$input["promotion_price_per_hour"]
        : null;

    $platformCommissionRate = isset($input["platform_commission_rate"])
        ? (float)$input["platform_commission_rate"]
        : null;

    $payoutReleaseDay = isset($input["payout_release_day"])
        ? (int)$input["payout_release_day"]
        : 1;

    $payoutReleaseTime = normalizeTimeValue($input["payout_release_time"] ?? "00:00:00");

    $payoutHoldDays = isset($input["payout_hold_days"])
        ? (int)$input["payout_hold_days"]
        : 0;

    $email = trim($input["email"] ?? "");
    $phone = trim($input["phone"] ?? "");
    $fbUrl = trim($input["fb_url"] ?? "");

    if ($promotionPricePerHour === null || $promotionPricePerHour < 0) {
        response(false, "Promotion price must be zero or higher", null, 400);
    }

    if ($platformCommissionRate === null || $platformCommissionRate < 0 || $platformCommissionRate > 100) {
        response(false, "Commission rate must be 0 to 100", null, 400);
    }

    if ($payoutReleaseDay < 1 || $payoutReleaseDay > 7) {
        response(false, "Invalid payout release day", null, 400);
    }

    if ($payoutHoldDays < 0) {
        response(false, "Payout hold days cannot be negative", null, 400);
    }

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        response(false, "Valid support email is required", null, 400);
    }

    if ($phone === "") {
        response(false, "Support phone is required", null, 400);
    }

    if ($fbUrl === "" || !filter_var($fbUrl, FILTER_VALIDATE_URL)) {
        response(false, "Valid Facebook URL is required", null, 400);
    }

    $settingsId = ensureAdminSettingsRow($conn);

    $stmt = $conn->prepare("
        UPDATE admin_settings
        SET
            promotion_price_per_hour = ?,
            platform_commission_rate = ?,
            payout_release_day = ?,
            payout_release_time = ?,
            payout_hold_days = ?,
            email = ?,
            phone = ?,
            fb_url = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param(
        "ddisisssi",
        $promotionPricePerHour,
        $platformCommissionRate,
        $payoutReleaseDay,
        $payoutReleaseTime,
        $payoutHoldDays,
        $email,
        $phone,
        $fbUrl,
        $settingsId
    );

    $stmt->execute();

    response(true, "Admin settings updated successfully", [
        "id" => $settingsId,
        "promotion_price_per_hour" => $promotionPricePerHour,
        "platform_commission_rate" => $platformCommissionRate,
        "payout_release_day" => $payoutReleaseDay,
        "payout_release_time" => $payoutReleaseTime,
        "payout_hold_days" => $payoutHoldDays,
        "email" => $email,
        "phone" => $phone,
        "fb_url" => $fbUrl
    ]);
} catch (Throwable $e) {
    error_log("Update admin settings failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}