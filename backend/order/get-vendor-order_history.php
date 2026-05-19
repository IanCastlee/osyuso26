<?php
ob_start();

include("../header.php");
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

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
    $user = requireRole(["vendor", "admin"]);
    $user_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $limit = min(max((int)($_GET["limit"] ?? 10), 1), 50);
    $fetchLimit = $limit + 1;

    $cursor = $_GET["cursor"] ?? null;
    $search = trim($_GET["search"] ?? "");

    $conditions = ["o.claim_status = 'claimed'"];
    
    $params = [];
    $types = "";

    if ($role !== "admin") {
        $conditions[] = "s.owner_id = ?";
        $params[] = $user_id;
        $types .= "i";
    }

    if ($cursor) {
        $conditions[] = "o.id < ?";
        $params[] = (int)$cursor;
        $types .= "i";
    }

    if ($search !== "") {
        $conditions[] = "(
            p.name LIKE ?
            OR u.fullname LIKE ?
            OR u.email LIKE ?
            OR CAST(o.id AS CHAR) LIKE ?
        )";

        $like = "%" . $search . "%";

        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= "ssss";
    }

    $whereSql = "WHERE " . implode(" AND ", $conditions);

    $sql = "
        SELECT
            o.id,
            o.user_id,
            o.shop_id,
            o.product_id,
            o.quantity,
            o.weight,
            o.unit_price,
            o.total_amount,
            o.payment_status,
            o.xendit_invoice_id,
            o.created_at,
            o.claim_status,
            o.claimed_at,

            p.name AS product_name,
            p.unit_type,
            pi.image_path,

            s.shop_name,
            s.owner_id,

            u.fullname AS customer_name,
            u.email AS customer_email,

            r.receipt_no,
            r.paid_at
        FROM orders o
        INNER JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        LEFT JOIN users u
            ON u.user_id = o.user_id
        LEFT JOIN receipts r
            ON r.order_id = o.id
        $whereSql
        ORDER BY o.id DESC
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

    response(true, "Orders fetched successfully", [
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $hasMore && $last ? $last["id"] : null
    ]);
} catch (Throwable $e) {
    error_log("Get vendor orders failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}