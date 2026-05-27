<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

require_once "../dbConn.php";
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
    $admin = requireRole(["admin"]);
    $adminId = (int)($admin->user_id ?? 0);

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        throw new Exception("Invalid JSON input");
    }

    $productId = (int)($input["product_id"] ?? 0);
    $status = trim($input["status"] ?? "");
    $reason = trim($input["reason"] ?? "");

    if (!$productId) {
        throw new Exception("Product ID is required");
    }

    if (!in_array($status, ["active", "inactive"], true)) {
        throw new Exception("Invalid product status");
    }

    if ($status === "inactive" && strlen($reason) < 8) {
        throw new Exception("A clear reason is required when setting a product inactive");
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.name,
            p.status,
            s.shop_name,
            u.user_id AS vendor_id,
            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        INNER JOIN users u
            ON u.user_id = s.owner_id
        WHERE p.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $productId);
    $stmt->execute();

    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    $update = $conn->prepare("
        UPDATE products
        SET status = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $update->bind_param("si", $status, $productId);
    $update->execute();

    $vendorId = (int)$product["vendor_id"];
    $vendorName = $product["vendor_name"] ?: "Vendor";
    $vendorEmail = $product["vendor_email"] ?? null;
    $productName = $product["name"] ?: "your product";
    $shopName = $product["shop_name"] ?: "your shop";

    if ($status === "active") {
        $notifTitle = "Product activated";
        $message = "Your product \"{$productName}\" has been activated and can be visible to customers if your shop is active.";
        $emailSubject = "Product Activated - {$productName}";

        $emailHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Product Activated</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your product <strong>" . h($productName) . "</strong> from <strong>" . h($shopName) . "</strong> has been activated.</p>
                <p>It can now be visible to customers if your shop is active.</p>
                <br>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $emailText = "Your product {$productName} has been activated.";
    } else {
        $notifTitle = "Product set as inactive";
        $message = "Your product \"{$productName}\" has been set as inactive. Reason: {$reason}";
        $emailSubject = "Product Set as Inactive - {$productName}";

        $emailHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#dc2626;'>Product Set as Inactive</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your product <strong>" . h($productName) . "</strong> from <strong>" . h($shopName) . "</strong> has been set as inactive.</p>
                <p><strong>Reason:</strong> " . h($reason) . "</p>
                <p>You may update the product details and contact OSYUSO support if needed.</p>
                <br>
                <p>Thank you for understanding.</p>
            </div>
        ";

        $emailText = "Your product {$productName} has been set as inactive. Reason: {$reason}";
    }

    $dedupeKey = "product_status_" . $status . "_" . $productId . "_" . time();

    $notificationCreated = createNotification(
        $conn,
        $vendorId,
        $adminId,
        "product_status_updated",
        $notifTitle,
        $message,
        "product",
        $productId,
        $dedupeKey
    );

    $emailQueued = queueEmail(
        $conn,
        $vendorEmail,
        $vendorName,
        $emailSubject,
        $emailHtml,
        $emailText,
        "product",
        $productId,
        $dedupeKey . "_email"
    );

    $conn->commit();

    response(true, "Product status updated successfully", [
        "product_id" => $productId,
        "status" => $status,
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

    error_log("Update product status failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;