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
require_once "../auth/middleware.php";

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
        $message = $result['message'] ?? $result['error_code'] ?? "Failed to create Xendit invoice";
        throw new Exception($message);
    }

    return $result;
}

try {
    $xenditSecretKey = $_ENV["XENDIT_SECRET_KEY"] ?? null;
    $frontendUrl = rtrim($_ENV["FRONTEND_URL"] ?? "http://localhost:5173", "/");

    if (!$xenditSecretKey) {
        throw new Exception("Xendit secret key is missing");
    }

    $user = requireRole(["customer"]);

    if (is_object($user)) {
        $user_id = $user->user_id ?? null;
    } elseif (is_array($user)) {
        $user_id = $user['user_id'] ?? null;
    } else {
        $user_id = null;
    }

    if (!$user_id) {
        throw new Exception("Unauthorized user");
    }

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        throw new Exception("Invalid JSON input");
    }

    $product_id = filter_var($input['product_id'] ?? null, FILTER_VALIDATE_INT);
    $quantity = filter_var($input['quantity'] ?? 0, FILTER_VALIDATE_INT);
    $weight = filter_var($input['weight'] ?? 0, FILTER_VALIDATE_FLOAT);

    $quantity = $quantity === false ? 0 : $quantity;
    $weight = $weight === false ? 0 : $weight;

    if (!$product_id) {
        throw new Exception("Product ID is required");
    }

    $stmt = $conn->prepare("
        SELECT 
            p.id,
            p.name,
            p.price,
            p.unit_type,
            p.stock,
            p.shop_id,
            p.status
        FROM products p
        INNER JOIN shops s ON s.id = p.shop_id
        WHERE p.id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    if ($product['status'] !== 'active') {
        throw new Exception("Product is not available");
    }

    $unit_price = (float) $product['price'];
    $stock = (float) $product['stock'];
    $shop_id = (int) $product['shop_id'];

    if ($stock <= 0) {
        throw new Exception("Out of stock");
    }

    if ($product['unit_type'] === 'kg') {
        if ($weight <= 0 || $weight > $stock) {
            throw new Exception("Invalid or insufficient weight");
        }

        $quantity = 0;
        $total = round($weight * $unit_price, 2);
        $itemName = $product['name'] . " (" . $weight . " kg)";
        $invoiceQuantity = 1;
        $invoicePrice = $total;
    } else {
        if ($quantity <= 0 || $quantity > $stock) {
            throw new Exception("Invalid or insufficient quantity");
        }

        $quantity = (int) $quantity;
        $weight = 0;
        $total = round($quantity * $unit_price, 2);
        $itemName = $product['name'];
        $invoiceQuantity = $quantity;
        $invoicePrice = $unit_price;
    }

    if ($total <= 0) {
        throw new Exception("Invalid order total");
    }

    $conn->begin_transaction();

    $order = $conn->prepare("
        INSERT INTO orders (
            user_id,
            shop_id,
            product_id,
            quantity,
            weight,
            unit_price,
            total_amount,
            payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
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
    $external_id = "ORDER-" . $order_id;

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
            "order_id" => $order_id,
            "user_id" => (int) $user_id,
            "shop_id" => $shop_id,
            "product_id" => $product_id
        ]
    ], $xenditSecretKey);

    $xendit_invoice_id = $invoice['id'] ?? null;
    $xendit_checkout_url = $invoice['invoice_url'] ?? null;

    if (!$xendit_invoice_id || !$xendit_checkout_url) {
        throw new Exception("Invalid Xendit invoice response");
    }

    $update = $conn->prepare("
        UPDATE orders
        SET xendit_invoice_id = ?, xendit_checkout_url = ?
        WHERE id = ?
    ");

    $update->bind_param("ssi", $xendit_invoice_id, $xendit_checkout_url, $order_id);
    $update->execute();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Checkout created successfully",
        "order_id" => $order_id,
        "shop_id" => $shop_id,
        "payment_status" => "pending",
        "total" => $total,
        "checkout_url" => $xendit_checkout_url,
        "xendit_invoice_id" => $xendit_invoice_id
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
        "message" => $e->getMessage()
    ]);
}

exit;
