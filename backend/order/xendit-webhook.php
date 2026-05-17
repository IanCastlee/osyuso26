<?php

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../vendor/autoload.php";

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";

try {
    $expectedToken = $_ENV["XENDIT_CALLBACK_TOKEN"] ?? "";
    $receivedToken = $_SERVER["HTTP_X_CALLBACK_TOKEN"] ?? "";

    if (!$expectedToken || !hash_equals($expectedToken, $receivedToken)) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid callback token"
        ]);
        exit;
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

        echo json_encode([
            "success" => true,
            "message" => "Webhook received, no matching order"
        ]);
        exit;
    }

    if ($order["payment_status"] === "paid") {
        $conn->commit();

        echo json_encode([
            "success" => true,
            "message" => "Order already paid"
        ]);
        exit;
    }

    $update = $conn->prepare("
        UPDATE orders
        SET payment_status = ?
        WHERE id = ?
    ");

    $update->bind_param("si", $payment_status, $order["id"]);
    $update->execute();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Webhook processed"
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log($e->getMessage());

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Webhook failed"
    ]);
}

exit;
