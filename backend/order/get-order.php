<?php

ob_start();

include("../header.php");

header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

try {
    // ================= AUTH =================
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

    // ================= GET ORDERS =================
    $stmt = $conn->prepare("
        SELECT
            o.id AS order_id,
            o.product_id,
            o.shop_id,
            o.quantity,
            o.weight,
            o.unit_price,
            o.total_amount,
            o.payment_status,
            o.xendit_invoice_id,
            o.xendit_checkout_url,
            o.created_at,

            p.name AS product_name,
            p.unit_type,
            p.stock,

            pi.image_path,

            s.shop_name
        FROM orders o

        INNER JOIN products p
            ON p.id = o.product_id

        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1

        INNER JOIN shops s
            ON s.id = o.shop_id

        WHERE o.user_id = ?

        ORDER BY o.created_at DESC
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $orders = [];

    while ($row = $result->fetch_assoc()) {
        $row['order_id'] = (int) $row['order_id'];
        $row['product_id'] = (int) $row['product_id'];
        $row['shop_id'] = (int) $row['shop_id'];
        $row['quantity'] = (int) $row['quantity'];
        $row['weight'] = (float) $row['weight'];
        $row['unit_price'] = (float) $row['unit_price'];
        $row['total_amount'] = (float) $row['total_amount'];
        $row['stock'] = (float) $row['stock'];

        $orders[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $orders
    ]);

} catch (Exception $e) {
    error_log($e->getMessage());

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

exit;
