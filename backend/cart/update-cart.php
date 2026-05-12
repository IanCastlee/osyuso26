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

    $cart_item_id = $data['cart_item_id'] ?? null;
    $quantity     = $data['quantity'] ?? 0;
    $weight       = $data['weight'] ?? 0;

    if (!$cart_item_id) {
        throw new Exception("Cart item required");
    }

    // ================= VERIFY OWNERSHIP =================
    $stmt = $conn->prepare("
        SELECT 
            ci.cart_item_id,
            ci.cart_id,
            ci.product_id,
            p.unit_type,
            p.price
        FROM cart_items ci
        JOIN carts c ON c.cart_id = ci.cart_id
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_item_id = ? AND c.user_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("ii", $cart_item_id, $user_id);
    $stmt->execute();

    $item = $stmt->get_result()->fetch_assoc();

    if (!$item) {
        throw new Exception("Cart item not found or unauthorized");
    }

    $unit_type = $item['unit_type'];

    // ================= NORMALIZE VALUES =================
    if ($unit_type === "kg") {

        $weight = max(0.5, floatval($weight));
        $quantity = 1;

    } else {

        $quantity = max(1, intval($quantity));
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
            "cart_item_id" => $cart_item_id,
            "quantity" => $quantity,
            "weight" => $weight,
            "unit_type" => $unit_type
        ]
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "error" => ""
    ]);
}