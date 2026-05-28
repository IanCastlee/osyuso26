<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

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

function uploadToCloudinary($file, $userId) {
    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;

    if (!$cloudName) {
        throw new Exception("Cloudinary not configured");
    }

    if ($file["error"] !== UPLOAD_ERR_OK) {
        throw new Exception("Profile image upload failed");
    }

    if (!file_exists($file["tmp_name"])) {
        throw new Exception("Uploaded profile image missing");
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        throw new Exception("Profile image is too large. Max 5MB allowed.");
    }

    $mime = mime_content_type($file["tmp_name"]);

    $allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!in_array($mime, $allowedMimes)) {
        throw new Exception("Invalid profile image type");
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
            "folder" => "profile-pictures/customers/{$userId}"
        ]
    ]);

    $cloudinaryResponse = curl_exec($ch);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("Cloudinary cURL Error: " . $error);
    }

    curl_close($ch);

    $result = json_decode($cloudinaryResponse, true);

    if (!is_array($result)) {
        throw new Exception("Invalid Cloudinary response");
    }

    if (!empty($result["error"])) {
        throw new Exception($result["error"]["message"] ?? "Cloudinary upload failed");
    }

    if (empty($result["secure_url"])) {
        throw new Exception("Cloudinary upload failed");
    }

    return $result["secure_url"];
}

try {
    $user = requireRole(["customer"]);

    if (is_object($user)) {
        $user_id = (int)($user->user_id ?? 0);
    } elseif (is_array($user)) {
        $user_id = (int)($user["user_id"] ?? 0);
    } else {
        $user_id = 0;
    }

    if (!$user_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $fullname = trim($_POST["fullname"] ?? "");
    $address = trim($_POST["address"] ?? "");
    $nearby = trim($_POST["nearby"] ?? "");

    if ($fullname === "") {
        response(false, "Full name is required", null, 400);
    }

    if (mb_strlen($fullname) < 2 || mb_strlen($fullname) > 120) {
        response(false, "Full name must be between 2 and 120 characters", null, 400);
    }

    if (mb_strlen($address) > 255) {
        response(false, "Address is too long", null, 400);
    }

    if (mb_strlen($nearby) > 255) {
        response(false, "Nearby landmark is too long", null, 400);
    }

    $profilePicture = null;

    if (!empty($_FILES["profile_picture"]["tmp_name"])) {
        $profilePicture = uploadToCloudinary($_FILES["profile_picture"], $user_id);
    }

    if ($profilePicture) {
        $stmt = $conn->prepare("
            UPDATE users
            SET
                fullname = ?,
                address = ?,
                nearby = ?,
                profile_picture = ?,
                updated_at = NOW()
            WHERE user_id = ?
                AND role = 'customer'
        ");

        $stmt->bind_param(
            "ssssi",
            $fullname,
            $address,
            $nearby,
            $profilePicture,
            $user_id
        );
    } else {
        $stmt = $conn->prepare("
            UPDATE users
            SET
                fullname = ?,
                address = ?,
                nearby = ?,
                updated_at = NOW()
            WHERE user_id = ?
                AND role = 'customer'
        ");

        $stmt->bind_param(
            "sssi",
            $fullname,
            $address,
            $nearby,
            $user_id
        );
    }

    $stmt->execute();

    $getUser = $conn->prepare("
        SELECT
            user_id,
            profile_picture,
            fullname,
            address,
            nearby,
            email,
            role,
            status,
            email_verified,
            created_at,
            updated_at
        FROM users
        WHERE user_id = ?
            AND role = 'customer'
        LIMIT 1
    ");

    $getUser->bind_param("i", $user_id);
    $getUser->execute();

    $updatedUser = $getUser->get_result()->fetch_assoc();

    response(true, "Profile updated successfully", [
        "user" => $updatedUser
    ]);
} catch (Throwable $e) {
    error_log("Update customer profile failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}