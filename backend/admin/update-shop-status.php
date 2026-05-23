<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = [], $statusCode = 200) {
    if (ob_get_length()) ob_clean();

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

function getUserValue($user, $key) {
    if (is_object($user)) {
        return $user->{$key} ?? null;
    }

    if (is_array($user)) {
        return $user[$key] ?? null;
    }

    return null;
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
            status,
            attempts,
            created_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, NOW())
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

function createNotification(
    $conn,
    $userId,
    $type,
    $title,
    $message,
    $relatedType,
    $relatedId,
    $dedupeKey,
    $actorUserId = null
) {
    if (!$userId || !$dedupeKey) {
        return false;
    }

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

try {
    $admin = requireRole(["admin"]);
    $adminId = (int)getUserValue($admin, "user_id");

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $shop_id = filter_var($input["shop_id"] ?? null, FILTER_VALIDATE_INT);
    $status = $input["status"] ?? "";
    $reason = trim($input["reason"] ?? "");

    $allowedStatuses = ["active", "inactive", "banned"];

    if (!$shop_id) {
        response(false, "Shop ID is required", [], 400);
    }

    if (!in_array($status, $allowedStatuses, true)) {
        response(false, "Invalid shop status", [], 400);
    }

    if ($status === "banned" && strlen($reason) < 8) {
        response(false, "A clear reason is required when banning a shop.", [], 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.owner_id,
            s.shop_name,
            s.status,
            u.fullname,
            u.email
        FROM shops s
        INNER JOIN users u
            ON u.user_id = s.owner_id
        WHERE s.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $shop_id);
    $stmt->execute();

    $shop = $stmt->get_result()->fetch_assoc();

    if (!$shop) {
        $conn->rollback();
        response(false, "Shop not found", [], 404);
    }

    $previousStatus = $shop["status"];

    $update = $conn->prepare("
        UPDATE shops
        SET status = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $update->bind_param("si", $status, $shop_id);
    $update->execute();

    $emailQueued = false;
    $notificationCreated = false;

    if ($previousStatus !== $status) {
        $vendorName = $shop["fullname"] ?: "Vendor";
        $vendorEmail = $shop["email"] ?? null;
        $shopName = $shop["shop_name"] ?: "your shop";

        if ($status === "active") {
            $subject = "Your Shop Has Been Activated";
            $title = "Shop Activated";
            $message = "Your shop, {$shopName}, has been activated and may now operate on OSYUSO.";
            $note = $reason ?: "No additional note was provided.";
            $notificationType = "shop_activated";
        } elseif ($status === "inactive") {
            $subject = "Your Shop Has Been Set as Inactive";
            $title = "Shop Set as Inactive";
            $message = "Your shop, {$shopName}, has been temporarily set as inactive.";
            $note = $reason ?: "Please contact OSYUSO support if you need clarification about this action.";
            $notificationType = "shop_inactive";
        } else {
            $subject = "Your Shop Has Been Banned";
            $title = "Shop Banned";
            $message = "Your shop, {$shopName}, has been banned from operating on OSYUSO.";
            $note = $reason;
            $notificationType = "shop_banned";
        }

        $bodyHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>" . h($title) . "</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>" . h($message) . "</p>
                <p><strong>Shop:</strong> " . h($shopName) . "</p>
                <p><strong>Status:</strong> " . h(ucfirst($status)) . "</p>
                <p><strong>Reason / Note:</strong> " . h($note) . "</p>
                <br>
                <p>If you believe this action was made in error, please contact OSYUSO support.</p>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $bodyText =
            "{$title}. {$message} Shop: {$shopName}. Status: {$status}. Reason / Note: {$note}.";

        $timestamp = date("YmdHis");

        $emailQueued = queueEmail(
            $conn,
            $vendorEmail,
            $vendorName,
            $subject,
            $bodyHtml,
            $bodyText,
            "shop",
            $shop_id,
            "shop_status_" . $status . "_vendor_email_" . $shop_id . "_" . $timestamp
        );

        $notificationCreated = createNotification(
            $conn,
            (int)$shop["owner_id"],
            $notificationType,
            $title,
            $message . " Reason / Note: " . $note,
            "shop",
            $shop_id,
            "shop_status_" . $status . "_notification_" . $shop_id . "_" . $timestamp,
            $adminId ?: null
        );
    }

    $conn->commit();

    response(true, "Shop status updated", [
        "shop_id" => $shop_id,
        "previous_status" => $previousStatus,
        "status" => $status,
        "email_queued" => $emailQueued,
        "notification_created" => $notificationCreated
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}