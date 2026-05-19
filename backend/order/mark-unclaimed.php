<?php
ob_start();

include("../header.php");
header("Content-Type: application/json");

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
    $user = requireRole(["vendor", "admin"]);
    $user_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $payload = json_decode(file_get_contents("php://input"), true);
    $order_id = (int)($payload["order_id"] ?? 0);

    if (!$order_id) {
        response(false, "Missing order ID", null, 400);
    }

    $conn->begin_transaction();

    if ($role === "admin") {
        $stmt = $conn->prepare("
            SELECT
                o.id,
                o.payment_status,
                o.claim_status
            FROM orders o
            WHERE o.id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->bind_param("i", $order_id);
    } else {
        $stmt = $conn->prepare("
            SELECT
                o.id,
                o.payment_status,
                o.claim_status
            FROM orders o
            INNER JOIN shops s
                ON s.id = o.shop_id
            WHERE o.id = ?
                AND s.owner_id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->bind_param("ii", $order_id, $user_id);
    }

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();

    if (!$order) {
        throw new Exception("Order not found or not allowed");
    }

    if ($order["payment_status"] !== "paid") {
        throw new Exception("Only paid orders can be marked as unclaimed");
    }

    if ($order["claim_status"] === "unclaimed") {
        $conn->commit();

        response(true, "Order already unclaimed", [
            "order_id" => $order_id,
            "claim_status" => "unclaimed"
        ]);
    }

    $update = $conn->prepare("
        UPDATE orders
        SET claim_status = 'unclaimed',
            claimed_at = NULL
        WHERE id = ?
    ");

    if (!$update) {
        throw new Exception("Update prepare failed: " . $conn->error);
    }

    $update->bind_param("i", $order_id);
    $update->execute();

    if ($update->affected_rows === 0) {
        throw new Exception("No order was updated");
    }

    $conn->commit();

    response(true, "Order marked as unclaimed", [
        "order_id" => $order_id,
        "claim_status" => "unclaimed",
        "claimed_at" => null
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Mark unclaimed failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}