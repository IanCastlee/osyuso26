<?php

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

include("../dbConn.php");

$shop_id = filter_input(INPUT_GET, 'shop_id', FILTER_VALIDATE_INT);
$category_id = filter_input(INPUT_GET, 'category_id', FILTER_VALIDATE_INT);
$subcategory_id = filter_input(INPUT_GET, 'subcategory_id', FILTER_VALIDATE_INT);
$cursor = filter_input(INPUT_GET, 'cursor', FILTER_VALIDATE_INT);

$limit = 20;
$fetchLimit = $limit + 1;

if (!$shop_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing shop_id"
    ]);
    exit;
}

$sql = "
    SELECT 
        p.id,
        p.name,
        p.price,
        p.stock,
        p.unit_type,
        pi.image_path,
        s.shop_name
    
    FROM products p
    LEFT JOIN product_images pi 
        ON pi.product_id = p.id 
        AND pi.is_primary = 1
    LEFT JOIN shops s 
        ON s.id = p.shop_id
    WHERE p.shop_id = ?
      AND p.status = 'active'
";

$params = [$shop_id];
$types = "i";

if ($category_id && !$subcategory_id) {
    $sql .= " AND p.category_id = ? ";
    $params[] = $category_id;
    $types .= "i";
}

if ($subcategory_id) {
    $sql .= " AND p.subcategory_id = ? ";
    $params[] = $subcategory_id;
    $types .= "i";
}

if ($cursor) {
    $sql .= " AND p.id < ? ";
    $params[] = $cursor;
    $types .= "i";
}

$sql .= " ORDER BY p.id DESC LIMIT ? ";
$params[] = $fetchLimit;
$types .= "i";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $row['id'] = (int) $row['id'];
    $row['price'] = (float) $row['price'];
    $row['stock'] = (float) $row['stock'];

    $data[] = $row;
}

$has_more = false;

if (count($data) > $limit) {
    $has_more = true;
    array_pop($data);
}

$next_cursor = $has_more && !empty($data) ? end($data)['id'] : null;

echo json_encode([
    "success" => true,
    "data" => $data,
    "next_cursor" => $next_cursor,
    "has_more" => $has_more
]);

exit;
