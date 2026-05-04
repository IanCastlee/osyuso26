<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

include("../header.php");
include("../dbConn.php");

$result = mysqli_query($conn, "SELECT id, name FROM categories");

$categories = [];

while ($row = mysqli_fetch_assoc($result)) {
    $categories[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $categories
]);