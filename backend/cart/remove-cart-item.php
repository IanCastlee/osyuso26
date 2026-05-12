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

    if (!$cart_item_id) {
        throw new Exception("Cart item required");
    }

    // ================= VERIFY OWNERSHIP =================
    $stmt = $conn->prepare("
        SELECT ci.cart_item_id
        FROM cart_items ci
        JOIN carts c ON c.cart_id = ci.cart_id
        WHERE ci.cart_item_id = ? AND c.user_id = ?
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

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "error" => ""
    ]);
}