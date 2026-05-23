<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

date_default_timezone_set("Asia/Manila");

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

function h($value) {
    return htmlspecialchars((string)($value ?? ""), ENT_QUOTES, "UTF-8");
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

function getPlatformCommissionRate($conn) {
    $rate = 10.00;

    $stmt = $conn->prepare("
        SELECT platform_commission_rate
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $stmt->execute();
    $setting = $stmt->get_result()->fetch_assoc();

    if ($setting && $setting["platform_commission_rate"] !== null) {
        $rate = (float)$setting["platform_commission_rate"];
    }

    if ($rate < 0 || $rate > 100) {
        throw new Exception("Invalid platform commission rate");
    }

    return $rate;
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

    try {
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
    } catch (Throwable $e) {
        error_log("Create notification failed: " . $e->getMessage());
        return false;
    }
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

    try {
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
    } catch (Throwable $e) {
        error_log("Queue email failed: " . $e->getMessage());
        return false;
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
        SELECT
            o.id,
            o.user_id,
            o.shop_id,
            o.product_id,
            o.payment_status,
            o.quantity,
            o.weight,

            p.name AS product_name,

            s.owner_id AS vendor_user_id,
            s.shop_name,

            cu.fullname AS customer_name,
            cu.email AS customer_email,

            vu.fullname AS vendor_name,
            vu.email AS vendor_email
        FROM orders o
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN users cu
            ON cu.user_id = o.user_id
        LEFT JOIN users vu
            ON vu.user_id = s.owner_id
        WHERE o.xendit_invoice_id = ?
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

    $previousPaymentStatus = $order["payment_status"];

    if ($previousPaymentStatus === "paid" && $payment_status !== "paid") {
        $conn->commit();

        response(true, "Order already paid. Non-paid webhook ignored.", 200, [
            "order_id" => $order["id"],
            "payment_status" => $previousPaymentStatus
        ]);
    }

    $shouldDeductStock =
        $payment_status === "paid" &&
        $previousPaymentStatus !== "paid";

    $update = $conn->prepare("
        UPDATE orders
        SET payment_status = ?
        WHERE id = ?
    ");

    $update->bind_param("si", $payment_status, $order["id"]);
    $update->execute();

    $stockDeducted = false;
    $deductAmount = 0;

    if ($shouldDeductStock) {
        $productId = (int)$order["product_id"];
        $quantity = (float)($order["quantity"] ?? 0);
        $weight = (float)($order["weight"] ?? 0);

        $deductAmount = $weight > 0 ? $weight : $quantity;

        if ($productId <= 0 || $deductAmount <= 0) {
            throw new Exception("Invalid order quantity or product");
        }

        $productStmt = $conn->prepare("
            SELECT id, stock
            FROM products
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $productStmt->bind_param("i", $productId);
        $productStmt->execute();

        $product = $productStmt->get_result()->fetch_assoc();

        if (!$product) {
            throw new Exception("Product not found for stock deduction");
        }

        $currentStock = (float)$product["stock"];
        $newStock = max(0, $currentStock - $deductAmount);

        if ($currentStock < $deductAmount) {
            error_log(
                "Stock shortage on order " . $order["id"] .
                ". Current stock: " . $currentStock .
                ", deduct: " . $deductAmount
            );
        }

        $stockUpdate = $conn->prepare("
            UPDATE products
            SET stock = ?, updated_at = NOW()
            WHERE id = ?
        ");

        $stockUpdate->bind_param("di", $newStock, $productId);
        $stockUpdate->execute();

        $stockDeducted = true;
    }

    $receiptCreated = false;
    $notificationCreated = false;
    $emailQueued = false;
    $vendorEarningSynced = false;

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
            $receiptCreated = true;
        }

        $commissionRate = getPlatformCommissionRate($conn);
        $orderIdForEarning = (int)$order["id"];

        $earningStmt = $conn->prepare("
            INSERT INTO vendor_earnings (
                vendor_id,
                order_id,
                order_item_id,
                product_id,
                gross_amount,
                commission_rate,
                commission_amount,
                net_amount,
                status,
                available_at
            )
            SELECT
                s.owner_id AS vendor_id,
                o.id AS order_id,
                o.id AS order_item_id,
                o.product_id,
                o.total_amount AS gross_amount,
                ? AS commission_rate,
                ROUND(o.total_amount * (? / 100), 2) AS commission_amount,
                ROUND(o.total_amount - (o.total_amount * (? / 100)), 2) AS net_amount,
                'available' AS status,
                NOW() AS available_at
            FROM orders o
            INNER JOIN shops s
                ON s.id = o.shop_id
            WHERE o.id = ?
              AND o.payment_status = 'paid'
              AND s.owner_id IS NOT NULL
            LIMIT 1
            ON DUPLICATE KEY UPDATE
                status = IF(
                    payout_id IS NULL AND status IN ('pending', 'available'),
                    'available',
                    status
                ),
                available_at = IF(
                    payout_id IS NULL AND available_at IS NULL,
                    NOW(),
                    available_at
                ),
                updated_at = NOW()
        ");

        $earningStmt->bind_param(
            "dddi",
            $commissionRate,
            $commissionRate,
            $commissionRate,
            $orderIdForEarning
        );

        $earningStmt->execute();

        $vendorEarningSynced = $earningStmt->affected_rows > 0;

        $orderId = (int)$order["id"];
        $productName = $order["product_name"] ?: "your product";
        $shopName = $order["shop_name"] ?: "the shop";

        $customerNotification = createNotification(
            $conn,
            (int)$order["user_id"],
            "payment_success",
            "Payment successful",
            "Your payment for {$productName} was successful. Please claim your order at {$shopName}.",
            "order",
            $orderId,
            "payment_success_customer_order_" . $orderId
        );

        $vendorNotification = false;

        if (!empty($order["vendor_user_id"])) {
            $vendorNotification = createNotification(
                $conn,
                (int)$order["vendor_user_id"],
                "new_paid_order",
                "New paid order",
                "A customer paid for {$productName}. Prepare this order for claiming.",
                "order",
                $orderId,
                "new_paid_order_vendor_order_" . $orderId,
                (int)$order["user_id"]
            );
        }

        $notificationCreated = $customerNotification || $vendorNotification;

        $customerName = $order["customer_name"] ?: "Customer";
        $vendorName = $order["vendor_name"] ?: "Vendor";

        $customerSubject = "Payment Successful - Order #{$orderId}";
        $customerHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Payment Successful</h2>
                <p>Hello " . h($customerName) . ",</p>
                <p>Your payment for <strong>" . h($productName) . "</strong> was successful.</p>
                <p>Please claim your order at <strong>" . h($shopName) . "</strong>.</p>
                <p><strong>Order ID:</strong> #{$orderId}</p>
                <br>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $customerText =
            "Your payment for {$productName} was successful. " .
            "Please claim your order at {$shopName}. Order ID: #{$orderId}.";

        $customerEmailQueued = queueEmail(
            $conn,
            $order["customer_email"] ?? null,
            $customerName,
            $customerSubject,
            $customerHtml,
            $customerText,
            "order",
            $orderId,
            "payment_success_customer_email_order_" . $orderId
        );

        $vendorSubject = "New Paid Order - Order #{$orderId}";
        $vendorHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>New Paid Order</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>A customer paid for <strong>" . h($productName) . "</strong>.</p>
                <p>Please prepare this order for claiming.</p>
                <p><strong>Order ID:</strong> #{$orderId}</p>
            </div>
        ";

        $vendorText =
            "A customer paid for {$productName}. " .
            "Please prepare this order for claiming. Order ID: #{$orderId}.";

        $vendorEmailQueued = queueEmail(
            $conn,
            $order["vendor_email"] ?? null,
            $vendorName,
            $vendorSubject,
            $vendorHtml,
            $vendorText,
            "order",
            $orderId,
            "new_paid_order_vendor_email_order_" . $orderId
        );

        $emailQueued = $customerEmailQueued || $vendorEmailQueued;
    }

    $conn->commit();

    response(true, "Webhook processed", 200, [
        "order_id" => $order["id"],
        "payment_status" => $payment_status,
        "stock_deducted" => $stockDeducted,
        "deducted_amount" => $deductAmount,
        "receipt_created" => $receiptCreated,
        "vendor_earning_synced" => $vendorEarningSynced,
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

    error_log("Xendit webhook failed: " . $e->getMessage());

    response(false, "Webhook failed", 400);
}