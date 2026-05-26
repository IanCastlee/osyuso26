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

function findOrderPayment($conn, $invoiceId) {
    $stmt = $conn->prepare("
        SELECT
            op.id AS order_payment_id,
            op.status AS current_attempt_status,
            op.amount AS payment_amount,

            o.id,
            o.user_id,
            o.shop_id,
            o.product_id,
            o.payment_status,
            o.quantity,
            o.weight,
            o.total_amount,

            p.name AS product_name,

            s.owner_id AS vendor_user_id,
            s.shop_name,

            cu.fullname AS customer_name,
            cu.email AS customer_email,

            vu.fullname AS vendor_name,
            vu.email AS vendor_email
        FROM order_payments op
        INNER JOIN orders o
            ON o.id = op.order_id
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN users cu
            ON cu.user_id = o.user_id
        LEFT JOIN users vu
            ON vu.user_id = s.owner_id
        WHERE op.xendit_invoice_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();

    return $stmt->get_result()->fetch_assoc();
}

function findPromotionPayment($conn, $invoiceId) {
    $stmt = $conn->prepare("
        SELECT
            pp.id AS promotion_payment_id,
            pp.status AS current_attempt_status,
            pp.amount AS payment_amount,

            fp.id AS promotion_id,
            fp.vendor_id,
            fp.product_id,
            fp.title AS promotion_title,
            fp.status AS promotion_status,
            fp.payment_status AS promotion_payment_status,
            fp.total_hours,
            fp.total_price,

            p.name AS product_name,
            s.shop_name,

            vu.fullname AS vendor_name,
            vu.email AS vendor_email
        FROM promotion_payments pp
        INNER JOIN featured_promotions fp
            ON fp.id = pp.promotion_id
        LEFT JOIN products p
            ON p.id = fp.product_id
        LEFT JOIN shops s
            ON s.id = p.shop_id
        LEFT JOIN users vu
            ON vu.user_id = fp.vendor_id
        WHERE pp.xendit_invoice_id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();

    return $stmt->get_result()->fetch_assoc();
}

function processOrderPayment($conn, $payload, $order, $orderPaymentStatus, $paymentAttemptStatus, $invoiceId) {
    $orderId = (int)$order["id"];
    $orderPaymentId = (int)$order["order_payment_id"];
    $previousPaymentStatus = $order["payment_status"];
    $previousAttemptStatus = $order["current_attempt_status"];

    if (
        ($previousPaymentStatus === "paid" || $previousAttemptStatus === "paid") &&
        $paymentAttemptStatus !== "paid"
    ) {
        return [
            "type" => "order",
            "ignored" => true,
            "message" => "Order already paid. Non-paid webhook ignored.",
            "data" => [
                "order_id" => $orderId,
                "payment_status" => $previousPaymentStatus,
                "payment_attempt_status" => $previousAttemptStatus
            ]
        ];
    }

    $paymentReference = $payload["payment_id"] ?? $invoiceId;
    $paymentMethod = $payload["payment_method"] ?? null;
    $paymentChannel = $payload["payment_channel"] ?? ($payload["ewallet_type"] ?? null);
    $paidAt = $paymentAttemptStatus === "paid"
        ? toMysqlDateTime($payload["paid_at"] ?? null)
        : null;

    if ($paymentAttemptStatus === "paid") {
        $updatePayment = $conn->prepare("
            UPDATE order_payments
            SET
                status = 'paid',
                payment_reference = ?,
                payment_method = ?,
                payment_channel = ?,
                paid_at = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $updatePayment->bind_param(
            "ssssi",
            $paymentReference,
            $paymentMethod,
            $paymentChannel,
            $paidAt,
            $orderPaymentId
        );

        $updatePayment->execute();
    } else {
        $updatePayment = $conn->prepare("
            UPDATE order_payments
            SET
                status = ?,
                updated_at = NOW()
            WHERE id = ?
                AND status <> 'paid'
        ");

        $updatePayment->bind_param("si", $paymentAttemptStatus, $orderPaymentId);
        $updatePayment->execute();
    }

    $shouldDeductStock =
        $orderPaymentStatus === "paid" &&
        $previousPaymentStatus !== "paid";

    $updateOrder = $conn->prepare("
        UPDATE orders
        SET payment_status = ?
        WHERE id = ?
    ");

    $updateOrder->bind_param("si", $orderPaymentStatus, $orderId);
    $updateOrder->execute();

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
                "Stock shortage on order " . $orderId .
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

    if ($orderPaymentStatus === "paid") {
        $checkReceipt = $conn->prepare("
            SELECT id
            FROM receipts
            WHERE order_id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $checkReceipt->bind_param("i", $orderId);
        $checkReceipt->execute();

        $existingReceipt = $checkReceipt->get_result()->fetch_assoc();

        if (!$existingReceipt) {
            $receiptNo = generateReceiptNo($orderId);
            $amountPaid = (float)($payload["paid_amount"] ?? $payload["amount"] ?? $order["payment_amount"] ?? 0);

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
                (?, ?, 'xendit', ?, ?, ?, ?, ?, NOW())
            ");

            $receiptStmt->bind_param(
                "issssds",
                $orderId,
                $receiptNo,
                $paymentReference,
                $paymentMethod,
                $paymentChannel,
                $amountPaid,
                $paidAt
            );

            $receiptStmt->execute();
            $receiptCreated = true;
        }

        $commissionRate = getPlatformCommissionRate($conn);

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
                'available' AS earning_status,
                NOW() AS available_at
            FROM orders o
            INNER JOIN shops s
                ON s.id = o.shop_id
            WHERE o.id = ?
                AND o.payment_status = 'paid'
                AND s.owner_id IS NOT NULL
            LIMIT 1
            ON DUPLICATE KEY UPDATE
                vendor_earnings.status = IF(
                    vendor_earnings.payout_id IS NULL
                    AND vendor_earnings.status IN ('pending', 'available'),
                    'available',
                    vendor_earnings.status
                ),
                vendor_earnings.available_at = IF(
                    vendor_earnings.payout_id IS NULL
                    AND vendor_earnings.available_at IS NULL,
                    NOW(),
                    vendor_earnings.available_at
                ),
                vendor_earnings.updated_at = NOW()
        ");

        $earningStmt->bind_param(
            "dddi",
            $commissionRate,
            $commissionRate,
            $commissionRate,
            $orderId
        );

        $earningStmt->execute();

        $vendorEarningSynced = $earningStmt->affected_rows > 0;

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

    return [
        "type" => "order",
        "ignored" => false,
        "message" => "Order webhook processed",
        "data" => [
            "payment_type" => "order",
            "order_id" => $orderId,
            "order_payment_id" => $orderPaymentId,
            "payment_status" => $orderPaymentStatus,
            "payment_attempt_status" => $paymentAttemptStatus,
            "stock_deducted" => $stockDeducted,
            "deducted_amount" => $deductAmount,
            "receipt_created" => $receiptCreated,
            "vendor_earning_synced" => $vendorEarningSynced,
            "notification_created" => $notificationCreated,
            "email_queued" => $emailQueued
        ]
    ];
}

function processPromotionPayment($conn, $payload, $promotion, $paymentAttemptStatus, $invoiceId) {
    $promotionId = (int)$promotion["promotion_id"];
    $promotionPaymentId = (int)$promotion["promotion_payment_id"];
    $vendorId = (int)$promotion["vendor_id"];
    $previousAttemptStatus = $promotion["current_attempt_status"];
    $previousPromotionPaymentStatus = $promotion["promotion_payment_status"];

    if (
        ($previousAttemptStatus === "paid" || $previousPromotionPaymentStatus === "paid") &&
        $paymentAttemptStatus !== "paid"
    ) {
        return [
            "type" => "promotion",
            "ignored" => true,
            "message" => "Promotion already paid. Non-paid webhook ignored.",
            "data" => [
                "payment_type" => "promotion",
                "promotion_id" => $promotionId,
                "promotion_payment_id" => $promotionPaymentId,
                "payment_status" => $previousPromotionPaymentStatus,
                "payment_attempt_status" => $previousAttemptStatus
            ]
        ];
    }

    $promotionPaymentStatus = $paymentAttemptStatus;
    $paymentReference = $payload["payment_id"] ?? $invoiceId;
    $paymentMethod = $payload["payment_method"] ?? null;
    $paymentChannel = $payload["payment_channel"] ?? ($payload["ewallet_type"] ?? null);
    $paidAt = $paymentAttemptStatus === "paid"
        ? toMysqlDateTime($payload["paid_at"] ?? null)
        : null;

    if ($paymentAttemptStatus === "paid") {
        $updatePayment = $conn->prepare("
            UPDATE promotion_payments
            SET
                status = 'paid',
                payment_reference = ?,
                payment_method = ?,
                payment_channel = ?,
                paid_at = ?,
                updated_at = NOW()
            WHERE id = ?
        ");

        $updatePayment->bind_param(
            "ssssi",
            $paymentReference,
            $paymentMethod,
            $paymentChannel,
            $paidAt,
            $promotionPaymentId
        );

        $updatePayment->execute();

        $updatePromotion = $conn->prepare("
            UPDATE featured_promotions
            SET
                payment_status = 'paid',
                status = CASE
                    WHEN status IN ('pending_payment', 'cancelled') THEN 'pending'
                    ELSE status
                END,
                paid_at = COALESCE(paid_at, ?),
                updated_at = NOW()
            WHERE id = ?
        ");

        $updatePromotion->bind_param("si", $paidAt, $promotionId);
        $updatePromotion->execute();
    } else {
        $updatePayment = $conn->prepare("
            UPDATE promotion_payments
            SET
                status = ?,
                updated_at = NOW()
            WHERE id = ?
                AND status <> 'paid'
        ");

        $updatePayment->bind_param("si", $promotionPaymentStatus, $promotionPaymentId);
        $updatePayment->execute();

        $updatePromotion = $conn->prepare("
            UPDATE featured_promotions
            SET
                payment_status = ?,
                updated_at = NOW()
            WHERE id = ?
                AND payment_status <> 'paid'
        ");

        $updatePromotion->bind_param("si", $promotionPaymentStatus, $promotionId);
        $updatePromotion->execute();
    }

    $notificationCreated = false;
    $emailQueued = false;

    if ($paymentAttemptStatus === "paid") {
        $promotionTitle = $promotion["promotion_title"] ?: "your featured promotion";
        $productName = $promotion["product_name"] ?: "your product";
        $vendorName = $promotion["vendor_name"] ?: "Vendor";

        $vendorNotif = createNotification(
            $conn,
            $vendorId,
            "promotion_payment_success",
            "Promotion payment received",
            "Your payment for {$promotionTitle} was successful. Your promotion is now pending admin approval.",
            "featured_promotion",
            $promotionId,
            "promotion_payment_success_vendor_" . $promotionPaymentId
        );

        $notificationCreated = $vendorNotif;

        $vendorSubject = "Promotion Payment Successful - Promotion #{$promotionId}";
        $vendorHtml = "
            <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                <h2 style='color:#f97316;'>Promotion Payment Successful</h2>
                <p>Hello " . h($vendorName) . ",</p>
                <p>Your payment for <strong>" . h($promotionTitle) . "</strong> was successful.</p>
                <p>Your promotion for <strong>" . h($productName) . "</strong> is now pending admin approval.</p>
                <p><strong>Promotion ID:</strong> #{$promotionId}</p>
                <br>
                <p>Thank you for using OSYUSO.</p>
            </div>
        ";

        $vendorText =
            "Your payment for {$promotionTitle} was successful. " .
            "Your promotion for {$productName} is now pending admin approval. " .
            "Promotion ID: #{$promotionId}.";

        $vendorEmailQueued = queueEmail(
            $conn,
            $promotion["vendor_email"] ?? null,
            $vendorName,
            $vendorSubject,
            $vendorHtml,
            $vendorText,
            "featured_promotion",
            $promotionId,
            "promotion_payment_success_vendor_email_" . $promotionPaymentId
        );

        $emailQueued = $vendorEmailQueued;

        $adminStmt = $conn->prepare("
            SELECT user_id, fullname, email
            FROM users
            WHERE role = 'admin'
                AND status = 'active'
        ");

        $adminStmt->execute();
        $admins = $adminStmt->get_result();

        while ($admin = $admins->fetch_assoc()) {
            $adminId = (int)$admin["user_id"];
            $adminName = $admin["fullname"] ?: "Admin";

            $adminNotif = createNotification(
                $conn,
                $adminId,
                "promotion_pending_approval",
                "Promotion pending approval",
                "{$vendorName} paid for a featured promotion. Please review {$promotionTitle}.",
                "featured_promotion",
                $promotionId,
                "promotion_pending_approval_admin_" . $adminId . "_" . $promotionId,
                $vendorId
            );

            $notificationCreated = $notificationCreated || $adminNotif;

            $adminSubject = "Promotion Pending Approval - Promotion #{$promotionId}";
            $adminHtml = "
                <div style='font-family: Arial, sans-serif; color: #111827; line-height: 1.6;'>
                    <h2 style='color:#f97316;'>Promotion Pending Approval</h2>
                    <p>Hello " . h($adminName) . ",</p>
                    <p><strong>" . h($vendorName) . "</strong> has paid for a featured promotion.</p>
                    <p><strong>Promotion:</strong> " . h($promotionTitle) . "</p>
                    <p><strong>Product:</strong> " . h($productName) . "</p>
                    <p>Please review the promotion in the admin dashboard.</p>
                </div>
            ";

            $adminText =
                "{$vendorName} has paid for a featured promotion. " .
                "Promotion: {$promotionTitle}. Product: {$productName}. " .
                "Please review it in the admin dashboard.";

            $adminEmailQueued = queueEmail(
                $conn,
                $admin["email"] ?? null,
                $adminName,
                $adminSubject,
                $adminHtml,
                $adminText,
                "featured_promotion",
                $promotionId,
                "promotion_pending_approval_admin_email_" . $adminId . "_" . $promotionId
            );

            $emailQueued = $emailQueued || $adminEmailQueued;
        }
    }

    return [
        "type" => "promotion",
        "ignored" => false,
        "message" => "Promotion webhook processed",
        "data" => [
            "payment_type" => "promotion",
            "promotion_id" => $promotionId,
            "promotion_payment_id" => $promotionPaymentId,
            "payment_status" => $promotionPaymentStatus,
            "promotion_status" => $paymentAttemptStatus === "paid" ? "pending" : $promotion["promotion_status"],
            "notification_created" => $notificationCreated,
            "email_queued" => $emailQueued
        ]
    ];
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

    $invoiceId = $payload["id"] ?? null;
    $xenditStatus = $payload["status"] ?? null;

    if (!$invoiceId || !$xenditStatus) {
        throw new Exception("Missing invoice id or status");
    }

    if ($xenditStatus === "PAID" || $xenditStatus === "SETTLED") {
        $orderPaymentStatus = "paid";
        $paymentAttemptStatus = "paid";
    } elseif ($xenditStatus === "EXPIRED") {
        $orderPaymentStatus = "expired";
        $paymentAttemptStatus = "expired";
    } elseif ($xenditStatus === "FAILED") {
        $orderPaymentStatus = "pending";
        $paymentAttemptStatus = "failed";
    } else {
        $orderPaymentStatus = "pending";
        $paymentAttemptStatus = "pending";
    }

    $conn->begin_transaction();

    $order = findOrderPayment($conn, $invoiceId);

    if ($order) {
        $result = processOrderPayment(
            $conn,
            $payload,
            $order,
            $orderPaymentStatus,
            $paymentAttemptStatus,
            $invoiceId
        );

        $conn->commit();

        response(true, $result["message"], 200, $result["data"]);
    }

    $promotion = findPromotionPayment($conn, $invoiceId);

    if ($promotion) {
        $result = processPromotionPayment(
            $conn,
            $payload,
            $promotion,
            $paymentAttemptStatus,
            $invoiceId
        );

        $conn->commit();

        response(true, $result["message"], 200, $result["data"]);
    }

    $conn->commit();

    response(true, "Webhook received, no matching payment", 200, [
        "xendit_invoice_id" => $invoiceId,
        "xendit_status" => $xenditStatus
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

    response(false, "Webhook failed", 400, [
        "error" => $e->getMessage()
    ]);
}

exit;