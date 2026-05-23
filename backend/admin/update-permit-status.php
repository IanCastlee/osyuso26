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

    $permit_id = filter_var($input["permit_id"] ?? null, FILTER_VALIDATE_INT);
    $status = $input["status"] ?? "";
    $reason = trim($input["reason"] ?? "");

    $allowedStatuses = ["approved", "rejected"];

    if (!$permit_id) {
        response(false, "Permit ID is required", [], 400);
    }

    if (!in_array($status, $allowedStatuses, true)) {
        response(false, "Invalid permit status", [], 400);
    }

    if ($status === "rejected" && strlen($reason) < 8) {
        response(false, "A clear reason is required when rejecting a business permit.", [], 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            bp.id,
            bp.user_id,
            bp.status,
            bp.permit_number,
            u.fullname,
            u.email,
            u.status AS user_status,
            s.id AS shop_id,
            s.shop_name
        FROM business_permits bp
        INNER JOIN users u
            ON u.user_id = bp.user_id
        LEFT JOIN shops s
            ON s.owner_id = bp.user_id
        WHERE bp.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $permit_id);
    $stmt->execute();

    $permit = $stmt->get_result()->fetch_assoc();

    if (!$permit) {
        $conn->rollback();
        response(false, "Permit not found", [], 404);
    }

    $previousStatus = $permit["status"];

    $permitUpdate = $conn->prepare("
        UPDATE business_permits
        SET status = ?
        WHERE id = ?
    ");

    $permitUpdate->bind_param("si", $status, $permit_id);
    $permitUpdate->execute();

    $userStatus = "active";
    $shopStatus = $status === "approved" ? "active" : "inactive";

    $userUpdate = $conn->prepare("
        UPDATE users
        SET status = ?,
            updated_at = NOW()
        WHERE user_id = ?
    ");

    $userUpdate->bind_param("si", $userStatus, $permit["user_id"]);
    $userUpdate->execute();

    if (!empty($permit["shop_id"])) {
        $shopUpdate = $conn->prepare("
            UPDATE shops
            SET status = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $shopUpdate->bind_param("si", $shopStatus, $permit["shop_id"]);
        $shopUpdate->execute();
    }

    $emailQueued = false;
    $notificationCreated = false;

    if ($previousStatus !== $status) {
        $vendorName = $permit["fullname"] ?: "Vendor";
        $vendorEmail = $permit["email"] ?? null;
        $shopName = $permit["shop_name"] ?: "your shop";

        if ($status === "approved") {
            $subject = "Your Vendor Application Has Been Approved";
            $title = "Vendor Application Approved";
            $message = "Your business permit has been approved. Your shop, {$shopName}, is now active on OSYUSO.";
            $note = $reason ?: "You may now continue managing your shop and accepting orders.";
            $notificationType = "business_permit_approved";
        } else {
            $subject = "Your Vendor Application Was Not Approved";
            $title = "Vendor Application Not Approved";
            $message = "Your business permit could not be approved at this time.";
            $note = $reason;
            $notificationType = "business_permit_rejected";
        }

        $bodyHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>" . h($title) . "</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>" . h($message) . "</p>
                <p><strong>Shop:</strong> " . h($shopName) . "</p>
                <p><strong>Application status:</strong> " . h(ucfirst($status)) . "</p>
                <p><strong>Reason / Note:</strong> " . h($note) . "</p>
                <br>
                <p>If you need help with your application, please contact OSYUSO support.</p>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $bodyText =
            "{$title}. {$message} Shop: {$shopName}. Application status: {$status}. Reason / Note: {$note}.";

        $timestamp = date("YmdHis");

        $emailQueued = queueEmail(
            $conn,
            $vendorEmail,
            $vendorName,
            $subject,
            $bodyHtml,
            $bodyText,
            "business_permit",
            $permit_id,
            "business_permit_" . $status . "_vendor_email_" . $permit_id . "_" . $timestamp
        );

        $notificationCreated = createNotification(
            $conn,
            (int)$permit["user_id"],
            $notificationType,
            $title,
            $message . " Reason / Note: " . $note,
            "business_permit",
            $permit_id,
            "business_permit_" . $status . "_notification_" . $permit_id . "_" . $timestamp,
            $adminId ?: null
        );
    }

    $conn->commit();

    response(true, "Permit status updated", [
        "permit_id" => $permit_id,
        "previous_status" => $previousStatus,
        "permit_status" => $status,
        "user_status" => $userStatus,
        "shop_status" => $shopStatus,
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