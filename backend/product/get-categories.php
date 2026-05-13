<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");
include("../header.php");
include("../dbConn.php");

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    $cursor = isset($_GET['cursor']) ? intval($_GET['cursor']) : null;

    $limitPlusOne = $limit + 1;

    $sql = "
        SELECT 
            c.id,
            c.name,
            c.created_at,

            (
                SELECT pi.image_path
                FROM products p
                INNER JOIN product_images pi 
                    ON pi.product_id = p.id
                WHERE p.category_id = c.id
                ORDER BY p.id ASC
                LIMIT 1
            ) AS image

        FROM categories c
        WHERE 1=1
    ";

    $params = [];
    $types = "";

    // ================= CURSOR =================
    if ($cursor !== null) {
        $sql .= " AND c.id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    // ================= ORDER + LIMIT =================
    $sql .= " ORDER BY c.id DESC LIMIT $limitPlusOne";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    // ================= HAS MORE =================
    $hasMore = count($data) > $limit;

    if ($hasMore) {
        array_pop($data);
    }

    $nextCursor = !empty($data) ? end($data)['id'] : null;

    response(true, "Categories fetched successfully", [
        "categories" => $data,
        "next_cursor" => $nextCursor,
        "has_more" => $hasMore
    ]);

} catch (Exception $e) {
    response(false, $e->getMessage());
}