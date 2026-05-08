<?php

include("../header.php");

header("Content-Type: application/json");

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

    $category_id = $_GET['category_id'] ?? null;

    if (!$category_id) {
        throw new Exception("category_id is required");
    }

    // ================= UPDATED QUERY =================
    $stmt = $conn->prepare("
        SELECT 
            sc.id,
            sc.name,
            sc.category_id
        FROM subcategories sc
        INNER JOIN products p 
            ON p.subcategory_id = sc.id
        WHERE sc.category_id = ?
        GROUP BY sc.id
        ORDER BY sc.name ASC
    ");

    $stmt->bind_param("i", $category_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $subcategories = [];

    while ($row = $result->fetch_assoc()) {
        $subcategories[] = $row;
    }

    response(true, "Subcategories with products fetched", $subcategories);

} catch (Exception $e) {
    response(false, $e->getMessage());
}