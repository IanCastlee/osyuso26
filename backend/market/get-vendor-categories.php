<?php
include("../header.php");
include("../dbConn.php");

header("Content-Type: application/json");

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    $vendor_id = $_GET['vendor_id'] ?? null;

    if (!$vendor_id) {
        response(false, "Missing vendor_id");
    }

    // ================= OPTIMIZED QUERY =================
    $stmt = $conn->prepare("
        SELECT 
            c.id,
            c.name
        FROM categories c
        WHERE c.id IN (
            SELECT DISTINCT p.category_id
            FROM products p
            WHERE p.vendor_id = ?
            AND p.status = 'active'
        )
        ORDER BY c.name ASC
    ");

    $stmt->bind_param("i", $vendor_id);
    $stmt->execute();

    $result = $stmt->get_result();

    $categories = [];

    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }

    response(true, "Categories fetched successfully", $categories);

} catch (Exception $e) {
    response(false, $e->getMessage());
}