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
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $statusCode = 200) {
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

function makePromotionReference($promotionId) {
    return "PROMO-" . date("Ymd") . "-P" . $promotionId . "-" . strtoupper(bin2hex(random_bytes(4)));
}

function uploadPromotionImage($cloudName, $vendorId) {
    if (empty($_FILES["image"]["tmp_name"])) {
        return null;
    }

    $tmpName = $_FILES["image"]["tmp_name"];

    if ($_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
        throw new Exception("Image upload failed. Error code: " . $_FILES["image"]["error"]);
    }

    if (!file_exists($tmpName)) {
        throw new Exception("Uploaded image missing");
    }

    if ($_FILES["image"]["size"] > 10 * 1024 * 1024) {
        throw new Exception("Image too large. Max 10MB allowed.");
    }

    $mime = mime_content_type($tmpName);

    $allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!in_array($mime, $allowedMimes, true)) {
        throw new Exception("Invalid image type");
    }

    $ch = curl_init("https://api.cloudinary.com/v1_1/$cloudName/image/upload");

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_POSTFIELDS => [
            "file" => new CURLFile($tmpName),
            "upload_preset" => "unsigned_upload",
            "folder" => "featured-promotions/{$vendorId}"
        ]
    ]);

    $cloudinaryResponse = curl_exec($ch);

    if (curl_errno($ch)) {
        $curlError = curl_error($ch);
        curl_close($ch);
        throw new Exception("Cloudinary cURL Error: " . $curlError);
    }

    curl_close($ch);

    $result = json_decode($cloudinaryResponse, true);

    if (!$result) {
        throw new Exception("Invalid Cloudinary response");
    }

    if (!empty($result["error"])) {
        throw new Exception($result["error"]["message"] ?? "Cloudinary upload failed");
    }

    if (empty($result["secure_url"])) {
        throw new Exception("Cloudinary upload failed");
    }

    return $result["secure_url"];
}

try {
    $user = requireRole(["vendor"]);

    $vendor_id = (int)($user->user_id ?? 0);

    if (!$vendor_id) {
        throw new Exception("Unauthorized vendor");
    }

    $cloudName = CLOUDINARY_CLOUD_NAME ?? null;

    if (!$cloudName) {
        throw new Exception("Cloudinary not configured");
    }

    $xenditSecretKey = $_ENV["XENDIT_SECRET_KEY"] ?? null;
    $frontendUrl = rtrim($_ENV["FRONTEND_URL"] ?? "http://localhost:5173", "/");

    if (!$xenditSecretKey) {
        throw new Exception("Xendit secret key is missing");
    }

    $product_id = (int)($_POST["product_id"] ?? 0);
    $tag = trim($_POST["tag"] ?? "");
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");
    $start_date = trim($_POST["start_date"] ?? "");
    $expires_at = trim($_POST["expires_at"] ?? "");

    if (!$product_id || !$title || !$description || !$start_date || !$expires_at) {
        throw new Exception("Missing required fields");
    }

    $conn->begin_transaction();

    $productStmt = $conn->prepare("
        SELECT
            p.id,
            p.name,
            p.status AS product_status,
            s.id AS shop_id,
            s.owner_id,
            s.shop_name,
            s.status AS shop_status
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        WHERE p.id = ?
            AND s.owner_id = ?
        LIMIT 1
    ");

    $productStmt->bind_param("ii", $product_id, $vendor_id);
    $productStmt->execute();

    $product = $productStmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Invalid product ID or product does not belong to your shop");
    }

    if (($product["product_status"] ?? "") !== "active") {
        throw new Exception("Only active products can be promoted");
    }

    if (($product["shop_status"] ?? "") !== "active") {
        throw new Exception("Your shop must be active before creating a promotion");
    }

    $start = new DateTime($start_date);
    $end = new DateTime($expires_at);

    if ($end <= $start) {
        throw new Exception("Expiration date must be greater than start date");
    }

    $startDateMysql = $start->format("Y-m-d H:i:s");
    $expiresAtMysql = $end->format("Y-m-d H:i:s");

    $diffSeconds = $end->getTimestamp() - $start->getTimestamp();
    $total_hours = max(1, (int)ceil($diffSeconds / 3600));

    $settingsQuery = $conn->query("
        SELECT promotion_price_per_hour
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $settings = $settingsQuery ? $settingsQuery->fetch_assoc() : null;
    $price_per_hour = (float)($settings["promotion_price_per_hour"] ?? 20);

    if ($price_per_hour <= 0) {
        throw new Exception("Promotion price per hour must be greater than zero");
    }

    $total_price = round($total_hours * $price_per_hour, 2);

    if ($total_price <= 0) {
        throw new Exception("Invalid promotion total price");
    }

    $imageUrl = uploadPromotionImage($cloudName, $vendor_id);

    $promotionStmt = $conn->prepare("
        INSERT INTO featured_promotions
        (
            product_id,
            vendor_id,
            tag,
            title,
            description,
            image_path,
            start_date,
            expires_at,
            total_hours,
            total_price,
            status,
            payment_status,
            created_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending_payment',
            'pending',
            NOW()
        )
    ");

    $promotionStmt->bind_param(
        "iissssssid",
        $product_id,
        $vendor_id,
        $tag,
        $title,
        $description,
        $imageUrl,
        $startDateMysql,
        $expiresAtMysql,
        $total_hours,
        $total_price
    );

    $promotionStmt->execute();

    $promotion_id = $promotionStmt->insert_id;
    $reference_no = makePromotionReference($promotion_id);
    $external_id = $reference_no;
    $currency = "PHP";
    $paymentStatus = "pending";

    $paymentStmt = $conn->prepare("
        INSERT INTO promotion_payments
        (
            promotion_id,
            vendor_id,
            amount,
            currency,
            status,
            reference_no,
            external_id,
            created_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $paymentStmt->bind_param(
        "iidssss",
        $promotion_id,
        $vendor_id,
        $total_price,
        $currency,
        $paymentStatus,
        $reference_no,
        $external_id
    );

    $paymentStmt->execute();

    $promotion_payment_id = $paymentStmt->insert_id;

    $invoice = createXenditInvoice([
        "external_id" => $external_id,
        "amount" => $total_price,
        "currency" => "PHP",
        "description" => "Featured Promotion #" . $promotion_id,
        "invoice_duration" => 86400,
        "success_redirect_url" => $frontendUrl . "/vendor/promotions?payment=success&promotion_id=" . $promotion_id,
        "failure_redirect_url" => $frontendUrl . "/vendor/promotions?payment=failed&promotion_id=" . $promotion_id,
        "items" => [[
            "name" => "Featured Promotion: " . $title,
            "quantity" => 1,
            "price" => $total_price
        ]],
        "metadata" => [
            "type" => "featured_promotion",
            "promotion_id" => $promotion_id,
            "promotion_payment_id" => $promotion_payment_id,
            "vendor_id" => $vendor_id,
            "product_id" => $product_id,
            "total_hours" => $total_hours,
            "price_per_hour" => $price_per_hour
        ]
    ], $xenditSecretKey);

    $xendit_invoice_id = $invoice["id"] ?? null;
    $xendit_checkout_url = $invoice["invoice_url"] ?? null;

    if (!$xendit_invoice_id || !$xendit_checkout_url) {
        throw new Exception("Invalid Xendit invoice response");
    }

    $updatePayment = $conn->prepare("
        UPDATE promotion_payments
        SET
            xendit_invoice_id = ?,
            xendit_checkout_url = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $updatePayment->bind_param(
        "ssi",
        $xendit_invoice_id,
        $xendit_checkout_url,
        $promotion_payment_id
    );

    $updatePayment->execute();

    $updatePromotion = $conn->prepare("
        UPDATE featured_promotions
        SET
            xendit_invoice_id = ?,
            xendit_checkout_url = ?,
            updated_at = NOW()
        WHERE id = ?
    ");

    $updatePromotion->bind_param(
        "ssi",
        $xendit_invoice_id,
        $xendit_checkout_url,
        $promotion_id
    );

    $updatePromotion->execute();

    $conn->commit();

    response(true, "Promotion payment invoice created successfully", [
        "promotion_id" => $promotion_id,
        "promotion_payment_id" => $promotion_payment_id,
        "product_id" => $product_id,
        "image" => $imageUrl,
        "status" => "pending_payment",
        "payment_status" => "pending",
        "total_hours" => $total_hours,
        "price_per_hour" => $price_per_hour,
        "total_price" => $total_price,
        "reference_no" => $reference_no,
        "external_id" => $external_id,
        "xendit_invoice_id" => $xendit_invoice_id,
        "checkout_url" => $xendit_checkout_url
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Create promotion failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;