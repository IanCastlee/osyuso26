<?php
include("../header.php");

ob_start();

header("Content-Type: application/json");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

// ================= AUTH =================
$user = requireRole(["vendor", "admin"]);

$vendor_id = $user->user_id;

// ================= QUERY PARAMS =================
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$cursor = isset($_GET['cursor']) ? (int)$_GET['cursor'] : null;
$search = isset($_GET['search']) ? trim($_GET['search']) : "";

try {

    // ================= BASE QUERY =================
    $sql = "
        SELECT
            id,
            tag,
            title,
            description,
            image_path,
            start_date,
            product_id,
            expires_at,
            status,
            created_at
        FROM featured_promotions
        WHERE vendor_id = ?
    ";

    $params = [$vendor_id];
    $types = "i";

    // ================= SEARCH =================
    if (!empty($search)) {
        $sql .= " AND title LIKE ?";
        $params[] = "%{$search}%";
        $types .= "s";
    }

    // ================= CURSOR =================
    if ($cursor) {
        $sql .= " AND id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    // ================= ORDER =================
    $sql .= "
        ORDER BY id DESC
        LIMIT ?
    ";

    $params[] = $limit + 1;
    $types .= "i";

    // ================= PREPARE =================
    $stmt = $conn->prepare($sql);

    $stmt->bind_param($types, ...$params);

    $stmt->execute();

    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

  // ================= NEXT CURSOR =================
$next_cursor = null;

if (count($rows) > $limit) {

    array_pop($rows);

    $lastVisibleRow = end($rows);

    $next_cursor = $lastVisibleRow['id'];
}
    echo json_encode([
        "success" => true,
        "rows" => $rows,
        "next_cursor" => $next_cursor
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}