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

//  HERE ILALAGAY ANG CLOUDINARY CHECK (IMPORTANT)
$cloudName = CLOUDINARY_CLOUD_NAME ?? null;

if (!$cloudName) {
    response(false, "Cloudinary not configured");
}


try {

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
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
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

    $stmt->execute();

    $product_id = $stmt->insert_id;

    // ================= CLOUDINARY =================
    $imageUrls = [];

    if (!empty($_FILES['images'])) {

        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {

            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {

                $file = $tmp_name;

                $ch = curl_init("https://api.cloudinary.com/v1_1/$cloudName/image/upload");

                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);

                curl_setopt($ch, CURLOPT_POSTFIELDS, [
                    "file" => new CURLFile($file),
                    "upload_preset" => "unsigned_upload",
                    "folder" => "products/{$vendor_id}"
                ]);

                $response = curl_exec($ch);
                curl_close($ch);

                $result = json_decode($response, true);

                if (!empty($result['secure_url'])) {

                    $imageUrl = $result['secure_url'];
                    $imageUrls[] = $imageUrl;

                    // save to DB
                    $imgStmt = $conn->prepare("
                        INSERT INTO product_images (product_id, image_path, is_primary)
                        VALUES (?, ?, 0)
                    ");

                    $imgStmt->bind_param("is", $product_id, $imageUrl);
                    $imgStmt->execute();
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Product added successfully",
        "data" => [
            "product_id" => $product_id,
            "images" => $imageUrls
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}