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
    if (is_object($user)) return $user->{$key} ?? null;
    if (is_array($user)) return $user[$key] ?? null;
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

    $customer_id = filter_var($input["customer_id"] ?? null, FILTER_VALIDATE_INT);
    $status = $input["status"] ?? "";
    $messageInput = trim($input["message"] ?? "");
    $messageTemplate = trim($input["message_template"] ?? "custom");

    $allowedStatuses = ["active", "banned"];

    if (!$customer_id) {
        response(false, "Customer ID is required", [], 400);
    }

    if (!in_array($status, $allowedStatuses, true)) {
        response(false, "Invalid customer status", [], 400);
    }

    if (strlen($messageInput) < 8) {
        response(false, "A clear customer message is required.", [], 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            user_id,
            fullname,
            email,
            role,
            COALESCE(status, 'active') AS status
        FROM users
        WHERE user_id = ?
          AND role = 'customer'
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $customer_id);
    $stmt->execute();

    $customer = $stmt->get_result()->fetch_assoc();

    if (!$customer) {
        $conn->rollback();
        response(false, "Customer not found", [], 404);
    }

    $previousStatus = $customer["status"];

    if ($previousStatus === $status) {
        $conn->rollback();
        response(false, "Customer already has this status.", [], 400);
    }

    $update = $conn->prepare("
        UPDATE users
        SET status = ?,
            updated_at = NOW()
        WHERE user_id = ?
          AND role = 'customer'
    ");

    $update->bind_param("si", $status, $customer_id);
    $update->execute();

    $customerName = $customer["fullname"] ?: "Customer";
    $customerEmail = $customer["email"] ?? null;

    if ($status === "banned") {
        $subject = "Your OSYUSO Account Has Been Restricted";
        $title = "Account Restricted";
        $intro = "Your OSYUSO customer account has been restricted by the admin team.";
        $notificationType = "customer_banned";
    } else {
        $subject = "Your OSYUSO Account Has Been Reactivated";
        $title = "Account Reactivated";
        $intro = "Your OSYUSO customer account has been reactivated.";
        $notificationType = "customer_unbanned";
    }

    $bodyHtml = "
        <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
            <h2 style='color:#f97316;'>" . h($title) . "</h2>
            <p>Hello " . h($customerName) . ",</p>
            <p>" . h($intro) . "</p>
            <p><strong>Message from OSYUSO:</strong></p>
            <p>" . nl2br(h($messageInput)) . "</p>
            <br>
            <p>If you believe this action was made in error, please contact OSYUSO support.</p>
            <p>Thank you for using OSYUSO.</p>
        </div>
    ";

    $bodyText =
        "{$title}. {$intro} Message from OSYUSO: {$messageInput}";

    $timestamp = date("YmdHis");

    $emailQueued = queueEmail(
        $conn,
        $customerEmail,
        $customerName,
        $subject,
        $bodyHtml,
        $bodyText,
        "customer_account",
        $customer_id,
        "customer_status_" . $status . "_email_" . $customer_id . "_" . $timestamp
    );

    $notificationCreated = createNotification(
        $conn,
        $customer_id,
        $notificationType,
        $title,
        $intro . " " . $messageInput,
        "customer_account",
        $customer_id,
        "customer_status_" . $status . "_notification_" . $customer_id . "_" . $timestamp,
        $adminId ?: null
    );

    $conn->commit();

    response(true, "Customer status updated", [
        "customer_id" => $customer_id,
        "previous_status" => $previousStatus,
        "status" => $status,
        "message_template" => $messageTemplate,
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