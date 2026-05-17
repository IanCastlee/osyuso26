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
    $category_id = filter_input(INPUT_GET, 'category_id', FILTER_VALIDATE_INT);

    if (!$shop_id || !$category_id) {
        response(false, "Missing shop_id or category_id");
    }

    $stmt = $conn->prepare("
        SELECT DISTINCT
            sc.id,
            sc.name
        FROM products p
        INNER JOIN subcategories sc
            ON sc.id = p.subcategory_id
        WHERE p.shop_id = ?
          AND p.category_id = ?
          AND p.status = 'active'
        ORDER BY sc.name ASC
    ");

    $stmt->bind_param("ii", $shop_id, $category_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $subcategories = [];

    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int) $row['id'];
        $subcategories[] = $row;
    }

    response(true, "Subcategories fetched successfully", $subcategories);
} catch (Exception $e) {
    response(false, $e->getMessage());
}
