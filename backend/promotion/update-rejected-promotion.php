<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $statusCode = 200) {
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

function h($value) {
    return htmlspecialchars((string)($value ?? ""), ENT_QUOTES, "UTF-8");
}

function uploadPromotionImage($cloudName, $vendorId) {
    if (empty($_FILES["image"]["tmp_name"])) {
        return null;
    }

    if (!$cloudName) {
        throw new Exception("Cloudinary not configured");
    }

    $tmpName = $_FILES["image"]["tmp_name"];

    if ($_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
        throw new Exception("Image upload failed. Error code: " . $_FILES["image"]["error"]);
    }

    if (!file_exists($tmpName)) {
        throw new Exception("Uploaded image missing");
    }

    if ($_FILES["image"]["size"] > 10 * 1024 * 1024) {
        throw new Exception("Image too large. Max 10MB allowed.");
    }

    $mime = mime_content_type($tmpName);

    $allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!in_array($mime, $allowedMimes, true)) {
        throw new Exception("Invalid image type");
    }

    $ch = curl_init("https://api.cloudinary.com/v1_1/$cloudName/image/upload");

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_POSTFIELDS => [
            "file" => new CURLFile($tmpName),
            "upload_preset" => "unsigned_upload",
            "folder" => "featured-promotions/{$vendorId}"
        ]
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
        throw new Exception($result["error"]["message"] ?? "Cloudinary upload failed");
    }

    if (empty($result["secure_url"])) {
        throw new Exception("Cloudinary upload failed");
    }

    return $result["secure_url"];
}

function createNotification(
    $conn,
    $userId,
    $actorUserId,
    $type,
    $title,
    $message,
    $relatedType,
    $relatedId,
    $dedupeKey
) {
    $stmt = $conn->prepare("
        INSERT INTO notifications
        (
            user_id,
            actor_user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            dedupe_key,
            created_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->bind_param(
        "iissssis",
        $userId,
        $actorUserId,
        $type,
        $title,
        $message,
        $relatedType,
        $relatedId,
        $dedupeKey
    );

    $stmt->execute();

    return $stmt->affected_rows > 0;
}

function queueEmail(
    $conn,
    $toEmail,
    $toName,
    $subject,
    $bodyHtml,
    $bodyText,
    $relatedType,
    $relatedId,
    $dedupeKey
) {
    if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $stmt = $conn->prepare("
        INSERT INTO email_queue
        (
            to_email,
            to_name,
            subject,
            body_html,
            body_text,
            related_type,
            related_id,
            dedupe_key,
            created_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->bind_param(
        "ssssssis",
        $toEmail,
        $toName,
        $subject,
        $bodyHtml,
        $bodyText,
        $relatedType,
        $relatedId,
        $dedupeKey
    );

    $stmt->execute();

    return $stmt->affected_rows > 0;
}

try {
    $user = requireRole(["vendor"]);
    $vendorId = (int)($user->user_id ?? 0);

    if (!$vendorId) {
        throw new Exception("Unauthorized vendor");
    }

    $promotionId = (int)($_POST["promotion_id"] ?? 0);
    $tag = trim($_POST["tag"] ?? "");
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");

    if (!$promotionId) {
        throw new Exception("Promotion ID is required");
    }

    if ($title === "") {
        throw new Exception("Title is required");
    }

    if ($description === "") {
        throw new Exception("Description is required");
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            fp.id,
            fp.vendor_id,
            fp.product_id,
            fp.title,
            fp.description,
            fp.image_path,
            fp.status,
            fp.payment_status,
            fp.total_hours,
            fp.total_price,

            p.name AS product_name,
            s.shop_name,

            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM featured_promotions fp
        LEFT JOIN products p
            ON p.id = fp.product_id
        LEFT JOIN shops s
            ON s.id = p.shop_id
        LEFT JOIN users u
            ON u.user_id = fp.vendor_id
        WHERE fp.id = ?
            AND fp.vendor_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("ii", $promotionId, $vendorId);
    $stmt->execute();

    $promotion = $stmt->get_result()->fetch_assoc();

    if (!$promotion) {
        throw new Exception("Promotion not found");
    }

    if ($promotion["status"] !== "rejected") {
        throw new Exception("Only rejected promotions can be revised");
    }

    if ($promotion["payment_status"] !== "paid") {
        throw new Exception("Only paid rejected promotions can be revised without a new payment");
    }

    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;
    $newImageUrl = uploadPromotionImage($cloudName, $vendorId);
    $imagePath = $newImageUrl ?: $promotion["image_path"];

    $update = $conn->prepare("
        UPDATE featured_promotions
        SET
            tag = ?,
            title = ?,
            description = ?,
            image_path = ?,
            status = 'pending',
            updated_at = NOW()
        WHERE id = ?
            AND vendor_id = ?
            AND status = 'rejected'
            AND payment_status = 'paid'
    ");

    $update->bind_param(
        "ssssii",
        $tag,
        $title,
        $description,
        $imagePath,
        $promotionId,
        $vendorId
    );

    $update->execute();

    if ($update->affected_rows < 1) {
        throw new Exception("No promotion was updated");
    }

    $vendorName = $promotion["vendor_name"] ?: "Vendor";
    $productName = $promotion["product_name"] ?: "the selected product";
    $shopName = $promotion["shop_name"] ?: "the vendor shop";

    $adminStmt = $conn->prepare("
        SELECT user_id, fullname, email
        FROM users
        WHERE role = 'admin'
            AND status = 'active'
    ");

    $adminStmt->execute();
    $admins = $adminStmt->get_result();

    $notificationCreated = false;
    $emailQueued = false;

    while ($admin = $admins->fetch_assoc()) {
        $adminId = (int)$admin["user_id"];
        $adminName = $admin["fullname"] ?: "Admin";
        $dedupeKey = "promotion_revised_admin_" . $adminId . "_" . $promotionId . "_" . time();

        $notif = createNotification(
            $conn,
            $adminId,
            $vendorId,
            "promotion_revised",
            "Promotion revised",
            "{$vendorName} revised a rejected featured promotion. Please review \"{$title}\".",
            "featured_promotion",
            $promotionId,
            $dedupeKey
        );

        $notificationCreated = $notificationCreated || $notif;

        $subject = "Promotion Revised for Review - Promotion #{$promotionId}";

        $bodyHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Promotion Revised</h2>
                <p>Hello " . h($adminName) . ",</p>
                <p><strong>" . h($vendorName) . "</strong> revised a rejected featured promotion.</p>
                <p><strong>Promotion:</strong> " . h($title) . "</p>
                <p><strong>Product:</strong> " . h($productName) . "</p>
                <p><strong>Shop:</strong> " . h($shopName) . "</p>
                <p>Please review it again in the admin dashboard.</p>
            </div>
        ";

        $bodyText =
            "{$vendorName} revised a rejected featured promotion. " .
            "Promotion: {$title}. Product: {$productName}. Please review it again.";

        $email = queueEmail(
            $conn,
            $admin["email"] ?? null,
            $adminName,
            $subject,
            $bodyHtml,
            $bodyText,
            "featured_promotion",
            $promotionId,
            $dedupeKey . "_email"
        );

        $emailQueued = $emailQueued || $email;
    }

    $conn->commit();

    response(true, "Promotion revised and sent for admin review", [
        "promotion_id" => $promotionId,
        "status" => "pending",
        "payment_status" => "paid",
        "image_path" => $imagePath,
        "notification_created" => $notificationCreated,
        "email_queued" => $emailQueued
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Update rejected promotion failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;