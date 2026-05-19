<?php
ob_start();

include("../header.php");
header("Content-Type: application/json");

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

function normalizeDateTime($value) {
    $value = trim((string)$value);

    if ($value === "") {
        return null;
    }

    $value = str_replace("T", " ", $value);

    try {
        $date = new DateTime($value);
        return $date->format("Y-m-d H:i:s");
    } catch (Throwable $e) {
        throw new Exception("Invalid sale date format");
    }
}

try {
    $user = requireRole(["vendor", "admin"]);
    $owner_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;

    if (!$cloudName) {
        response(false, "Cloudinary not configured", null, 500);
    }

    $product_id = (int)($_POST["product_id"] ?? 0);
    $category_id = $_POST["category_id"] ?? null;
    $subcategory_id = $_POST["subcategory_id"] ?? null;
    $name = trim($_POST["name"] ?? "");
    $description = trim($_POST["description"] ?? "");
    $price = $_POST["price"] ?? null;
    $stock = $_POST["stock"] ?? null;
    $unit_type = $_POST["unit_type"] ?? null;

    $sale_type = $_POST["sale_type"] ?? "none";
    $sale_value = $_POST["sale_value"] ?? 0;
    $sale_starts_at = normalizeDateTime($_POST["sale_starts_at"] ?? "");
    $sale_ends_at = normalizeDateTime($_POST["sale_ends_at"] ?? "");

    $allowedSaleTypes = ["none", "percent", "fixed"];

    if (!in_array($sale_type, $allowedSaleTypes, true)) {
        response(false, "Invalid sale type", null, 400);
    }

    if (
        !$product_id ||
        !$category_id ||
        !$subcategory_id ||
        !$name ||
        $price === null ||
        $price === "" ||
        $stock === null ||
        $stock === "" ||
        !$unit_type
    ) {
        response(false, "Missing required fields", null, 400);
    }

    $price = (float)$price;
    $stock = (int)$stock;
    $sale_value = (float)$sale_value;

    if ($price < 0) {
        response(false, "Price cannot be negative", null, 400);
    }

    if ($stock < 0) {
        response(false, "Stock cannot be negative", null, 400);
    }

    if ($sale_type === "none") {
        $sale_value = 0;
        $sale_starts_at = null;
        $sale_ends_at = null;
    } else {
        if ($sale_value <= 0) {
            response(false, "Sale value is required", null, 400);
        }

        if ($sale_type === "percent" && $sale_value > 100) {
            response(false, "Percent discount cannot be more than 100", null, 400);
        }

        if ($sale_type === "fixed" && $sale_value > $price) {
            response(false, "Discount cannot be greater than product price", null, 400);
        }

        if ($sale_starts_at && $sale_ends_at) {
            $start = new DateTime($sale_starts_at);
            $end = new DateTime($sale_ends_at);

            if ($end <= $start) {
                response(false, "Sale end must be after sale start", null, 400);
            }
        }
    }

    $conn->begin_transaction();

    if ($role === "admin") {
        $check = $conn->prepare("
            SELECT id, shop_id
            FROM products
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $check->bind_param("i", $product_id);
    } else {
        $check = $conn->prepare("
            SELECT p.id, p.shop_id
            FROM products p
            INNER JOIN shops s
                ON s.id = p.shop_id
            WHERE p.id = ?
                AND s.owner_id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $check->bind_param("ii", $product_id, $owner_id);
    }

    if (!$check) {
        throw new Exception("Product check prepare failed: " . $conn->error);
    }

    $check->execute();
    $product = $check->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found or not allowed");
    }

    $update = $conn->prepare("
        UPDATE products
        SET
            category_id = ?,
            subcategory_id = ?,
            name = ?,
            description = ?,
            price = ?,
            stock = ?,
            unit_type = ?,
            sale_type = ?,
            sale_value = ?,
            sale_starts_at = ?,
            sale_ends_at = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    if (!$update) {
        throw new Exception("Product update prepare failed: " . $conn->error);
    }

    $update->bind_param(
        "iissdissdssi",
        $category_id,
        $subcategory_id,
        $name,
        $description,
        $price,
        $stock,
        $unit_type,
        $sale_type,
        $sale_value,
        $sale_starts_at,
        $sale_ends_at,
        $product_id
    );

    if (!$update->execute()) {
        throw new Exception("Failed to update product");
    }

    $uploadedImages = [];

    if (!empty($_FILES["images"]["tmp_name"][0])) {
        $resetPrimary = $conn->prepare("
            UPDATE product_images
            SET is_primary = 0
            WHERE product_id = ?
        ");

        if (!$resetPrimary) {
            throw new Exception("Image reset prepare failed: " . $conn->error);
        }

        $resetPrimary->bind_param("i", $product_id);
        $resetPrimary->execute();

        foreach ($_FILES["images"]["tmp_name"] as $key => $tmp_name) {
            if ($_FILES["images"]["error"][$key] !== UPLOAD_ERR_OK) {
                throw new Exception(
                    "Image upload failed. Error code: " .
                    $_FILES["images"]["error"][$key]
                );
            }

            if (!file_exists($tmp_name)) {
                throw new Exception("Uploaded file missing");
            }

            $fileSize = $_FILES["images"]["size"][$key];

            if ($fileSize > 10 * 1024 * 1024) {
                throw new Exception("Image too large. Max 10MB allowed.");
            }

            $mime = mime_content_type($tmp_name);

            $allowedMimes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif"
            ];

            if (!in_array($mime, $allowedMimes, true)) {
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
                "folder" => "products/{$product["shop_id"]}"
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
            $uploadedImages[] = $imageUrl;

            $isPrimary = $key === 0 ? 1 : 0;

            $imgStmt = $conn->prepare("
                INSERT INTO product_images (
                    product_id,
                    image_path,
                    is_primary,
                    created_at
                )
                VALUES (?, ?, ?, NOW())
            ");

            if (!$imgStmt) {
                throw new Exception("Image insert prepare failed: " . $conn->error);
            }

            $imgStmt->bind_param(
                "isi",
                $product_id,
                $imageUrl,
                $isPrimary
            );

            if (!$imgStmt->execute()) {
                throw new Exception("Failed to save product image");
            }
        }
    }

    $conn->commit();

    response(true, "Product updated successfully", [
        "product_id" => $product_id,
        "sale_type" => $sale_type,
        "sale_value" => $sale_value,
        "sale_starts_at" => $sale_starts_at,
        "sale_ends_at" => $sale_ends_at,
        "images" => $uploadedImages
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Update product failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}