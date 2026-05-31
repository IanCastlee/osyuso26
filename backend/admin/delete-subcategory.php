<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    if (ob_get_length()) ob_clean();

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function inputData() {
    $json = json_decode(file_get_contents("php://input"), true);
    return is_array($json) ? $json : $_POST;
}

function clearPublicCache() {
    foreach (glob(__DIR__ . "/../cache/*.json") as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

try {
    requireRole(["admin"]);

    $input = inputData();
    $id = (int)($input["id"] ?? 0);

    if ($id <= 0) {
        response(false, "Subcategory ID is required", null, 400);
    }

    $stmt = $conn->prepare("
        SELECT
            sc.id,

            (
                SELECT COUNT(*)
                FROM products p
                WHERE p.subcategory_id = sc.id
            ) AS product_count

        FROM subcategories sc
        WHERE sc.id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $subcategory = $stmt->get_result()->fetch_assoc();

    if (!$subcategory) {
        response(false, "Subcategory not found", null, 404);
    }

    if ((int)$subcategory["product_count"] > 0) {
        response(false, "Cannot delete subcategory with products", null, 400);
    }

    $delete = $conn->prepare("DELETE FROM subcategories WHERE id = ?");
    $delete->bind_param("i", $id);
    $delete->execute();

    clearPublicCache();

    response(true, "Subcategory deleted successfully");
} catch (Throwable $e) {
    error_log("Delete subcategory failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}