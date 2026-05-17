<?php
include("../header.php");
include("../dbConn.php");

header("Content-Type: application/json; charset=UTF-8");

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {
    $shop_id = filter_input(INPUT_GET, 'shop_id', FILTER_VALIDATE_INT);

    if (!$shop_id) {
        response(false, "Missing shop_id");
    }

    $stmt = $conn->prepare("
        SELECT DISTINCT
            c.id,
            c.name
        FROM products p
        INNER JOIN categories c
            ON c.id = p.category_id
        WHERE p.shop_id = ?
          AND p.status = 'active'
        ORDER BY c.name ASC
    ");

    $stmt->bind_param("i", $shop_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $categories = [];

    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $categories[] = $row;
    }

    response(true, "Categories fetched successfully", $categories);
} catch (Exception $e) {
    response(false, $e->getMessage());
}
