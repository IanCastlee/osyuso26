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

function response($success, $message, $data = []) {
    if (ob_get_length()) ob_clean();

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

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

    $type = $_GET["type"] ?? "registered";

    if (!in_array($type, ["registered", "unregistered"], true)) {
        $type = "registered";
    }

    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    if ($limit < 1) $limit = 10;
    if ($limit > 50) $limit = 50;

    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $search = trim($_GET["search"] ?? "");

    $summaryStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total_customers,
            SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) AS verified_customers,
            SUM(CASE WHEN email_verified = 0 OR email_verified IS NULL THEN 1 ELSE 0 END) AS unverified_customers,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_customers,
            SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) AS banned_customers
        FROM users
        WHERE role = 'customer'
    ");

    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc();

    $where = "WHERE role = 'customer'";
    $types = "";
    $params = [];

    if ($type === "registered") {
        $where .= " AND email_verified = 1";
    } else {
        $where .= " AND (email_verified = 0 OR email_verified IS NULL)";
    }

    if ($cursor > 0) {
        $where .= " AND user_id < ?";
        $types .= "i";
        $params[] = $cursor;
    }

    if ($search !== "") {
        $where .= " AND (
            fullname LIKE ?
            OR email LIKE ?
            OR address LIKE ?
            OR nearby LIKE ?
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
            user_id,
            profile_picture,
            fullname,
            address,
            nearby,
            email,
            created_at,
            updated_at,
            role,
            COALESCE(status, 'active') AS status,
            email_verified
        FROM users
        $where
        ORDER BY user_id DESC
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
        $nextCursor = $rows[count($rows) - 1]["user_id"];
    }

    response(true, "Customers loaded", [
        "summary" => [
            "total_customers" => (int)($summary["total_customers"] ?? 0),
            "verified_customers" => (int)($summary["verified_customers"] ?? 0),
            "unverified_customers" => (int)($summary["unverified_customers"] ?? 0),
            "active_customers" => (int)($summary["active_customers"] ?? 0),
            "banned_customers" => (int)($summary["banned_customers"] ?? 0)
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