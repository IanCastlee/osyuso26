<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

// ================= AUTH CHECK =================
$user = requireRole(["vendor", "admin"]);

// ================= CLOUDINARY CHECK =================
$cloudName = CLOUDINARY_CLOUD_NAME ?? null;

if (!$cloudName) {
    response(false, "Cloudinary not configured");
}

try {

    // ================= START TRANSACTION =================
    $conn->begin_transaction();

    // ================= GET USER =================
    $vendor_id = $user->user_id;

    // ================= GET INPUT =================
    $tag = trim($_POST['tag'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');

    $start_date = $_POST['start_date'] ?? null;
    $expires_at = $_POST['expires_at'] ?? null;

    // ================= VALIDATION =================
    if (
        !$title ||
        !$description ||
        !$start_date ||
        !$expires_at
    ) {
        throw new Exception("Missing required fields");
    }

    // ================= DATE VALIDATION =================
    $start = new DateTime($start_date);
    $end = new DateTime($expires_at);

    if ($end <= $start) {
        throw new Exception(
            "Expiration date must be greater than start date"
        );
    }

    // ================= HOURS =================
    $diffSeconds =
        $end->getTimestamp() -
        $start->getTimestamp();

    $total_hours = ceil($diffSeconds / 3600);

    if ($total_hours < 1) {
        $total_hours = 1;
    }

    // ================= PRICING =================
    // ================= GET SETTINGS =================
$settingsQuery = $conn->query("
    SELECT promotion_price_per_hour
    FROM admin_settings
    LIMIT 1
");

$settings = $settingsQuery->fetch_assoc();

$price_per_hour =
    $settings['promotion_price_per_hour'] ?? 20;

    $total_price =
        $total_hours * $price_per_hour;

    // ================= DEFAULT IMAGE =================
    $imageUrl = null;

    // ================= IMAGE UPLOAD =================
    if (!empty($_FILES['image']['tmp_name'])) {

        $tmp_name = $_FILES['image']['tmp_name'];

        // ================= FILE ERROR =================
        if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {

            throw new Exception(
                "Image upload failed. Error code: " .
                $_FILES['image']['error']
            );
        }

        // ================= FILE EXISTS =================
        if (!file_exists($tmp_name)) {
            throw new Exception("Uploaded image missing");
        }

        // ================= FILE SIZE =================
        $fileSize = $_FILES['image']['size'];

        // 10MB
        if ($fileSize > 10 * 1024 * 1024) {
            throw new Exception(
                "Image too large. Max 10MB allowed."
            );
        }

        // ================= MIME CHECK =================
        $mime = mime_content_type($tmp_name);

        $allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        ];

        if (!in_array($mime, $allowedMimes)) {
            throw new Exception("Invalid image type");
        }

        // ================= CLOUDINARY =================
        $ch = curl_init(
            "https://api.cloudinary.com/v1_1/$cloudName/image/upload"
        );

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);

        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            "file" => new CURLFile($tmp_name),
            "upload_preset" => "unsigned_upload",
            "folder" => "featured-promotions/{$vendor_id}"
        ]);

        $response = curl_exec($ch);

        // ================= CURL ERROR =================
        if (curl_errno($ch)) {

            $curlError = curl_error($ch);

            curl_close($ch);

            throw new Exception(
                "Cloudinary cURL Error: " . $curlError
            );
        }

        curl_close($ch);

        // ================= RESPONSE =================
        $result = json_decode($response, true);

        if (!$result) {
            throw new Exception(
                "Invalid Cloudinary response"
            );
        }

        // ================= CLOUDINARY ERROR =================
        if (!empty($result['error'])) {

            $cloudinaryError =
                $result['error']['message']
                ?? 'Cloudinary upload failed';

            throw new Exception($cloudinaryError);
        }

        // ================= SUCCESS CHECK =================
        if (empty($result['secure_url'])) {
            throw new Exception(
                "Cloudinary upload failed"
            );
        }

        $imageUrl = $result['secure_url'];
    }

    // ================= INSERT PROMOTION =================
    $stmt = $conn->prepare("
        INSERT INTO featured_promotions
        (
            vendor_id,
            tag,
            title,
            description,
            image_path,
            start_date,
            expires_at,
            total_hours,
            total_price,
            status,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending',
            NOW()
        )
    ");

    $stmt->bind_param(
        "issssssid",
        $vendor_id,
        $tag,
        $title,
        $description,
        $imageUrl,
        $start_date,
        $expires_at,
        $total_hours,
        $total_price
    );

    if (!$stmt->execute()) {
        throw new Exception(
            "Failed to create promotion"
        );
    }

    $promotion_id = $stmt->insert_id;

    // ================= COMMIT =================
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Promotion submitted successfully",
        "data" => [
            "promotion_id" => $promotion_id,
            "image" => $imageUrl,
            "total_hours" => $total_hours,
            "total_price" => $total_price
        ]
    ]);

} catch (Exception $e) {

    // ================= ROLLBACK =================
    if ($conn->connect_errno === 0) {
        $conn->rollback();
    }

    error_log($e->getMessage());

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}