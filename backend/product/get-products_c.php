<?php
include("../header.php");
include("../dbConn.php");

header("Content-Type: application/json");

$subcategory_id = $_GET['subcategory_id'] ?? null;
$category_id = $_GET['category_id'] ?? null;

$cursor = $_GET['cursor'] ?? null;
$direction = $_GET['direction'] ?? 'next';

$limit = 20;
$fetchLimit = $limit + 1;

// ================= VALIDATION =================
if (!$subcategory_id && !$category_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing filter"
    ]);
    exit;
}

// ================= BASE QUERY =================
$sql = "
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock,
    pi.image_path,
    s.shop_name
FROM products p

LEFT JOIN product_images pi 
    ON pi.product_id = p.id 
    AND pi.is_primary = 1

LEFT JOIN shops s 
    ON s.id = p.shop_id

WHERE 1=1
";

$params = [];
$types = "";

// ================= FILTER =================
if ($subcategory_id) {
    $sql .= " AND p.subcategory_id = ? ";
    $params[] = $subcategory_id;
    $types .= "i";
}

if ($category_id) {
    $sql .= " AND p.category_id = ? ";
    $params[] = $category_id;
    $types .= "i";
}

// ================= CURSOR =================
if ($cursor) {
    if ($direction === "next") {
        $sql .= " AND p.id < ? ";
    } else {
        $sql .= " AND p.id > ? ";
    }

    $params[] = $cursor;
    $types .= "i";
}

// ================= ORDER =================
$sql .= $direction === "next"
    ? " ORDER BY p.id DESC "
    : " ORDER BY p.id ASC ";

// ================= LIMIT =================
$sql .= " LIMIT $fetchLimit";

// ================= EXECUTE =================
$stmt = $conn->prepare($sql);

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
$has_more = false;

if (count($data) > $limit) {
    $has_more = true;
    array_pop($data);
}

// ================= CURSORS =================
$next_cursor = $has_more ? end($data)['id'] : null;
$prev_cursor = !empty($data) ? $data[0]['id'] : null;

// ================= RESPONSE =================
echo json_encode([
    "success" => true,
    "data" => $data,
    "next_cursor" => $next_cursor,
    "prev_cursor" => $prev_cursor,
    "has_more" => $has_more
]);