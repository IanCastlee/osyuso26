<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

try {

    // AUTH (optional for viewing product, but ok to keep)
    requireRole(["customer"]);

    if (!isset($_GET['product_id'])) {
        throw new Exception("Product ID is required");
    }

    $product_id = intval($_GET['product_id']);

    // ================= PRODUCT DETAILS (FIXED ARCHITECTURE) =================
    $query = "
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.unit_type,
            p.status,
            p.created_at,

            pi.image_path,

            s.id AS shop_id,
            s.shop_name,
            s.shop_description,
            s.address,
            s.nearby_landmark,
            s.phone,

            u.user_id,
            u.fullname,
            u.profile_picture

        FROM products p

        LEFT JOIN product_images pi 
            ON p.id = pi.product_id 
            AND pi.is_primary = 1

        INNER JOIN shops s
            ON p.shop_id = s.id

        INNER JOIN users u
            ON s.owner_id = u.user_id

        WHERE p.id = ?
        AND p.status = 'active'

        LIMIT 1
    ";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $product_id);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Product not found");
    }

    $product = $result->fetch_assoc();

    echo json_encode([
        "success" => true,
        "data" => $product
    ]);

} catch (Exception $e) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}