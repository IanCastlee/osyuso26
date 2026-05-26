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
        INSERT IGNORE INTO notifications
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
        INSERT IGNORE INTO email_queue
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

    $promotionId = (int)($input["promotion_id"] ?? 0);
    $status = trim($input["status"] ?? "");
    $reason = trim($input["reason"] ?? "");

    if (!$promotionId) {
        throw new Exception("Promotion ID is required");
    }

    if (!in_array($status, ["active", "rejected"], true)) {
        throw new Exception("Invalid promotion status");
    }

    if ($status === "rejected" && strlen($reason) < 8) {
        throw new Exception("A clear rejection reason is required");
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            fp.id,
            fp.vendor_id,
            fp.title,
            fp.description,
            fp.total_hours,
            fp.payment_status,
            fp.status,
            p.name AS product_name,
            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM featured_promotions fp
        LEFT JOIN products p
            ON p.id = fp.product_id
        LEFT JOIN users u
            ON u.user_id = fp.vendor_id
        WHERE fp.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $promotionId);
    $stmt->execute();

    $promotion = $stmt->get_result()->fetch_assoc();

    if (!$promotion) {
        throw new Exception("Promotion not found");
    }

    if ($status === "active" && $promotion["payment_status"] !== "paid") {
        throw new Exception("Only paid promotions can be approved");
    }

    $vendorId = (int)$promotion["vendor_id"];
    $vendorName = $promotion["vendor_name"] ?: "Vendor";
    $vendorEmail = $promotion["vendor_email"] ?? null;
    $promotionTitle = $promotion["title"] ?: "Featured Promotion";
    $productName = $promotion["product_name"] ?: "your product";

    if ($status === "active") {
        $update = $conn->prepare("
            UPDATE featured_promotions
            SET
                status = 'active',
                start_date = NOW(),
                expires_at = DATE_ADD(NOW(), INTERVAL total_hours HOUR),
                updated_at = NOW()
            WHERE id = ?
                AND payment_status = 'paid'
        ");

        $update->bind_param("i", $promotionId);
        $update->execute();

        $freshStmt = $conn->prepare("
            SELECT start_date, expires_at
            FROM featured_promotions
            WHERE id = ?
            LIMIT 1
        ");

        $freshStmt->bind_param("i", $promotionId);
        $freshStmt->execute();

        $fresh = $freshStmt->get_result()->fetch_assoc();

        $message = "Your featured promotion \"{$promotionTitle}\" has been approved and is now active.";
        $emailSubject = "Promotion Approved - #{$promotionId}";

        $emailHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Promotion Approved</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your featured promotion <strong>" . h($promotionTitle) . "</strong> for <strong>" . h($productName) . "</strong> has been approved.</p>
                <p>It is now visible to customers.</p>
                <p><strong>Start:</strong> " . h($fresh["start_date"] ?? "") . "</p>
                <p><strong>End:</strong> " . h($fresh["expires_at"] ?? "") . "</p>
                <br>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $emailText = "Your featured promotion {$promotionTitle} has been approved and is now active.";
        $notifType = "promotion_approved";
        $notifTitle = "Promotion approved";
        $dedupe = "promotion_approved_" . $promotionId;
    } else {
        $update = $conn->prepare("
            UPDATE featured_promotions
            SET
                status = 'rejected',
                updated_at = NOW()
            WHERE id = ?
        ");

        $update->bind_param("i", $promotionId);
        $update->execute();

        $message = "Your featured promotion \"{$promotionTitle}\" was not approved. Reason: {$reason}";
        $emailSubject = "Promotion Not Approved - #{$promotionId}";

        $emailHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#dc2626;'>Promotion Not Approved</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your featured promotion <strong>" . h($promotionTitle) . "</strong> was not approved.</p>
                <p><strong>Reason:</strong> " . h($reason) . "</p>
                <p>You may revise your promotion and submit a new request.</p>
                <br>
                <p>Thank you for understanding.</p>
            </div>
        ";

        $emailText = "Your featured promotion {$promotionTitle} was not approved. Reason: {$reason}";
        $notifType = "promotion_rejected";
        $notifTitle = "Promotion rejected";
        $dedupe = "promotion_rejected_" . $promotionId;
    }

    $notificationCreated = createNotification(
        $conn,
        $vendorId,
        $adminId,
        $notifType,
        $notifTitle,
        $message,
        "featured_promotion",
        $promotionId,
        $dedupe
    );

    $emailQueued = queueEmail(
        $conn,
        $vendorEmail,
        $vendorName,
        $emailSubject,
        $emailHtml,
        $emailText,
        "featured_promotion",
        $promotionId,
        $dedupe . "_email"
    );

    $conn->commit();

    response(true, "Promotion status updated successfully", [
        "promotion_id" => $promotionId,
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

    error_log("Update promotion status failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;