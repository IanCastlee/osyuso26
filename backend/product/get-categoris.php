<?php

include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    $query = "
        SELECT 
            c.id,
            c.name,

            (
                SELECT pi.image_path
                FROM products p
                INNER JOIN product_images pi 
                    ON pi.product_id = p.id
                WHERE p.category_id = c.id
                LIMIT 1
            ) AS image

        FROM categories c
        ORDER BY c.name ASC
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        throw new Exception("Failed to fetch categories");
    }

    $categories = [];

    while ($row = mysqli_fetch_assoc($result)) {

        $categories[] = [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "image" => $row['image']
        ];
    }

    response(true, "Categories fetched successfully", $categories);

} catch (Exception $e) {

    response(false, $e->getMessage());
}