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
    $owner_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $payload = json_decode(file_get_contents("php://input"), true);
    $product_id = (int)($payload["product_id"] ?? 0);

    if (!$product_id) {
        response(false, "Missing product ID", null, 400);
    }

    $conn->begin_transaction();

    if ($role === "admin") {
        $stmt = $conn->prepare("
            SELECT id, status
            FROM products
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->bind_param("i", $product_id);
    } else {
        $stmt = $conn->prepare("
            SELECT p.id, p.status
            FROM products p
            INNER JOIN shops s
                ON s.id = p.shop_id
            WHERE p.id = ?
                AND s.owner_id = ?
            LIMIT 1
            FOR UPDATE
        ");

        $stmt->bind_param("ii", $product_id, $owner_id);
    }

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();

    if (!$product) {
        throw new Exception("Product not found or not allowed");
    }

    if ($product["status"] === "active") {
        $conn->commit();

        response(true, "Product already active", [
            "product_id" => $product_id,
            "status" => "active"
        ]);
    }

    $update = $conn->prepare("
        UPDATE products
        SET status = 'active',
            updated_at = NOW()
        WHERE id = ?
    ");

    if (!$update) {
        throw new Exception("Update prepare failed: " . $conn->error);
    }

    $update->bind_param("i", $product_id);
    $update->execute();

    if ($update->affected_rows === 0) {
        throw new Exception("No product was updated");
    }

    $conn->commit();

    response(true, "Product moved to active", [
        "product_id" => $product_id,
        "status" => "active"
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Archive product failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}