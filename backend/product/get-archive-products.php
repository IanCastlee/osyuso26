<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = [], $extra = []) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], $extra));

    exit;
}

try {
    // ================= AUTH =================
    $user = requireRole(["vendor", "admin"]);
    $vendor_id = (int)$user->user_id;
    $role = $user->role ?? "";

    // ================= INPUT =================
    $limit = min(max((int)($_GET["limit"] ?? 10), 1), 50);
    $cursor = $_GET["cursor"] ?? null;
    $search = trim($_GET["search"] ?? "");

    // ================= BASE CONDITIONS =================
    // Inactive products only. Vendors only see products from their own shop.
    $conditions = ["p.status = 'inactive'"];
    $params = [];
    $types = "";

    if ($role !== "admin") {
        $conditions[] = "s.owner_id = ?";
        $params[] = $vendor_id;
        $types .= "i";
    }

    // ================= SEARCH =================
    if (!empty($search)) {
        $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
        $like = "%{$search}%";

        $params[] = $like;
        $params[] = $like;
        $types .= "ss";
    }

    // ================= CURSOR =================
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

        $params[] = (int)$cursor;
        $params[] = (int)$cursor;
        $params[] = (int)$cursor;
        $types .= "iii";
    }

    $whereSql = "WHERE " . implode(" AND ", $conditions);

    // ================= MAIN QUERY =================
    $sql = "
        SELECT 
            p.id,
            p.shop_id,
            p.category_id,
            p.subcategory_id,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.unit_type,
            p.status,
            p.created_at,
            p.updated_at,
            pi.image_path AS image
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        LEFT JOIN product_images pi 
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        $whereSql
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ?
    ";

    $params[] = $limit + 1;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error);
    }

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
        $next_cursor = $last["id"];
    }

    response(true, "Products fetched successfully", $products, [
        "limit" => $limit,
        "has_more" => $has_more,
        "next_cursor" => $next_cursor
    ]);
} catch (Exception $e) {
    response(false, $e->getMessage());
}