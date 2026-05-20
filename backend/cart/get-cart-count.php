<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    $user = requireRole(["customer"]);
    $user_id = (int)$user->user_id;

    $stmt = $conn->prepare("
        SELECT COUNT(ci.cart_item_id) AS cart_count
        FROM carts c
        INNER JOIN cart_items ci
            ON ci.cart_id = c.cart_id
        INNER JOIN products p
            ON p.id = ci.product_id
        WHERE c.user_id = ?
            AND c.status = 'active'
            AND p.status = 'active'
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $row = $stmt->get_result()->fetch_assoc();

    response(true, "Cart count fetched", [
        "cart_count" => (int)($row["cart_count"] ?? 0)
    ]);
} catch (Throwable $e) {
    error_log("Get cart count failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}