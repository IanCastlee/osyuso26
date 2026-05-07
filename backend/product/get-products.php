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
    $limit  = max((int)($_GET['limit'] ?? 10), 1);
    $page   = max((int)($_GET['page'] ?? 1), 1);
    $offset = ($page - 1) * $limit;
    $search = $_GET['search'] ?? null;

    // ================= WHERE =================
    $conditions = ["p.vendor_id = ?"];
    $params = [$vendor_id];
    $types = "i";

    if (!empty($search)) {
        $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
        $like = "%$search%";
        $params[] = $like;
        $params[] = $like;
        $types .= "ss";
    }

    $whereSql = "WHERE " . implode(" AND ", $conditions);

    // ================= COUNT =================
    $countSql = "SELECT COUNT(*) as total FROM products p $whereSql";
    $countStmt = $conn->prepare($countSql);
    $countStmt->bind_param($types, ...$params);
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];

    // ================= STEP 1: GET IDS =================
    $idSql = "
        SELECT p.id
        FROM products p
        $whereSql
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $idParams = $params;
    $idTypes = $types . "ii";
    $idParams[] = $limit;
    $idParams[] = $offset;

    $stmt = $conn->prepare($idSql);
    $stmt->bind_param($idTypes, ...$idParams);
    $stmt->execute();

    $result = $stmt->get_result();
    $productIds = [];

    while ($row = $result->fetch_assoc()) {
        $productIds[] = $row['id'];
    }

    if (empty($productIds)) {
        response(true, "No products", [
            "rows" => [],
            "total" => 0,
            "page" => $page,
            "limit" => $limit
        ]);
    }

    // ================= STEP 2: FETCH FULL DATA =================
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $types = str_repeat('i', count($productIds));

    $dataSql = "
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            pi.image_path AS image
        FROM products p
        LEFT JOIN product_images pi 
            ON p.id = pi.product_id AND pi.is_primary = 1
        WHERE p.id IN ($placeholders)
        ORDER BY p.created_at DESC
    ";

    $stmt = $conn->prepare($dataSql);
    $stmt->bind_param($types, ...$productIds);
    $stmt->execute();

    $result = $stmt->get_result();

    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }

    response(true, "Products fetched", [
        "rows" => $products,
        "total" => $total,
        "page" => $page,
        "limit" => $limit,
        "total_pages" => ceil($total / $limit)
    ]);

} catch (Exception $e) {
    response(false, $e->getMessage());
}