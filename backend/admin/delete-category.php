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
        response(false, "Category ID is required", null, 400);
    }

    $stmt = $conn->prepare("
        SELECT
            c.id,

            (
                SELECT COUNT(*)
                FROM subcategories sc
                WHERE sc.category_id = c.id
            ) AS subcategory_count,

            (
                SELECT COUNT(*)
                FROM products p
                WHERE p.category_id = c.id
            ) AS product_count

        FROM categories c
        WHERE c.id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $category = $stmt->get_result()->fetch_assoc();

    if (!$category) {
        response(false, "Category not found", null, 404);
    }

    if ((int)$category["subcategory_count"] > 0) {
        response(false, "Cannot delete category with subcategories", null, 400);
    }

    if ((int)$category["product_count"] > 0) {
        response(false, "Cannot delete category with products", null, 400);
    }

    $delete = $conn->prepare("DELETE FROM categories WHERE id = ?");
    $delete->bind_param("i", $id);
    $delete->execute();

    clearPublicCache();

    response(true, "Category deleted successfully");
} catch (Throwable $e) {
    error_log("Delete category failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}