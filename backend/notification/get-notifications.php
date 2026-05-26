<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    $user = requireRole(["customer", "vendor", "admin"]);
    $user_id = (int)$user->user_id;

    $limit = min(max((int)($_GET["limit"] ?? 20), 1), 50);
    $fetchLimit = $limit + 1;

    $cursor = $_GET["cursor"] ?? null;
    $unreadOnly = ($_GET["unread"] ?? "") === "1";

    $sql = "
        SELECT
            id,
            actor_user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            is_read,
            read_at,
            created_at
        FROM notifications
        WHERE user_id = ?
    ";

    $params = [$user_id];
    $types = "i";

    if ($unreadOnly) {
        $sql .= " AND is_read = 0 ";
    }

    if ($cursor) {
        $sql .= " AND id < ? ";
        $params[] = (int)$cursor;
        $types .= "i";
    }

    $sql .= "
        ORDER BY id DESC
        LIMIT ?
    ";

    $params[] = $fetchLimit;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    $hasMore = count($rows) > $limit;

    if ($hasMore) {
        array_pop($rows);
    }

    $last = !empty($rows) ? end($rows) : null;

    $countStmt = $conn->prepare("
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = ?
            AND is_read = 0
    ");

    $countStmt->bind_param("i", $user_id);
    $countStmt->execute();

    $count = $countStmt->get_result()->fetch_assoc();

    response(true, "Notifications fetched", [
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $hasMore && $last ? $last["id"] : null,
        "unread_count" => (int)($count["unread_count"] ?? 0)
    ]);
} catch (Throwable $e) {
    response(false, $e->getMessage(), null, 400);
}