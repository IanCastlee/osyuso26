<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";

function response($success, $message, $statusCode = 200, $data = null) {
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

function toMysqlDateTime($value) {
    if (!$value) {
        return date("Y-m-d H:i:s");
    }

    try {
        $date = new DateTimeImmutable($value);
        return $date->setTimezone(new DateTimeZone("Asia/Manila"))
            ->format("Y-m-d H:i:s");
    } catch (Throwable $e) {
        return date("Y-m-d H:i:s");
    }
}

function generateReceiptNo($orderId) {
    return "RCPT-" . date("Ymd") . "-" . str_pad($orderId, 6, "0", STR_PAD_LEFT);
}

try {
    $expectedToken = $_ENV["XENDIT_CALLBACK_TOKEN"] ?? "";
    $receivedToken = $_SERVER["HTTP_X_CALLBACK_TOKEN"] ?? "";

    if (!$expectedToken || !hash_equals($expectedToken, $receivedToken)) {
        response(false, "Invalid callback token", 401);
    }

    $payload = json_decode(file_get_contents("php://input"), true);

    if (!is_array($payload)) {
        throw new Exception("Invalid webhook payload");
    }

    $invoice_id = $payload["id"] ?? null;
    $status = $payload["status"] ?? null;

    if (!$invoice_id || !$status) {
        throw new Exception("Missing invoice id or status");
    }

    if ($status === "PAID" || $status === "SETTLED") {
        $payment_status = "paid";
    } elseif ($status === "EXPIRED") {
        $payment_status = "expired";
    } else {
        $payment_status = "pending";
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT id, payment_status
        FROM orders
        WHERE xendit_invoice_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("s", $invoice_id);
    $stmt->execute();

    $order = $stmt->get_result()->fetch_assoc();

    if (!$order) {
        $conn->commit();

        response(true, "Webhook received, no matching order");
    }

    $update = $conn->prepare("
        UPDATE orders
        SET payment_status = ?
        WHERE id = ?
    ");

    $update->bind_param("si", $payment_status, $order["id"]);
    $update->execute();

    if ($payment_status === "paid") {
        $checkReceipt = $conn->prepare("
            SELECT id
            FROM receipts
            WHERE order_id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $checkReceipt->bind_param("i", $order["id"]);
        $checkReceipt->execute();

        $existingReceipt = $checkReceipt->get_result()->fetch_assoc();

        if (!$existingReceipt) {
            $receipt_no = generateReceiptNo($order["id"]);
            $payment_reference = $payload["payment_id"] ?? $invoice_id;
            $payment_method = $payload["payment_method"] ?? null;
            $payment_channel = $payload["payment_channel"] ?? ($payload["ewallet_type"] ?? null);
            $amount_paid = (float)($payload["paid_amount"] ?? $payload["amount"] ?? 0);
            $paid_at = toMysqlDateTime($payload["paid_at"] ?? null);

            $receiptStmt = $conn->prepare("
                INSERT INTO receipts
                (
                    order_id,
                    receipt_no,
                    payment_provider,
                    payment_reference,
                    payment_method,
                    payment_channel,
                    amount_paid,
                    paid_at,
                    created_at
                )
                VALUES
                (
                    ?,
                    ?,
                    'xendit',
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW()
                )
            ");

            $receiptStmt->bind_param(
                "issssds",
                $order["id"],
                $receipt_no,
                $payment_reference,
                $payment_method,
                $payment_channel,
                $amount_paid,
                $paid_at
            );

            $receiptStmt->execute();
        }
    }

    $conn->commit();

    response(true, "Webhook processed", 200, [
        "order_id" => $order["id"],
        "payment_status" => $payment_status
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Xendit webhook failed: " . $e->getMessage());

    response(false, "Webhook failed", 400);
}