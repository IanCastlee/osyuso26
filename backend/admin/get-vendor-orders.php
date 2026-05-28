<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

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
    $user = requireRole(["admin"]);

    $limit = min(max((int)($_GET["limit"] ?? 10), 1), 50);
    $fetchLimit = $limit + 1;

    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : null;
    $search = trim($_GET["search"] ?? "");
    $view = trim($_GET["view"] ?? "unclaimed");

    $conditions = [];
    $params = [];
    $types = "";

    if ($view === "unclaimed") {
        $conditions[] = "o.payment_status = 'paid'";
        $conditions[] = "o.claim_status = 'unclaimed'";
    } elseif ($view === "pending") {
        $conditions[] = "o.payment_status = 'pending'";
    } elseif ($view === "history") {
        $conditions[] = "(
            o.claim_status = 'claimed'
            OR o.payment_status IN ('expired', 'failed')
        )";
    } else {
        $conditions[] = "1 = 1";
    }

    if ($cursor) {
        $conditions[] = "o.id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    if ($search !== "") {
        $conditions[] = "(
            p.name LIKE ?
            OR cu.fullname LIKE ?
            OR cu.email LIKE ?
            OR vu.fullname LIKE ?
            OR vu.email LIKE ?
            OR s.shop_name LIKE ?
            OR CAST(o.id AS CHAR) LIKE ?
        )";

        $like = "%" . $search . "%";

        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= "sssssss";
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
            o.xendit_checkout_url,
            o.created_at,
            o.claim_status,
            o.claimed_at,

            p.name AS product_name,
            p.unit_type,
            pi.image_path,

            s.shop_name,
            s.owner_id AS vendor_user_id,

            cu.fullname AS customer_name,
            cu.email AS customer_email,

            vu.fullname AS vendor_name,
            vu.email AS vendor_email,

            r.receipt_no,
            r.payment_reference,
            r.payment_method,
            r.payment_channel,
            r.amount_paid,
            r.paid_at
        FROM orders o
        INNER JOIN shops s
            ON s.id = o.shop_id
        LEFT JOIN products p
            ON p.id = o.product_id
        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        LEFT JOIN users cu
            ON cu.user_id = o.user_id
        LEFT JOIN users vu
            ON vu.user_id = s.owner_id
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
        $row["id"] = (int)$row["id"];
        $row["user_id"] = (int)$row["user_id"];
        $row["shop_id"] = (int)$row["shop_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["weight"] = (float)$row["weight"];
        $row["unit_price"] = (float)$row["unit_price"];
        $row["total_amount"] = (float)$row["total_amount"];
        $row["amount_paid"] = $row["amount_paid"] !== null
            ? (float)$row["amount_paid"]
            : null;

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
        "next_cursor" => $hasMore && $last ? $last["id"] : null,
        "view" => $view
    ]);
} catch (Throwable $e) {
    error_log("Get admin vendor orders failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}