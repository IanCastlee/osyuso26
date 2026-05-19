<?php
include("../header.php");

date_default_timezone_set('Asia/Manila');

header("Content-Type: application/json");

require_once "../dbConn.php";

try {

    // ================= GET ACTIVE PROMOTIONS =================
    $stmt = $conn->prepare("
        SELECT
            id,
            product_id,
            tag,
            title,
            description,
            image_path,
            start_date,
            expires_at
        FROM featured_promotions
        WHERE
            status = 'active'
            AND start_date <= NOW()
            AND expires_at >= NOW()
        ORDER BY created_at ASC
    ");

    $stmt->execute();

    $result = $stmt->get_result();

    $promotions = [];

    while ($row = $result->fetch_assoc()) {
        $promotions[] = [
            "id" => (int)$row['id'],
            "product_id" => (int)$row['product_id'],
            "tag" => $row['tag'],
            "title" => $row['title'],
            "description" => $row['description'],
            "image_path" => $row['image_path'],
            "start_date" => $row['start_date'],
            "expires_at" => $row['expires_at'],
        ];
    }

    echo json_encode([
        "success" => true,
        "data" => $promotions
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}