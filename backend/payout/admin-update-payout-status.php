<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = [], $statusCode = 200) {
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

function queueAdminEmails(
    $conn,
    $subject,
    $bodyHtml,
    $bodyText,
    $relatedType,
    $relatedId,
    $dedupePrefix
) {
    $stmt = $conn->prepare("
        SELECT user_id, fullname, email
        FROM users
        WHERE role = 'admin'
          AND email IS NOT NULL
          AND email != ''
    ");

    $stmt->execute();
    $result = $stmt->get_result();

    $queued = 0;

    while ($admin = $result->fetch_assoc()) {
        $ok = queueEmail(
            $conn,
            $admin["email"],
            $admin["fullname"] ?: "Admin",
            $subject,
            $bodyHtml,
            $bodyText,
            $relatedType,
            $relatedId,
            $dedupePrefix . "_" . $admin["user_id"]
        );

        if ($ok) {
            $queued++;
        }
    }

    return $queued;
}

try {
    requireRole(["admin"]);

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $payout_id = filter_var($input["payout_id"] ?? null, FILTER_VALIDATE_INT);
    $status = $input["status"] ?? "";

    $allowedStatuses = ["pending", "processing", "paid", "failed", "cancelled"];

    if (!$payout_id) {
        response(false, "Payout ID is required", [], 400);
    }

    if (!in_array($status, $allowedStatuses, true)) {
        response(false, "Invalid payout status", [], 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.status,
            p.reference_no,
            p.gross_amount,
            p.commission_amount,
            p.net_amount,
            p.vendor_id,
            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM payouts p
        LEFT JOIN users u
            ON u.user_id = p.vendor_id
        WHERE p.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $payout_id);
    $stmt->execute();

    $payout = $stmt->get_result()->fetch_assoc();

    if (!$payout) {
        $conn->rollback();
        response(false, "Payout not found", [], 404);
    }

    if (in_array($payout["status"], ["paid", "cancelled"], true)) {
        $conn->rollback();
        response(false, "This payout can no longer be updated.", [], 400);
    }

    $processedAtValue = null;
    $paidAtValue = null;
    $failureReason = null;

    if ($status === "processing") {
        $processedAtValue = date("Y-m-d H:i:s");
    }

    if ($status === "paid") {
        $processedAtValue = date("Y-m-d H:i:s");
        $paidAtValue = date("Y-m-d H:i:s");
    }

    if ($status === "failed") {
        $failureReason = $input["failure_reason"] ?? "Marked failed by admin";
    }

    $update = $conn->prepare("
        UPDATE payouts
        SET
            status = ?,
            processed_at = COALESCE(?, processed_at),
            paid_at = COALESCE(?, paid_at),
            failure_reason = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $update->bind_param(
        "ssssi",
        $status,
        $processedAtValue,
        $paidAtValue,
        $failureReason,
        $payout_id
    );

    $update->execute();

    if ($status === "paid") {
        $earningStatus = "paid";
    } elseif ($status === "failed" || $status === "cancelled") {
        $earningStatus = "available";
    } else {
        $earningStatus = "processing";
    }

    $earningUpdate = $conn->prepare("
        UPDATE vendor_earnings
        SET
            status = ?,
            payout_id = CASE
                WHEN ? IN ('failed', 'cancelled') THEN NULL
                ELSE payout_id
            END,
            updated_at = NOW()
        WHERE payout_id = ?
    ");

    $earningUpdate->bind_param("ssi", $earningStatus, $status, $payout_id);
    $earningUpdate->execute();

    $vendorEmailQueued = false;
    $adminEmailsQueued = 0;

    if ($status === "paid") {
        $vendorName = $payout["vendor_name"] ?: "Vendor";
        $vendorEmail = $payout["vendor_email"] ?? null;
        $referenceNo = $payout["reference_no"] ?: "Payout #" . $payout_id;

        $grossAmount = number_format((float)$payout["gross_amount"], 2);
        $commissionAmount = number_format((float)$payout["commission_amount"], 2);
        $netAmount = number_format((float)$payout["net_amount"], 2);

        $vendorSubject = "Payout Released - {$referenceNo}";

        $vendorBodyHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Payout Released</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your payout has been marked as paid.</p>
                <p><strong>Reference:</strong> " . h($referenceNo) . "</p>
                <p><strong>Gross Sales:</strong> PHP {$grossAmount}</p>
                <p><strong>Platform Fee:</strong> PHP {$commissionAmount}</p>
                <p><strong>Net Payout:</strong> PHP {$netAmount}</p>
                <br>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $vendorBodyText =
            "Your payout has been marked as paid. " .
            "Reference: {$referenceNo}. " .
            "Gross Sales: PHP {$grossAmount}. " .
            "Platform Fee: PHP {$commissionAmount}. " .
            "Net Payout: PHP {$netAmount}.";

        $vendorEmailQueued = queueEmail(
            $conn,
            $vendorEmail,
            $vendorName,
            $vendorSubject,
            $vendorBodyHtml,
            $vendorBodyText,
            "payout",
            $payout_id,
            "payout_paid_vendor_email_" . $payout_id
        );

        $adminSubject = "Payout Marked Paid - {$referenceNo}";

        $adminBodyHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Payout Marked Paid</h2>
                <p>A vendor payout has been marked as paid.</p>
                <p><strong>Reference:</strong> " . h($referenceNo) . "</p>
                <p><strong>Vendor:</strong> " . h($vendorName) . "</p>
                <p><strong>Gross Sales:</strong> PHP {$grossAmount}</p>
                <p><strong>Platform Fee:</strong> PHP {$commissionAmount}</p>
                <p><strong>Net Payout:</strong> PHP {$netAmount}</p>
            </div>
        ";

        $adminBodyText =
            "A vendor payout has been marked as paid. " .
            "Reference: {$referenceNo}. " .
            "Vendor: {$vendorName}. " .
            "Gross Sales: PHP {$grossAmount}. " .
            "Platform Fee: PHP {$commissionAmount}. " .
            "Net Payout: PHP {$netAmount}.";

        $adminEmailsQueued = queueAdminEmails(
            $conn,
            $adminSubject,
            $adminBodyHtml,
            $adminBodyText,
            "payout",
            $payout_id,
            "payout_paid_admin_email_" . $payout_id
        );
    }

    $conn->commit();

    response(true, "Payout status updated", [
        "payout_id" => $payout_id,
        "status" => $status,
        "vendor_email_queued" => $vendorEmailQueued,
        "admin_emails_queued" => $adminEmailsQueued
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