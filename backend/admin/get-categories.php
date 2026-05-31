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

try {
    requireRole(["admin"]);

    $stmt = $conn->prepare("
        SELECT
            c.id,
            c.name,
            c.created_at,

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
        ORDER BY c.name ASC, c.id DESC
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $row["subcategory_count"] = (int)$row["subcategory_count"];
        $row["product_count"] = (int)$row["product_count"];
        $rows[] = $row;
    }

    response(true, "Categories fetched successfully", [
        "categories" => $rows
    ]);
} catch (Throwable $e) {
    error_log("Get categories failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}