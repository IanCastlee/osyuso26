<?php
ob_start();

include("../header.php");

header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

$user = requireRole(["vendor", "admin"]);

$cloudName = CLOUDINARY_CLOUD_NAME ?? null;

if (!$cloudName) {
    response(false, "Cloudinary not configured");
}

try {
    $conn->begin_transaction();

    $vendor_id = $user->user_id;
    $role = $user->role ?? "";

    $product_id = (int)($_POST["product_id"] ?? 0);
    $tag = trim($_POST["tag"] ?? "");
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");
    $start_date = $_POST["start_date"] ?? null;
    $expires_at = $_POST["expires_at"] ?? null;

    if (
        !$product_id ||
        !$title ||
        !$description ||
        !$start_date ||
        !$expires_at
    ) {
        throw new Exception("Missing required fields");
    }

    if ($role === "admin") {
        $productStmt = $conn->prepare("
            SELECT id
            FROM products
            WHERE id = ?
            LIMIT 1
        ");

        $productStmt->bind_param("i", $product_id);
    } else {
        $productStmt = $conn->prepare("
            SELECT p.id
            FROM products p
            INNER JOIN shops s
                ON s.id = p.shop_id
            WHERE p.id = ?
                AND s.owner_id = ?
            LIMIT 1
        ");

        $productStmt->bind_param("ii", $product_id, $vendor_id);
    }

    if (!$productStmt) {
        throw new Exception("Product validation prepare failed: " . $conn->error);
    }

    $productStmt->execute();
    $productResult = $productStmt->get_result();

    if ($productResult->num_rows === 0) {
        throw new Exception("Invalid product ID or product does not belong to your shop");
    }

    $start = new DateTime($start_date);
    $end = new DateTime($expires_at);

    if ($end <= $start) {
        throw new Exception("Expiration date must be greater than start date");
    }

    $diffSeconds = $end->getTimestamp() - $start->getTimestamp();
    $total_hours = max(1, ceil($diffSeconds / 3600));

    $settingsQuery = $conn->query("
        SELECT promotion_price_per_hour
        FROM admin_settings
        LIMIT 1
    ");

    $settings = $settingsQuery ? $settingsQuery->fetch_assoc() : null;
    $price_per_hour = (float)($settings["promotion_price_per_hour"] ?? 20);
    $total_price = $total_hours * $price_per_hour;

    $imageUrl = null;

    if (!empty($_FILES["image"]["tmp_name"])) {
        $tmp_name = $_FILES["image"]["tmp_name"];

        if ($_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
            throw new Exception(
                "Image upload failed. Error code: " . $_FILES["image"]["error"]
            );
        }

        if (!file_exists($tmp_name)) {
            throw new Exception("Uploaded image missing");
        }

        if ($_FILES["image"]["size"] > 10 * 1024 * 1024) {
            throw new Exception("Image too large. Max 10MB allowed.");
        }

        $mime = mime_content_type($tmp_name);

        $allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!in_array($mime, $allowedMimes)) {
            throw new Exception("Invalid image type");
        }

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

        $cloudinaryResponse = curl_exec($ch);

        if (curl_errno($ch)) {
            $curlError = curl_error($ch);
            curl_close($ch);
            throw new Exception("Cloudinary cURL Error: " . $curlError);
        }

        curl_close($ch);

        $result = json_decode($cloudinaryResponse, true);

        if (!$result) {
            throw new Exception("Invalid Cloudinary response");
        }

        if (!empty($result["error"])) {
            throw new Exception(
                $result["error"]["message"] ?? "Cloudinary upload failed"
            );
        }

        if (empty($result["secure_url"])) {
            throw new Exception("Cloudinary upload failed");
        }

        $imageUrl = $result["secure_url"];
    }

    $stmt = $conn->prepare("
        INSERT INTO featured_promotions
        (
            product_id,
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
            ?,
            'pending',
            NOW()
        )
    ");

    if (!$stmt) {
        throw new Exception("Promotion insert prepare failed: " . $conn->error);
    }

    $stmt->bind_param(
        "iissssssid",
        $product_id,
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
        throw new Exception("Failed to create promotion");
    }

    $promotion_id = $stmt->insert_id;

    $conn->commit();

    response(true, "Promotion submitted successfully", [
        "promotion_id" => $promotion_id,
        "product_id" => $product_id,
        "image" => $imageUrl,
        "total_hours" => $total_hours,
        "price_per_hour" => $price_per_hour,
        "total_price" => $total_price
    ]);
} catch (Exception $e) {
    $conn->rollback();

    error_log($e->getMessage());

    response(false, $e->getMessage());
}