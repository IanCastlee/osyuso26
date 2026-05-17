<?php

ob_start();

include("../header.php");

header("Content-Type: application/json; charset=UTF-8");

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

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        throw new Exception("Invalid JSON input");
    }

    $order_id = filter_var($input["order_id"] ?? null, FILTER_VALIDATE_INT);

    if (!$order_id) {
        throw new Exception("Order ID is required");
    }

    $stmt = $conn->prepare("
        DELETE FROM orders
        WHERE id = ?
          AND user_id = ?
          AND payment_status = 'pending'
        LIMIT 1
    ");

    $stmt->bind_param("ii", $order_id, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows <= 0) {
        throw new Exception("Order not found or cannot be deleted");
    }

    echo json_encode([
        "success" => true,
        "message" => "Order deleted successfully"
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
