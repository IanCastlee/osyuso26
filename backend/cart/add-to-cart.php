<?php
include("../header.php");

ob_start();
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
    $product_id = $_POST['product_id'] ?? null;
    $quantity   = $_POST['quantity'] ?? 0;
    $weight     = $_POST['weight'] ?? 0;

    if (!$product_id) {
        throw new Exception("Product ID is required");
    }

    // ================= GET PRODUCT =================
    $stmt = $conn->prepare("SELECT price, unit_type FROM products WHERE id = ?");
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    $price = $product['price'];
    $unit_type = $product['unit_type'];

    // ================= CART =================
    $stmt = $conn->prepare("SELECT cart_id FROM carts WHERE user_id = ? AND status = 'active'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $cart = $stmt->get_result()->fetch_assoc();

    if (!$cart) {
        $stmt = $conn->prepare("INSERT INTO carts (user_id) VALUES (?)");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $cart_id = $conn->insert_id;
    } else {
        $cart_id = $cart['cart_id'];
    }

    // ================= CHECK EXISTING ITEM =================
    $stmt = $conn->prepare("
        SELECT cart_item_id, quantity, weight 
        FROM cart_items 
        WHERE cart_id = ? AND product_id = ?
    ");
    $stmt->bind_param("ii", $cart_id, $product_id);
    $stmt->execute();
    $item = $stmt->get_result()->fetch_assoc();

    if ($item) {

        // ================= UPDATE =================
        if ($unit_type === "kg") {
            $newWeight = $item['weight'] + $weight;

            $stmt = $conn->prepare("
                UPDATE cart_items 
                SET weight = ?
                WHERE cart_item_id = ?
            ");
            $stmt->bind_param("di", $newWeight, $item['cart_item_id']);
        } else {
            $newQty = $item['quantity'] + $quantity;

            $stmt = $conn->prepare("
                UPDATE cart_items 
                SET quantity = ?
                WHERE cart_item_id = ?
            ");
            $stmt->bind_param("ii", $newQty, $item['cart_item_id']);
        }

        $stmt->execute();

    } else {

        // ================= INSERT =================
        $stmt = $conn->prepare("
            INSERT INTO cart_items 
            (cart_id, product_id, quantity, weight, price, unit_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->bind_param(
            "iiidds",
            $cart_id,
            $product_id,
            $quantity,
            $weight,
            $price,
            $unit_type
        );

        $stmt->execute();
    }

    echo json_encode([
        "success" => true,
        "message" => "Added to cart successfully",
        "cart_id" => $cart_id
    ]);

} catch (Exception $e) {

    error_log($e->getMessage());

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

exit;