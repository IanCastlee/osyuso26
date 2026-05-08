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

    // ================= GET INPUT =================
    $vendor_id = $user->user_id;

    $category_id = $_POST['category_id'] ?? null;
    $subcategory_id = $_POST['subcategory_id'] ?? null;
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = $_POST['price'] ?? null;
    $stock = $_POST['stock'] ?? null;
    $unit_type = $_POST['unit_type'] ?? null;

    // ================= VALIDATION =================
    if (!$category_id || !$subcategory_id || !$name) {
        throw new Exception("Missing required fields");
    }

    // ================= INSERT PRODUCT =================
    $stmt = $conn->prepare("
        INSERT INTO products 
        (vendor_id, category_id, subcategory_id, name, description, price, stock, unit_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    ");

    $stmt->bind_param(
        "iiissdis",
        $vendor_id,
        $category_id,
        $subcategory_id,
        $name,
        $description,
        $price,
        $stock,
        $unit_type
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to create product");
    }

    $product_id = $stmt->insert_id;

    // ================= CLOUDINARY =================
    $imageUrls = [];

    if (!empty($_FILES['images'])) {

        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {

            // ================= FILE ERROR CHECK =================
            if ($_FILES['images']['error'][$key] !== UPLOAD_ERR_OK) {

                error_log("Upload error code: " . $_FILES['images']['error'][$key]);

                throw new Exception(
                    "Image upload failed. Error code: " .
                    $_FILES['images']['error'][$key]
                );
            }

            // ================= FILE EXISTS =================
            if (!file_exists($tmp_name)) {
                throw new Exception("Uploaded file missing");
            }

            // ================= FILE SIZE CHECK =================
            $fileSize = $_FILES['images']['size'][$key];

            // 10MB LIMIT
            if ($fileSize > 10 * 1024 * 1024) {
                throw new Exception("Image too large. Max 10MB allowed.");
            }

            // ================= MIME VALIDATION =================
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

            // ================= CLOUDINARY REQUEST =================
            $ch = curl_init(
                "https://api.cloudinary.com/v1_1/$cloudName/image/upload"
            );

            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);

            // TIMEOUTS
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

            // LOCALHOST ONLY IF SSL ISSUE
            // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            curl_setopt($ch, CURLOPT_POSTFIELDS, [
                "file" => new CURLFile($tmp_name),
                "upload_preset" => "unsigned_upload",
                "folder" => "products/{$vendor_id}"
            ]);

            $response = curl_exec($ch);

            // ================= CURL ERROR =================
            if (curl_errno($ch)) {

                $curlError = curl_error($ch);

                curl_close($ch);

                throw new Exception("Cloudinary cURL Error: " . $curlError);
            }

            curl_close($ch);

            // ================= RESPONSE VALIDATION =================
            $result = json_decode($response, true);

            if (!$result) {
                throw new Exception("Invalid Cloudinary response");
            }

            // ================= CLOUDINARY ERROR =================
            if (!empty($result['error'])) {

                $cloudinaryError =
                    $result['error']['message'] ?? 'Cloudinary upload failed';

                throw new Exception($cloudinaryError);
            }

            // ================= SUCCESS CHECK =================
            if (empty($result['secure_url'])) {
                throw new Exception("Cloudinary upload failed");
            }

            $imageUrl = $result['secure_url'];

            $imageUrls[] = $imageUrl;

            // ================= SAVE IMAGE =================
            $imgStmt = $conn->prepare("
                INSERT INTO product_images 
                (product_id, image_path, is_primary)
                VALUES (?, ?, 1)
            ");

            $imgStmt->bind_param(
                "is",
                $product_id,
                $imageUrl
            );

            if (!$imgStmt->execute()) {
                throw new Exception("Failed to save image");
            }
        }
    }

    // ================= COMMIT =================
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Product added successfully",
        "data" => [
            "product_id" => $product_id,
            "images" => $imageUrls
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