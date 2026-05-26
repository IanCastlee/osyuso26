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

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 12;
    $cursor = isset($_GET['cursor']) ? intval($_GET['cursor']) : null;

    $sql = "
        SELECT 
            u.user_id,
            s.shop_name,
            s.shop_logo,
            s.shop_cover_photo
        FROM users u
        INNER JOIN shops s 
            ON s.owner_id = u.user_id
        WHERE u.role = 'vendor' AND u.status = 'active' AND s.status = 'active'
    ";

    $params = [];
    $types = "";

    // ✅ FIXED CURSOR CHECK
    if ($cursor !== null) {
        $sql .= " AND u.user_id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    $sql .= " ORDER BY u.user_id DESC LIMIT ?";

    $params[] = $limit + 1;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    // ✅ detect extra row
    $hasMore = count($data) > $limit;

    if ($hasMore) {
        array_pop($data);
    }

    // ✅ safe next cursor
    $nextCursor = !empty($data) ? end($data)['user_id'] : null;

    response(true, "Markets fetched", [
        "data" => $data,
        "next_cursor" => $nextCursor,
        "has_more" => $hasMore
    ]);

} catch (Exception $e) {
    response(false, $e->getMessage());
}