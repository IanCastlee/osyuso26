<?php
include("../header.php");

header("Content-Type: application/json");

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

function uploadToCloudinary($file, $folder) {

    // ================= CLOUDINARY CONFIG =================
    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;

    if (!$cloudName) {
        error_log("Cloudinary cloud name missing");
        return null;
    }

    // ================= FILE CHECK =================
    if (!isset($file['tmp_name']) || $file['error'] !== 0) {
        error_log("Invalid upload file");
        return null;
    }

    $tmp_name = $file['tmp_name'];

    // ================= MIME VALIDATION =================
    $mime = mime_content_type($tmp_name);

    $allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif'
    ];

    if (!in_array($mime, $allowedMimes)) {
        error_log("Invalid image type: " . $mime);
        return null;
    }

    // ================= CLOUDINARY REQUEST =================
    $ch = curl_init(
        "https://api.cloudinary.com/v1_1/$cloudName/image/upload"
    );

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);

    // OPTIONAL TIMEOUTS
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        "file" => new CURLFile($tmp_name),
        "upload_preset" => "unsigned_upload",
        "folder" => $folder
    ]);

    $result = curl_exec($ch);

    // ================= CURL ERROR =================
    if (curl_errno($ch)) {

        error_log("Cloudinary cURL Error: " . curl_error($ch));

        curl_close($ch);

        return null;
    }

    // ================= DEBUG =================
    $responseCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    error_log("Cloudinary Response: " . $result);
    error_log("Cloudinary HTTP Code: " . $responseCode);

    curl_close($ch);

    $decoded = json_decode($result, true);

    // ================= CLOUDINARY ERROR =================
    if (!empty($decoded['error'])) {

        error_log(
            "Cloudinary Upload Error: " .
            $decoded['error']['message']
        );

        return null;
    }

    return $decoded;
}

try {

    // ================= AUTH =================
    $user = requireRole(["vendor", "admin"]);

    $user_id = $user->user_id;

    // ================= DEBUG FILES =================
    // error_log(print_r($_FILES, true));

    // ================= INPUT =================
    $fullname = $_POST['fullname'] ?? null;
    $address = $_POST['address'] ?? null;
    $nearby = $_POST['nearby'] ?? null;

    $shop_name = $_POST['shop_name'] ?? null;
    $shop_description = $_POST['shop_description'] ?? null;
    $phone = $_POST['phone'] ?? null;

    // ================= UPDATE USERS =================
    $stmt = $conn->prepare("
        UPDATE users 
        SET fullname=?, address=?, nearby=?, updated_at=NOW()
        WHERE user_id=?
    ");

    $stmt->bind_param(
        "sssi",
        $fullname,
        $address,
        $nearby,
        $user_id
    );

    $stmt->execute();

    // ================= UPDATE VENDOR PROFILE =================
    $stmt2 = $conn->prepare("
        UPDATE vendor_profiles 
        SET shop_name=?, 
            shop_description=?, 
            phone=?, 
            address=?, 
            nearby_landmark=?, 
            updated_at=NOW()
        WHERE user_id=?
    ");

    $stmt2->bind_param(
        "sssssi",
        $shop_name,
        $shop_description,
        $phone,
        $address,
        $nearby,
        $user_id
    );

    $stmt2->execute();

    // ================= PROFILE PICTURE =================
    if (
        isset($_FILES['profile_picture']) &&
        $_FILES['profile_picture']['error'] === 0
    ) {

        $upload = uploadToCloudinary(
            $_FILES['profile_picture'],
            "users/$user_id/profile"
        );

        if (!empty($upload['secure_url'])) {

            $profileUrl = $upload['secure_url'];

            $stmt = $conn->prepare("
                UPDATE users 
                SET profile_picture=?, updated_at=NOW()
                WHERE user_id=?
            ");

            $stmt->bind_param(
                "si",
                $profileUrl,
                $user_id
            );

            $stmt->execute();
        }
    }

    // ================= COVER PHOTO =================
    if (
        isset($_FILES['cover_photo']) &&
        $_FILES['cover_photo']['error'] === 0
    ) {

        $upload = uploadToCloudinary(
            $_FILES['cover_photo'],
            "users/$user_id/cover"
        );

        if (!empty($upload['secure_url'])) {

            $coverUrl = $upload['secure_url'];

            $stmt = $conn->prepare("
                UPDATE users 
                SET cover_photo=?, updated_at=NOW()
                WHERE user_id=?
            ");

            $stmt->bind_param(
                "si",
                $coverUrl,
                $user_id
            );

            $stmt->execute();
        }
    }

    // ================= SUCCESS =================
    response(
        true,
        "Market settings updated successfully"
    );

} catch (Exception $e) {

    error_log($e->getMessage());

    response(
        false,
        $e->getMessage()
    );
}