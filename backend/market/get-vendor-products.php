<?php
include("../header.php");
include("../dbConn.php");

header("Content-Type: application/json");

$vendor_id = $_GET['vendor_id'] ?? null;
$category_id = $_GET['category_id'] ?? null;
$subcategory_id = $_GET['subcategory_id'] ?? null;

$cursor = $_GET['cursor'] ?? null;
$limit = 20;
$fetchLimit = $limit + 1;

if (!$vendor_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing vendor_id"
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
    vp.shop_name
FROM products p

LEFT JOIN product_images pi 
    ON pi.product_id = p.id AND pi.is_primary = 1

LEFT JOIN vendor_profiles vp 
    ON vp.user_id = p.vendor_id

WHERE p.vendor_id = ?
AND p.status = 'active'
";

$params = [$vendor_id];
$types = "i";

// ================= CATEGORY FILTER =================
if ($category_id && !$subcategory_id) {
    $sql .= " AND p.category_id = ? ";
    $params[] = $category_id;
    $types .= "i";
}

// ================= SUBCATEGORY FILTER (HIGH PRIORITY) =================
if ($subcategory_id) {
    $sql .= " AND p.subcategory_id = ? ";
    $params[] = $subcategory_id;
    $types .= "i";
}

// ================= CURSOR =================
if ($cursor) {
    $sql .= " AND p.id < ? ";
    $params[] = $cursor;
    $types .= "i";
}

// ================= ORDER =================
$sql .= " ORDER BY p.id DESC LIMIT $fetchLimit";

// ================= EXECUTE =================
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
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

// ================= RESPONSE =================
echo json_encode([
    "success" => true,
    "data" => $data,
    "next_cursor" => $next_cursor,
    "has_more" => $has_more
]);