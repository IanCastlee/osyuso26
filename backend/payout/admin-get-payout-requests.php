<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);
date_default_timezone_set("Asia/Manila");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

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

function bindParams($stmt, $types, &$params) {
    $refs = [];

    foreach ($params as $key => &$value) {
        $refs[$key] = &$value;
    }

    array_unshift($refs, $types);
    return call_user_func_array([$stmt, "bind_param"], $refs);
}

try {
    requireRole(["admin"]);

    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    if ($limit < 1) $limit = 10;
    if ($limit > 50) $limit = 50;

    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $search = trim($_GET["search"] ?? "");
    $status = $_GET["status"] ?? "requests";

    $allowedStatuses = ["requests", "pending", "processing", "failed", "paid", "cancelled", "all"];

    if (!in_array($status, $allowedStatuses, true)) {
        $status = "requests";
    }

    $summaryStmt = $conn->prepare("
        SELECT
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
            COALESCE(SUM(CASE WHEN status IN ('pending', 'processing') THEN net_amount ELSE 0 END), 0) AS net_to_release,
            COALESCE(SUM(CASE WHEN status IN ('pending', 'processing') THEN commission_amount ELSE 0 END), 0) AS platform_fees
        FROM payouts
    ");

    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc();

    $where = "WHERE 1 = 1";
    $types = "";
    $params = [];

    if ($status === "requests") {
        $where .= " AND p.status IN ('pending', 'processing')";
    } elseif ($status !== "all") {
        $where .= " AND p.status = ?";
        $types .= "s";
        $params[] = $status;
    }

    if ($cursor > 0) {
        $where .= " AND p.id < ?";
        $types .= "i";
        $params[] = $cursor;
    }

    if ($search !== "") {
        $where .= " AND (
            p.reference_no LIKE ?
            OR u.fullname LIKE ?
            OR u.email LIKE ?
            OR s.shop_name LIKE ?
        )";

        $types .= "ssss";
        $searchTerm = "%" . $search . "%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $fetchLimit = $limit + 1;

    $sql = "
        SELECT
            p.id,
            p.vendor_id,
            p.reference_no,
            p.gross_amount,
            p.commission_rate,
            p.commission_amount,
            p.net_amount,
            p.items_count,
            p.period_start,
            p.period_end,
            p.status,
            p.requested_at,
            p.processed_at,
            p.paid_at,
            p.failure_reason,
            p.created_at,
            u.fullname AS vendor_name,
            u.email AS vendor_email,
            s.shop_name
        FROM payouts p
        LEFT JOIN users u
            ON u.user_id = p.vendor_id
        LEFT JOIN shops s
            ON s.owner_id = p.vendor_id
        $where
        ORDER BY p.id DESC
        LIMIT ?
    ";

    $types .= "i";
    $params[] = $fetchLimit;

    $stmt = $conn->prepare($sql);

    if ($types !== "") {
        bindParams($stmt, $types, $params);
    }

    $stmt->execute();

    $rows = [];
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    $hasMore = count($rows) > $limit;

    if ($hasMore) {
        array_pop($rows);
    }

    $nextCursor = null;

    if ($hasMore && count($rows) > 0) {
        $nextCursor = $rows[count($rows) - 1]["id"];
    }

    response(true, "Payout requests loaded", [
        "summary" => [
            "pending_count" => (int)($summary["pending_count"] ?? 0),
            "processing_count" => (int)($summary["processing_count"] ?? 0),
            "net_to_release" => (float)($summary["net_to_release"] ?? 0),
            "platform_fees" => (float)($summary["platform_fees"] ?? 0)
        ],
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $nextCursor
    ]);
} catch (Throwable $e) {
    response(false, "Server error", [
        "error" => $e->getMessage()
    ]);
}