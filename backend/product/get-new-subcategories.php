<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";

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
    $limit = 2;

    $stmt = $conn->prepare("
        SELECT
            sc.id,
            sc.category_id,
            sc.name,
            sc.created_at,

            c.name AS category_name,

            (
                SELECT pi.image_path
                FROM products p
                INNER JOIN product_images pi
                    ON pi.product_id = p.id
                    AND pi.is_primary = 1
                WHERE p.subcategory_id = sc.id
                    AND p.status = 'active'
                ORDER BY p.id DESC
                LIMIT 1
            ) AS image_path,

            (
                SELECT COUNT(*)
                FROM products p2
                WHERE p2.subcategory_id = sc.id
                    AND p2.status = 'active'
            ) AS product_count

        FROM subcategories sc

        INNER JOIN categories c
            ON c.id = sc.category_id

        ORDER BY sc.created_at DESC, sc.id DESC

        LIMIT ?
    ");

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param("i", $limit);
    $stmt->execute();

    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $row["category_id"] = (int)$row["category_id"];
        $row["product_count"] = (int)$row["product_count"];

        $rows[] = $row;
    }

    response(true, "Newest subcategories fetched", $rows);
} catch (Throwable $e) {
    error_log("Newest subcategories failed: " . $e->getMessage());

    response(false, "Failed to fetch newest subcategories", null, 500);
}