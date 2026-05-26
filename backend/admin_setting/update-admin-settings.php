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

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $promotionPrice = filter_var(
        $input["promotion_price_per_hour"] ?? null,
        FILTER_VALIDATE_FLOAT
    );

    $commissionRate = filter_var(
        $input["platform_commission_rate"] ?? null,
        FILTER_VALIDATE_FLOAT
    );

    $email = trim($input["email"] ?? "");
    $phone = trim($input["phone"] ?? "");
    $fbUrl = trim($input["fb_url"] ?? "");

    if ($promotionPrice === false || $promotionPrice < 0) {
        response(false, "Promotion price must be a valid non-negative number.", [], 400);
    }

    if ($commissionRate === false || $commissionRate < 0 || $commissionRate > 100) {
        response(false, "Platform commission rate must be between 0 and 100.", [], 400);
    }

    if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        response(false, "Valid support email is required.", [], 400);
    }

    if ($phone === "") {
        response(false, "Support phone is required.", [], 400);
    }

    if ($fbUrl === "" || !filter_var($fbUrl, FILTER_VALIDATE_URL)) {
        response(false, "Valid Facebook URL is required.", [], 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT id
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute();
    $settings = $stmt->get_result()->fetch_assoc();

    if ($settings) {
        $settingsId = (int)$settings["id"];

        $update = $conn->prepare("
            UPDATE admin_settings
            SET
                promotion_price_per_hour = ?,
                platform_commission_rate = ?,
                email = ?,
                phone = ?,
                fb_url = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $update->bind_param(
            "ddsssi",
            $promotionPrice,
            $commissionRate,
            $email,
            $phone,
            $fbUrl,
            $settingsId
        );

        $update->execute();
    } else {
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
        $settingsId = $insert->insert_id;
    }

    $fetch = $conn->prepare("
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
        WHERE id = ?
        LIMIT 1
    ");

    $fetch->bind_param("i", $settingsId);
    $fetch->execute();

    $updatedSettings = $fetch->get_result()->fetch_assoc();

    $conn->commit();

    response(true, "Admin settings updated", $updatedSettings);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Update admin settings failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}