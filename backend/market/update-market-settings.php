<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
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

function getUserId($user) {
    if (is_object($user)) {
        return (int)($user->user_id ?? 0);
    }

    if (is_array($user)) {
        return (int)($user["user_id"] ?? 0);
    }

    return 0;
}

function normalizeBool($value, $default = 0) {
    if ($value === null || $value === "") {
        return $default;
    }

    return (int)$value === 1 ? 1 : 0;
}

function normalizeTimeValue($value) {
    $value = trim((string)($value ?? ""));

    if ($value === "") {
        return null;
    }

    if (preg_match("/^\d{2}:\d{2}$/", $value)) {
        return $value . ":00";
    }

    if (preg_match("/^\d{2}:\d{2}:\d{2}$/", $value)) {
        return $value;
    }

    throw new Exception("Invalid time format");
}

function uploadToCloudinary($file, $folder) {
    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;

    if (!$cloudName) {
        throw new Exception("Cloudinary not configured");
    }

    if (!isset($file["tmp_name"]) || $file["error"] !== UPLOAD_ERR_OK) {
        throw new Exception("Invalid upload file");
    }

    if (!file_exists($file["tmp_name"])) {
        throw new Exception("Uploaded file missing");
    }

    if ($file["size"] > 10 * 1024 * 1024) {
        throw new Exception("Image too large. Max 10MB allowed.");
    }

    $mime = mime_content_type($file["tmp_name"]);

    $allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif"
    ];

    if (!in_array($mime, $allowedMimes)) {
        throw new Exception("Invalid image type");
    }

    $ch = curl_init("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload");

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_POSTFIELDS => [
            "file" => new CURLFile($file["tmp_name"]),
            "upload_preset" => "unsigned_upload",
            "folder" => $folder
        ]
    ]);

    $result = curl_exec($ch);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("Cloudinary cURL Error: " . $error);
    }

    curl_close($ch);

    $decoded = json_decode($result, true);

    if (!is_array($decoded)) {
        throw new Exception("Invalid Cloudinary response");
    }

    if (!empty($decoded["error"])) {
        throw new Exception($decoded["error"]["message"] ?? "Cloudinary upload failed");
    }

    if (empty($decoded["secure_url"])) {
        throw new Exception("Cloudinary upload failed");
    }

    return $decoded["secure_url"];
}

try {
    $user = requireRole(["vendor", "admin"]);
    $user_id = getUserId($user);

    if (!$user_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $fullname = trim($_POST["fullname"] ?? "");
    $address = trim($_POST["address"] ?? "");
    $nearby = trim($_POST["nearby"] ?? "");

    $shop_name = trim($_POST["shop_name"] ?? "");
    $shop_description = trim($_POST["shop_description"] ?? "");
    $phone = trim($_POST["phone"] ?? "");

    $is_accepting_orders = normalizeBool($_POST["is_accepting_orders"] ?? 1, 1);
    $operating_hours_enabled = normalizeBool($_POST["operating_hours_enabled"] ?? 0, 0);
    $opens_at = normalizeTimeValue($_POST["opens_at"] ?? "");
    $closes_at = normalizeTimeValue($_POST["closes_at"] ?? "");
    $closed_message = trim($_POST["closed_message"] ?? "");

    if ($fullname === "") {
        response(false, "Full name is required", null, 400);
    }

    if ($shop_name === "") {
        response(false, "Shop name is required", null, 400);
    }

    if ($operating_hours_enabled === 1 && (!$opens_at || !$closes_at)) {
        response(false, "Opening and closing time are required when operating hours are enabled", null, 400);
    }

    if ($operating_hours_enabled === 0) {
        $opens_at = null;
        $closes_at = null;
    }

    if ($closed_message === "") {
        $closed_message = "Shop is closed now. Please order during operating hours.";
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        UPDATE users
        SET
            fullname = ?,
            address = ?,
            nearby = ?,
            updated_at = NOW()
        WHERE user_id = ?
    ");

    if (!$stmt) {
        throw new Exception("User update prepare failed: " . $conn->error);
    }

    $stmt->bind_param(
        "sssi",
        $fullname,
        $address,
        $nearby,
        $user_id
    );

    $stmt->execute();

    $shopCheck = $conn->prepare("
        SELECT id
        FROM shops
        WHERE owner_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    if (!$shopCheck) {
        throw new Exception("Shop check prepare failed: " . $conn->error);
    }

    $shopCheck->bind_param("i", $user_id);
    $shopCheck->execute();

    $shop = $shopCheck->get_result()->fetch_assoc();

    if (!$shop) {
        throw new Exception("Shop profile not found");
    }

    $stmt2 = $conn->prepare("
        UPDATE shops
        SET
            shop_name = ?,
            shop_description = ?,
            phone = ?,
            address = ?,
            nearby_landmark = ?,
            is_accepting_orders = ?,
            operating_hours_enabled = ?,
            opens_at = ?,
            closes_at = ?,
            closed_message = ?,
            updated_at = NOW()
        WHERE owner_id = ?
    ");

    if (!$stmt2) {
        throw new Exception("Shop update prepare failed: " . $conn->error);
    }

    $stmt2->bind_param(
        "sssssissssi",
        $shop_name,
        $shop_description,
        $phone,
        $address,
        $nearby,
        $is_accepting_orders,
        $operating_hours_enabled,
        $opens_at,
        $closes_at,
        $closed_message,
        $user_id
    );

    $stmt2->execute();

    if (
        isset($_FILES["profile_picture"]) &&
        $_FILES["profile_picture"]["error"] === UPLOAD_ERR_OK
    ) {
        $profileUrl = uploadToCloudinary(
            $_FILES["profile_picture"],
            "users/{$user_id}/profile"
        );

        $stmtLogo = $conn->prepare("
            UPDATE shops
            SET shop_logo = ?, updated_at = NOW()
            WHERE owner_id = ?
        ");

        if (!$stmtLogo) {
            throw new Exception("Logo update prepare failed: " . $conn->error);
        }

        $stmtLogo->bind_param("si", $profileUrl, $user_id);
        $stmtLogo->execute();
    }

    if (
        isset($_FILES["cover_photo"]) &&
        $_FILES["cover_photo"]["error"] === UPLOAD_ERR_OK
    ) {
        $coverUrl = uploadToCloudinary(
            $_FILES["cover_photo"],
            "users/{$user_id}/cover"
        );

        $stmtCover = $conn->prepare("
            UPDATE shops
            SET shop_cover_photo = ?, updated_at = NOW()
            WHERE owner_id = ?
        ");

        if (!$stmtCover) {
            throw new Exception("Cover update prepare failed: " . $conn->error);
        }

        $stmtCover->bind_param("si", $coverUrl, $user_id);
        $stmtCover->execute();
    }

    $conn->commit();

    response(true, "Market settings updated successfully");
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Update market settings failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}