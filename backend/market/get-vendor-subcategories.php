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
    $category_id = $_GET['category_id'] ?? null;

    if (!$vendor_id || !$category_id) {
        response(false, "Missing vendor_id or category_id");
    }

    // ================= GET DISTINCT SUBCATEGORIES =================
    $stmt = $conn->prepare("
        SELECT DISTINCT
            sc.id,
            sc.name
        FROM products p

        INNER JOIN subcategories sc
            ON sc.id = p.subcategory_id

        WHERE p.vendor_id = ?
        AND p.category_id = ?
        AND p.status = 'active'

        ORDER BY sc.name ASC
    ");

    $stmt->bind_param("ii", $vendor_id, $category_id);

    $stmt->execute();

    $result = $stmt->get_result();

    $subcategories = [];

    while ($row = $result->fetch_assoc()) {
        $subcategories[] = $row;
    }

    response(true, "Subcategories fetched successfully", $subcategories);

} catch (Exception $e) {
    response(false, $e->getMessage());
}