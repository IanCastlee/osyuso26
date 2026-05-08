<?php

header("Content-Type: application/json");

include("../header.php");
include("../dbConn.php");

$category_id = $_GET['category_id'] ?? null;

if (!$category_id) {
    echo json_encode(["success" => false, "message" => "Missing category_id"]);
    exit;
}

$result = mysqli_query(
    $conn,
    "SELECT id, name FROM subcategories WHERE category_id = $category_id"
);

$subs = [];

while ($row = mysqli_fetch_assoc($result)) {
    $subs[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $subs
]);