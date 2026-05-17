<?php
ob_start();
include("../header.php");

header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

try {
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

    $product_id = filter_input(INPUT_POST, 'product_id', FILTER_VALIDATE_INT);
    $quantity = filter_input(INPUT_POST, 'quantity', FILTER_VALIDATE_INT);
    $weight = filter_input(INPUT_POST, 'weight', FILTER_VALIDATE_FLOAT);

    if (!$product_id) {
        throw new Exception("Product ID is required");
    }

    $quantity = $quantity ?: 0;
    $weight = $weight ?: 0;

    $stmt = $conn->prepare("SELECT price, unit_type FROM products WHERE id = ?");
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found");
    }

    $price = (float) $product['price'];
    $unit_type = $product['unit_type'];

    if ($unit_type === "kg") {
        if ($weight <= 0) {
            throw new Exception("Weight must be greater than zero");
        }

        $quantity = 0;
    } else {
        if ($quantity <= 0) {
            throw new Exception("Quantity must be greater than zero");
        }

        $weight = 0;
    }

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

    $stmt = $conn->prepare("
        SELECT cart_item_id, quantity, weight
        FROM cart_items
        WHERE cart_id = ? AND product_id = ?
    ");
    $stmt->bind_param("ii", $cart_id, $product_id);
    $stmt->execute();
    $item = $stmt->get_result()->fetch_assoc();

    if ($item) {
        if ($unit_type === "kg") {
            $newWeight = (float) $item['weight'] + $weight;

            $stmt = $conn->prepare("
                UPDATE cart_items
                SET weight = ?
                WHERE cart_item_id = ?
            ");
            $stmt->bind_param("di", $newWeight, $item['cart_item_id']);
        } else {
            $newQty = (int) $item['quantity'] + $quantity;

            $stmt = $conn->prepare("
                UPDATE cart_items
                SET quantity = ?
                WHERE cart_item_id = ?
            ");
            $stmt->bind_param("ii", $newQty, $item['cart_item_id']);
        }

        $stmt->execute();
    } else {
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

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

exit;
