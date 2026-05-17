<?php

include("../header.php");

header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set('display_errors', 0);

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

    // ================= INPUT =================
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        throw new Exception("Invalid JSON input");
    }

    $cart_item_id = $data['cart_item_id'] ?? null;

    if (!$cart_item_id || !filter_var($cart_item_id, FILTER_VALIDATE_INT)) {
        throw new Exception("Cart item required");
    }

    $cart_item_id = (int) $cart_item_id;

    // ================= VERIFY OWNERSHIP =================
    $stmt = $conn->prepare("
        SELECT ci.cart_item_id
        FROM cart_items ci
        INNER JOIN carts c
            ON c.cart_id = ci.cart_id
        WHERE ci.cart_item_id = ?
          AND c.user_id = ?
          AND c.status = 'active'
        LIMIT 1
    ");

    $stmt->bind_param("ii", $cart_item_id, $user_id);
    $stmt->execute();

    $item = $stmt->get_result()->fetch_assoc();

    if (!$item) {
        throw new Exception("Cart item not found or unauthorized");
    }

    // ================= DELETE ITEM =================
    $stmt = $conn->prepare("
        DELETE FROM cart_items
        WHERE cart_item_id = ?
    ");

    $stmt->bind_param("i", $cart_item_id);
    $stmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "Item removed from cart"
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
