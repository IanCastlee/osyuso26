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

    // ================= GET USER ACTIVE CART =================
    $stmt = $conn->prepare("
        SELECT cart_id
        FROM carts
        WHERE user_id = ?
          AND status = 'active'
        LIMIT 1
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();

    $cart = $stmt->get_result()->fetch_assoc();

    // ================= EMPTY CART =================
    if (!$cart) {
        echo json_encode([
            "success" => true,
            "data" => []
        ]);
        exit;
    }

    $cart_id = $cart['cart_id'];

    // ================= GET CART ITEMS =================
    $stmt = $conn->prepare("
        SELECT
            ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.weight,
            ci.unit_type,
            ci.price,

            p.name,
            p.stock,

            pi.image_path,

            s.shop_name

        FROM cart_items ci

        INNER JOIN products p
            ON ci.product_id = p.id

        LEFT JOIN product_images pi
            ON p.id = pi.product_id
            AND pi.is_primary = 1

        INNER JOIN shops s
            ON p.shop_id = s.id

        WHERE ci.cart_id = ?

        ORDER BY ci.created_at DESC
    ");

    $stmt->bind_param("i", $cart_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $items = [];

    while ($row = $result->fetch_assoc()) {
        $row['price'] = (float) $row['price'];
        $row['weight'] = (float) $row['weight'];
        $row['quantity'] = (int) $row['quantity'];
        $row['stock'] = (int) $row['stock'];

        // ================= COMPUTE SUBTOTAL =================
        if ($row['unit_type'] === "kg") {
            $row['subtotal'] = $row['price'] * $row['weight'];
        } else {
            $row['subtotal'] = $row['price'] * $row['quantity'];
        }

        $items[] = $row;
    }

    // ================= RESPONSE =================
    echo json_encode([
        "success" => true,
        "data" => $items
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
