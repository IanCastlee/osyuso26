<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";
require_once "../config/cloudinary.php";
require_once "../auth/middleware.php";

// ================= AUTH CHECK =================
$user = requireRole(["customer"]);

try {

    // CHECK PRODUCT ID
    if (!isset($_GET['product_id'])) {
        throw new Exception("Product ID is required");
    }

    $product_id = intval($_GET['product_id']);

    // GET PRODUCT DETAILS
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

            u.user_id,
            u.profile_picture,
            u.fullname,

            vp.shop_name,
            vp.shop_description,
            vp.address,
            vp.nearby_landmark,
            vp.phone

        FROM products p

        LEFT JOIN product_images pi 
            ON p.id = pi.product_id 
            AND pi.is_primary = 1

        LEFT JOIN users u
            ON p.vendor_id = u.user_id

        LEFT JOIN vendor_profiles vp
            ON u.user_id = vp.user_id

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