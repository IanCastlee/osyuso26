<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

try {

    // ================= AUTH =================
    $user = requireRole(["vendor", "admin"]);
    $vendor_id = $user->user_id;

    // ================= INPUT =================
    $limit = max((int)($_GET['limit'] ?? 10), 1);
    $cursor = $_GET['cursor'] ?? null;
    $search = trim($_GET['search'] ?? '');

    // ================= BASE CONDITIONS =================
    $conditions = ["p.vendor_id = ?"];
    $params = [$vendor_id];
    $types = "i";

    // ================= SEARCH =================
    if (!empty($search)) {
        $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
        $like = "%{$search}%";

        $params[] = $like;
        $params[] = $like;
        $types .= "ss";
    }

    // ================= CURSOR (STABLE: created_at + id) =================
    if (!empty($cursor)) {

        $conditions[] = "(
            p.created_at < (
                SELECT created_at FROM products WHERE id = ?
            )
            OR (
                p.created_at = (
                    SELECT created_at FROM products WHERE id = ?
                )
                AND p.id < ?
            )
        )";

        $params[] = $cursor;
        $params[] = $cursor;
        $params[] = $cursor;

        $types .= "iii";
    }

    $whereSql = "WHERE " . implode(" AND ", $conditions);

    // ================= MAIN QUERY =================
    $sql = "
        SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.created_at,
            pi.image_path AS image

        FROM products p

        LEFT JOIN product_images pi 
            ON p.id = pi.product_id 
            AND pi.is_primary = 1

        $whereSql

        ORDER BY p.created_at DESC, p.id DESC

        LIMIT ?
    ";

    $params[] = $limit + 1;
    $types .= "i";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    $stmt->execute();

    $result = $stmt->get_result();

    $products = [];

    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }

    // ================= HAS MORE =================
    $has_more = count($products) > $limit;

    if ($has_more) {
        array_pop($products);
    }

    // ================= NEXT CURSOR =================
    $next_cursor = null;

    if (!empty($products)) {
        $last = end($products);
        $next_cursor = $last['id'];
    }

    // ================= RESPONSE =================
    response(true, "Products fetched successfully", [
        "rows" => $products,
        "limit" => $limit,
        "has_more" => $has_more,
        "next_cursor" => $next_cursor
    ]);

} catch (Exception $e) {

    response(false, $e->getMessage());

}