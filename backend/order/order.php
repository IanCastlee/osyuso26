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
require_once "../auth/middleware.php";

function response($success, $message, $statusCode = 200, $payload = null) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($statusCode);

    $body = [
        "success" => $success,
        "message" => $message
    ];

    if (is_array($payload)) {
        $body = array_merge($body, $payload);

        if (!array_key_exists("data", $body)) {
            $body["data"] = $payload;
        }
    } else {
        $body["data"] = $payload;
    }

    echo json_encode($body);
    exit;
}

function createXenditInvoice($payload, $secretKey) {
    $ch = curl_init("https://api.xendit.co/v2/invoices");

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Basic " . base64_encode($secretKey . ":")
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($response === false) {
        throw new Exception("Xendit connection failed: " . $curlError);
    }

    $result = json_decode($response, true);

    if (!is_array($result)) {
        throw new Exception("Invalid response from Xendit");
    }

    if ($statusCode < 200 || $statusCode >= 300) {
        $message = $result["message"] ?? $result["error_code"] ?? "Failed to create Xendit invoice";
        throw new Exception($message);
    }

    return $result;
}

function makePaymentReference($orderId) {
    return "PAY-" . date("Ymd") . "-O" . $orderId . "-" . strtoupper(bin2hex(random_bytes(4)));
}

function isShopOpen($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return false;
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return false;
    }

    if ((int)($shop["operating_hours_enabled"] ?? 0) !== 1) {
        return true;
    }

    if (empty($shop["opens_at"]) || empty($shop["closes_at"])) {
        return true;
    }

    $now = date("H:i:s");
    $opensAt = $shop["opens_at"];
    $closesAt = $shop["closes_at"];

    if ($opensAt <= $closesAt) {
        return $now >= $opensAt && $now <= $closesAt;
    }

    return $now >= $opensAt || $now <= $closesAt;
}

function getShopClosedMessage($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return "Shop is unavailable.";
    }

    if (!empty($shop["closed_message"])) {
        return $shop["closed_message"];
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return "Shop is closed now.";
    }

    return "Shop is closed now. Please order during operating hours.";
}

function isSaleActive($product) {
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);
    $now = date("Y-m-d H:i:s");

    if ($saleType === "none" || $saleValue <= 0) {
        return false;
    }

    if (!empty($product["sale_starts_at"]) && $product["sale_starts_at"] > $now) {
        return false;
    }

    if (!empty($product["sale_ends_at"]) && $product["sale_ends_at"] < $now) {
        return false;
    }

    return true;
}

function calculateFinalPrice($product) {
    $originalPrice = round((float)$product["price"], 2);
    $saleType = $product["sale_type"] ?? "none";
    $saleValue = (float)($product["sale_value"] ?? 0);

    if (!isSaleActive($product)) {
        return [
            "original_price" => $originalPrice,
            "final_price" => $originalPrice,
            "is_on_sale" => false,
            "sale_label" => null
        ];
    }

    if ($saleType === "percent") {
        $discountPercent = min($saleValue, 100);
        $finalPrice = max(0, $originalPrice - ($originalPrice * ($discountPercent / 100)));

        return [
            "original_price" => $originalPrice,
            "final_price" => round($finalPrice, 2),
            "is_on_sale" => true,
            "sale_label" => rtrim(rtrim(number_format($discountPercent, 2, ".", ""), "0"), ".") . "% OFF"
        ];
    }

    if ($saleType === "fixed") {
        $discount = min($saleValue, $originalPrice);
        $finalPrice = max(0, $originalPrice - $discount);

        return [
            "original_price" => $originalPrice,
            "final_price" => round($finalPrice, 2),
            "is_on_sale" => true,
            "sale_label" => "PHP " . number_format($discount, 2) . " OFF"
        ];
    }

    return [
        "original_price" => $originalPrice,
        "final_price" => $originalPrice,
        "is_on_sale" => false,
        "sale_label" => null
    ];
}

try {
    $xenditSecretKey = $_ENV["XENDIT_SECRET_KEY"] ?? null;
    $frontendUrl = rtrim($_ENV["FRONTEND_URL"] ?? "http://localhost:5173", "/");

    if (!$xenditSecretKey) {
        throw new Exception("Xendit secret key is missing");
    }

    $user = requireRole(["customer"]);
    $user_id = (int)($user->user_id ?? 0);

    if ($user_id <= 0) {
        throw new Exception("Unauthorized user");
    }

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        throw new Exception("Invalid JSON input");
    }

    $product_id = filter_var($input["product_id"] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($input["quantity"] ?? 0, FILTER_VALIDATE_INT);
    $weight = filter_var($input["weight"] ?? 0, FILTER_VALIDATE_FLOAT);

    $quantity = $quantity === false ? 0 : $quantity;
    $weight = $weight === false ? 0 : $weight;

    if (!$product_id) {
        throw new Exception("Product ID is required");
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            p.id,
            p.name,
            p.price,
            p.unit_type,
            p.stock,
            p.shop_id,
            p.status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,

            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        WHERE p.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    if ($product["status"] !== "active") {
        throw new Exception("Product is not available");
    }

    if (!isShopOpen($product)) {
        throw new Exception(getShopClosedMessage($product));
    }

    $stock = (float)$product["stock"];
    $shop_id = (int)$product["shop_id"];
    $unitType = $product["unit_type"];

    if ($stock <= 0) {
        throw new Exception("Out of stock");
    }

    $priceData = calculateFinalPrice($product);
    $unit_price = $priceData["final_price"];

    if ($unit_price <= 0) {
        throw new Exception("Free checkout is not supported yet");
    }

    if ($unitType === "kg") {
        $weight = round((float)$weight, 2);

        if ($weight <= 0) {
            throw new Exception("Weight is required");
        }

        if ($weight > $stock) {
            throw new Exception("Insufficient stock. Available stock: {$stock} kg");
        }

        $quantity = 0;
        $total = round($weight * $unit_price, 2);
        $itemName = $product["name"] . " (" . $weight . " kg)";
        $invoiceQuantity = 1;
        $invoicePrice = $total;
    } else {
        $quantity = (int)$quantity;

        if ($quantity <= 0) {
            throw new Exception("Quantity is required");
        }

        if ($quantity > $stock) {
            throw new Exception("Insufficient stock. Available stock: {$stock} pcs");
        }

        $weight = 0;
        $total = round($quantity * $unit_price, 2);
        $itemName = $product["name"];
        $invoiceQuantity = $quantity;
        $invoicePrice = $unit_price;
    }

    if ($total <= 0) {
        throw new Exception("Invalid order total");
    }

    $order = $conn->prepare("
        INSERT INTO orders (
            user_id,
            shop_id,
            product_id,
            quantity,
            weight,
            unit_price,
            total_amount,
            payment_status,
            claim_status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'unclaimed', NOW())
    ");

    $order->bind_param(
        "iiiiddd",
        $user_id,
        $shop_id,
        $product_id,
        $quantity,
        $weight,
        $unit_price,
        $total
    );

    $order->execute();

    $order_id = $order->insert_id;
    $reference_no = makePaymentReference($order_id);
    $external_id = $reference_no;
    $currency = "PHP";
    $paymentStatus = "pending";

    $payment = $conn->prepare("
        INSERT INTO order_payments (
            order_id,
            user_id,
            amount,
            currency,
            status,
            reference_no,
            external_id,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $payment->bind_param(
        "iidssss",
        $order_id,
        $user_id,
        $total,
        $currency,
        $paymentStatus,
        $reference_no,
        $external_id
    );

    $payment->execute();

    $order_payment_id = $payment->insert_id;

    $invoice = createXenditInvoice([
        "external_id" => $external_id,
        "amount" => $total,
        "currency" => "PHP",
        "description" => "Order #" . $order_id,
        "invoice_duration" => 86400,
        "success_redirect_url" => $frontendUrl . "/payment-success?order_id=" . $order_id,
        "failure_redirect_url" => $frontendUrl . "/payment-failed?order_id=" . $order_id,
        "items" => [[
            "name" => $itemName,
            "quantity" => $invoiceQuantity,
            "price" => $invoicePrice
        ]],
        "metadata" => [
            "type" => "order",
            "order_id" => $order_id,
            "order_payment_id" => $order_payment_id,
            "user_id" => $user_id,
            "shop_id" => $shop_id,
            "product_id" => $product_id,
            "unit_price" => $unit_price,
            "original_price" => $priceData["original_price"],
            "is_on_sale" => $priceData["is_on_sale"]
        ]
    ], $xenditSecretKey);

    $xendit_invoice_id = $invoice["id"] ?? null;
    $xendit_checkout_url = $invoice["invoice_url"] ?? null;

    if (!$xendit_invoice_id || !$xendit_checkout_url) {
        throw new Exception("Invalid Xendit invoice response");
    }

    $updatePayment = $conn->prepare("
        UPDATE order_payments
        SET
            xendit_invoice_id = ?,
            xendit_checkout_url = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $updatePayment->bind_param("ssi", $xendit_invoice_id, $xendit_checkout_url, $order_payment_id);
    $updatePayment->execute();

    $updateOrder = $conn->prepare("
        UPDATE orders
        SET
            xendit_invoice_id = ?,
            xendit_checkout_url = ?
        WHERE id = ?
    ");

    $updateOrder->bind_param("ssi", $xendit_invoice_id, $xendit_checkout_url, $order_id);
    $updateOrder->execute();

    $conn->commit();

    $responseData = [
        "order_id" => $order_id,
        "order_payment_id" => $order_payment_id,
        "reference_no" => $reference_no,
        "external_id" => $external_id,
        "shop_id" => $shop_id,
        "payment_status" => "pending",
        "quantity" => $quantity,
        "weight" => $weight,
        "unit_type" => $unitType,
        "original_price" => $priceData["original_price"],
        "unit_price" => $unit_price,
        "is_on_sale" => $priceData["is_on_sale"],
        "sale_label" => $priceData["sale_label"],
        "total" => $total,
        "checkout_url" => $xendit_checkout_url,
        "xendit_invoice_id" => $xendit_invoice_id
    ];

    response(true, "Checkout created successfully", 200, array_merge(
        $responseData,
        ["data" => $responseData]
    ));
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Checkout failed: " . $e->getMessage());

    response(false, $e->getMessage(), 400);
}

exit;