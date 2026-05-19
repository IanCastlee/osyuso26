<?php
ob_start();
require_once "../header.php";
require_once "../vendor/autoload.php";
require_once "../dbConn.php";
require_once "../auth/middleware.php";

use Dompdf\Dompdf;
use Dompdf\Options;

function failJson($message, $code = 500) {
    if (ob_get_length()) ob_clean();

    http_response_code($code);
    header("Content-Type: application/json");

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit;
}

function e($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, "UTF-8");
}

function money($value) {
    return "PHP " . number_format((float)$value, 2);
}

try {
    $user = requireRole(["customer", "vendor", "admin"]);
    $user_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $order_id = (int)($_GET["order_id"] ?? 0);

    if (!$order_id) {
        failJson("Missing order ID", 400);
    }

    $accessSql = "";
    $params = [$order_id];
    $types = "i";

    if ($role === "vendor") {
        $accessSql = "AND s.owner_id = ?";
        $params[] = $user_id;
        $types .= "i";
    } elseif ($role !== "admin") {
        $accessSql = "AND o.user_id = ?";
        $params[] = $user_id;
        $types .= "i";
    }

    $stmt = $conn->prepare("
        SELECT
            o.id AS order_id,
            o.quantity,
            o.weight,
            o.unit_price,
            o.total_amount,
            o.payment_status,
            o.created_at AS order_date,

            r.receipt_no,
            r.payment_provider,
            r.payment_reference,
            r.payment_method,
            r.payment_channel,
            r.amount_paid,
            r.paid_at,

            p.name AS product_name,
            p.unit_type,

            s.shop_name,
            s.address AS shop_address,
            s.phone AS shop_phone,

            u.fullname AS customer_name,
            u.email AS customer_email
        FROM orders o
        INNER JOIN receipts r ON r.order_id = o.id
        LEFT JOIN products p ON p.id = o.product_id
        LEFT JOIN shops s ON s.id = o.shop_id
        LEFT JOIN users u ON u.user_id = o.user_id
        WHERE o.id = ?
            $accessSql
        LIMIT 1
    ");

    if (!$stmt) {
        failJson("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $receipt = $stmt->get_result()->fetch_assoc();

    if (!$receipt) {
        failJson("Receipt not found", 404);
    }

    if ($receipt["payment_status"] !== "paid") {
        failJson("Order is not paid", 403);
    }

    $qty = ((float)$receipt["weight"] > 0)
        ? $receipt["weight"] . " kg"
        : $receipt["quantity"] . " pcs";

    $html = "
    <html>
    <head>
        <style>
            body { font-family: DejaVu Sans, Arial, sans-serif; color:#0f172a; font-size:12px; margin:0; }
            .header { background:#f97316; color:white; padding:28px; }
            .header h1 { margin:0; font-size:26px; }
            .header p { margin:6px 0 0; opacity:.9; }
            .content { padding:28px; }
            .grid { width:100%; margin-bottom:22px; }
            .grid td { width:50%; padding:8px; vertical-align:top; }
            .box { background:#f8fafc; border:1px solid #e2e8f0; padding:12px; }
            .label { color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:4px; }
            .value { font-weight:bold; }
            table.items { width:100%; border-collapse:collapse; margin-top:14px; }
            .items th { background:#f8fafc; color:#64748b; text-align:left; padding:10px; border-bottom:1px solid #e2e8f0; }
            .items td { padding:12px 10px; border-bottom:1px solid #f1f5f9; }
            .right { text-align:right; }
            .bold { font-weight:bold; }
            .total { margin-top:24px; padding-top:18px; border-top:2px solid #e2e8f0; width:100%; font-size:18px; font-weight:bold; }
            .footer { margin-top:28px; color:#64748b; text-align:center; font-size:11px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>OSYUSO Official Receipt</h1>
            <p>" . e($receipt["receipt_no"]) . "</p>
        </div>

        <div class='content'>
            <table class='grid'>
                <tr>
                    <td><div class='box'><div class='label'>Order ID</div><div class='value'>#" . e($receipt["order_id"]) . "</div></div></td>
                    <td><div class='box'><div class='label'>Paid At</div><div class='value'>" . e($receipt["paid_at"]) . "</div></div></td>
                </tr>
                <tr>
                    <td><div class='box'><div class='label'>Customer</div><div class='value'>" . e($receipt["customer_name"]) . "</div></div></td>
                    <td><div class='box'><div class='label'>Shop</div><div class='value'>" . e($receipt["shop_name"]) . "</div></div></td>
                </tr>
                <tr>
                    <td><div class='box'><div class='label'>Payment Channel</div><div class='value'>" . e($receipt["payment_channel"]) . "</div></div></td>
                    <td><div class='box'><div class='label'>Reference</div><div class='value'>" . e($receipt["payment_reference"]) . "</div></div></td>
                </tr>
            </table>

            <h2>Items</h2>

            <table class='items'>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class='right'>Qty/Weight</th>
                        <th class='right'>Price</th>
                        <th class='right'>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>" . e($receipt["product_name"]) . "</td>
                        <td class='right'>" . e($qty) . "</td>
                        <td class='right'>" . money($receipt["unit_price"]) . "</td>
                        <td class='right bold'>" . money($receipt["total_amount"]) . "</td>
                    </tr>
                </tbody>
            </table>

            <table class='total'>
                <tr>
                    <td>Total Paid</td>
                    <td class='right'>" . money($receipt["amount_paid"]) . "</td>
                </tr>
            </table>

            <div class='footer'>
                This receipt was generated by OSYUSO based on the paid order record.
            </div>
        </div>
    </body>
    </html>
    ";

    $options = new Options();
    $options->set("isRemoteEnabled", true);

    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html);
    $dompdf->setPaper("A4", "portrait");
    $dompdf->render();

    if (ob_get_length()) ob_clean();

    $filename = "receipt-" . $receipt["receipt_no"] . ".pdf";

    header("Content-Type: application/pdf");
    header("Content-Disposition: attachment; filename=\"$filename\"");

    echo $dompdf->output();
    exit;

} catch (Throwable $e) {
    error_log("Receipt PDF failed: " . $e->getMessage());
    failJson($e->getMessage(), 500);
}