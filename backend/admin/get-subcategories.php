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
            sc.id,
            sc.category_id,
            sc.name,
            sc.created_at,

            c.name AS category_name,

            (
                SELECT COUNT(*)
                FROM products p
                WHERE p.subcategory_id = sc.id
            ) AS product_count

        FROM subcategories sc
        INNER JOIN categories c
            ON c.id = sc.category_id
        ORDER BY c.name ASC, sc.name ASC, sc.id DESC
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $row["category_id"] = (int)$row["category_id"];
        $row["product_count"] = (int)$row["product_count"];
        $rows[] = $row;
    }

    response(true, "Subcategories fetched successfully", [
        "subcategories" => $rows
    ]);
} catch (Throwable $e) {
    error_log("Get subcategories failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}