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
    $user_id = $user->user_id ?? $user['user_id'];

    // ================= INPUT =================
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        throw new Exception("Invalid JSON input");
    }

    $cart_item_id = $data['cart_item_id'] ?? null;
    $quantity     = $data['quantity'] ?? 0;
    $weight       = $data['weight'] ?? 0;

    if (!$cart_item_id) {
        throw new Exception("Cart item required");
    }

    // ================= GET & VERIFY OWNERSHIP =================
    $stmt = $conn->prepare("
        SELECT 
            ci.cart_item_id,
            ci.cart_id,
            ci.product_id,
            p.unit_type
        FROM cart_items ci
        INNER JOIN carts c ON c.cart_id = ci.cart_id
        INNER JOIN products p ON p.id = ci.product_id
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

    $unit_type = $item['unit_type'];

    // ================= VALIDATION =================
    if ($unit_type === "kg") {
        $weight = floatval($weight);

        if ($weight <= 0) {
            throw new Exception("Invalid weight");
        }

        $quantity = 0;
    } else {
        $quantity = intval($quantity);

        if ($quantity <= 0) {
            throw new Exception("Invalid quantity");
        }

        $weight = 0;
    }

    // ================= UPDATE CART ITEM =================
    $stmt = $conn->prepare("
        UPDATE cart_items
        SET quantity = ?, weight = ?
        WHERE cart_item_id = ?
    ");

    $stmt->bind_param(
        "idi",
        $quantity,
        $weight,
        $cart_item_id
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to update cart item");
    }

    // ================= RESPONSE =================
    echo json_encode([
        "success" => true,
        "message" => "Cart updated successfully",
        "data" => [
            "cart_item_id" => (int) $cart_item_id,
            "quantity" => $quantity,
            "weight" => $weight,
            "unit_type" => $unit_type
        ]
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
