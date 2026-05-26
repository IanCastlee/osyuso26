<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

function bindParams($stmt, $types, &$params) {
    if (!$types || empty($params)) {
        return;
    }

    $bind = [$types];

    foreach ($params as $key => $value) {
        $bind[] = &$params[$key];
    }

    call_user_func_array([$stmt, "bind_param"], $bind);
}

try {
    requireRole(["admin"]);

    $status = $_GET["status"] ?? "pending";
    $search = trim($_GET["search"] ?? "");
    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;

    if ($limit < 1) {
        $limit = 10;
    }

    if ($limit > 50) {
        $limit = 50;
    }

    $summaryStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total_promotions,
            SUM(CASE WHEN status = 'pending' AND payment_status = 'paid' THEN 1 ELSE 0 END) AS pending_review,
            SUM(CASE WHEN status = 'active' AND payment_status = 'paid' THEN 1 ELSE 0 END) AS active_promotions,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_promotions,
            SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) AS pending_payment
        FROM featured_promotions
    ");

    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc() ?: [];

    $where = ["1 = 1"];
    $types = "";
    $params = [];

    if ($status === "pending") {
        $where[] = "fp.status = 'pending'";
        $where[] = "fp.payment_status = 'paid'";
    } elseif ($status === "active") {
        $where[] = "fp.status = 'active'";
    } elseif ($status === "rejected") {
        $where[] = "fp.status = 'rejected'";
    } elseif ($status === "pending_payment") {
        $where[] = "fp.status = 'pending_payment'";
    } elseif ($status !== "all") {
        $where[] = "fp.status = 'pending'";
        $where[] = "fp.payment_status = 'paid'";
    }

    if ($cursor > 0) {
        $where[] = "fp.id < ?";
        $types .= "i";
        $params[] = $cursor;
    }

    if ($search !== "") {
        $like = "%" . $search . "%";

        $where[] = "(
            fp.title LIKE ?
            OR fp.description LIKE ?
            OR p.name LIKE ?
            OR s.shop_name LIKE ?
            OR u.fullname LIKE ?
            OR u.email LIKE ?
        )";

        $types .= "ssssss";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $queryLimit = $limit + 1;
    $types .= "i";
    $params[] = $queryLimit;

    $sql = "
        SELECT
            fp.id,
            fp.product_id,
            fp.vendor_id,
            fp.tag,
            fp.title,
            fp.description,
            fp.image_path,
            fp.start_date,
            fp.expires_at,
            fp.total_hours,
            fp.total_price,
            fp.status,
            fp.payment_status,
            fp.xendit_invoice_id,
            fp.xendit_checkout_url,
            fp.paid_at,
            fp.created_at,
            fp.updated_at,

            p.name AS product_name,
            p.status AS product_status,

            s.shop_name,
            s.status AS shop_status,

            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM featured_promotions fp
        LEFT JOIN products p
            ON p.id = fp.product_id
        LEFT JOIN shops s
            ON s.id = p.shop_id
        LEFT JOIN users u
            ON u.user_id = fp.vendor_id
        WHERE " . implode(" AND ", $where) . "
        ORDER BY fp.id DESC
        LIMIT ?
    ";

    $stmt = $conn->prepare($sql);

    bindParams($stmt, $types, $params);

    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            "id" => (int)$row["id"],
            "product_id" => (int)$row["product_id"],
            "vendor_id" => (int)$row["vendor_id"],
            "tag" => $row["tag"],
            "title" => $row["title"],
            "description" => $row["description"],
            "image_path" => $row["image_path"],
            "start_date" => $row["start_date"],
            "expires_at" => $row["expires_at"],
            "total_hours" => (int)$row["total_hours"],
            "total_price" => (float)$row["total_price"],
            "status" => $row["status"],
            "payment_status" => $row["payment_status"],
            "xendit_invoice_id" => $row["xendit_invoice_id"],
            "xendit_checkout_url" => $row["xendit_checkout_url"],
            "paid_at" => $row["paid_at"],
            "created_at" => $row["created_at"],
            "updated_at" => $row["updated_at"],
            "product_name" => $row["product_name"],
            "product_status" => $row["product_status"],
            "shop_name" => $row["shop_name"],
            "shop_status" => $row["shop_status"],
            "vendor_name" => $row["vendor_name"],
            "vendor_email" => $row["vendor_email"],
        ];
    }

    $hasMore = count($rows) > $limit;

    if ($hasMore) {
        array_pop($rows);
    }

    $nextCursor = null;

    if ($hasMore && count($rows) > 0) {
        $lastRow = $rows[count($rows) - 1];
        $nextCursor = $lastRow["id"];
    }

    response(true, "Promotions fetched successfully", [
        "summary" => [
            "total_promotions" => (int)($summary["total_promotions"] ?? 0),
            "pending_review" => (int)($summary["pending_review"] ?? 0),
            "active_promotions" => (int)($summary["active_promotions"] ?? 0),
            "rejected_promotions" => (int)($summary["rejected_promotions"] ?? 0),
            "pending_payment" => (int)($summary["pending_payment"] ?? 0),
        ],
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $nextCursor
    ]);
} catch (Throwable $e) {
    error_log("Get promotion requests failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;