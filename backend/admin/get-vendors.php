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

    $view = $_GET["view"] ?? "vendors";
    if (!in_array($view, ["vendors", "requests"], true)) {
        $view = "vendors";
    }

    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    if ($limit < 1) $limit = 10;
    if ($limit > 50) $limit = 50;

    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $search = trim($_GET["search"] ?? "");

    $summaryStmt = $conn->prepare("
        SELECT
            COUNT(DISTINCT u.user_id) AS total_vendors,
            SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_shops,
            SUM(CASE WHEN s.status = 'inactive' THEN 1 ELSE 0 END) AS inactive_shops,
            SUM(CASE WHEN s.status = 'banned' THEN 1 ELSE 0 END) AS banned_shops,
            (
                SELECT COUNT(*)
                FROM business_permits
                WHERE status = 'pending'
            ) AS pending_permits
        FROM users u
        LEFT JOIN shops s
            ON s.owner_id = u.user_id
        WHERE u.role = 'vendor'
    ");

    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc();

    $types = "";
    $params = [];
    $fetchLimit = $limit + 1;

    if ($view === "requests") {
        $where = "WHERE bp.status = 'pending'";

        if ($cursor > 0) {
            $where .= " AND bp.id < ?";
            $types .= "i";
            $params[] = $cursor;
        }

        if ($search !== "") {
            $where .= " AND (
                u.fullname LIKE ?
                OR u.email LIKE ?
                OR s.shop_name LIKE ?
                OR bp.permit_number LIKE ?
            )";

            $types .= "ssss";
            $searchTerm = "%" . $search . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql = "
            SELECT
                bp.id AS permit_id,
                bp.id AS cursor_id,
                bp.user_id,
                bp.permit_image,
                bp.permit_number,
                bp.status AS permit_status,
                bp.uploaded_at,

                u.fullname,
                u.email,
                u.status AS user_status,

                s.id AS shop_id,
                s.shop_name,
                s.address AS shop_address,
                s.nearby_landmark,
                s.phone,
                s.shop_logo,
                s.status AS shop_status
            FROM business_permits bp
            INNER JOIN users u
                ON u.user_id = bp.user_id
            LEFT JOIN shops s
                ON s.owner_id = u.user_id
            $where
            ORDER BY bp.id DESC
            LIMIT ?
        ";
    } else {
        $where = "WHERE u.role = 'vendor'";

        if ($cursor > 0) {
            $where .= " AND u.user_id < ?";
            $types .= "i";
            $params[] = $cursor;
        }

        if ($search !== "") {
            $where .= " AND (
                u.fullname LIKE ?
                OR u.email LIKE ?
                OR s.shop_name LIKE ?
                OR latest_permit.permit_number LIKE ?
            )";

            $types .= "ssss";
            $searchTerm = "%" . $search . "%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql = "
            SELECT
                u.user_id,
                u.user_id AS cursor_id,
                u.profile_picture,
                u.fullname,
                u.address,
                u.nearby,
                u.email,
                u.created_at,
                u.status AS user_status,

                s.id AS shop_id,
                s.shop_name,
                s.shop_description,
                s.address AS shop_address,
                s.nearby_landmark,
                s.phone,
                s.shop_logo,
                s.shop_cover_photo,
                s.status AS shop_status,

                latest_permit.id AS permit_id,
                latest_permit.permit_image,
                latest_permit.permit_number,
                latest_permit.status AS permit_status,
                latest_permit.uploaded_at
            FROM users u
            LEFT JOIN shops s
                ON s.owner_id = u.user_id
            LEFT JOIN (
                SELECT bp.*
                FROM business_permits bp
                INNER JOIN (
                    SELECT user_id, MAX(id) AS latest_id
                    FROM business_permits
                    GROUP BY user_id
                ) latest
                    ON latest.latest_id = bp.id
            ) latest_permit
                ON latest_permit.user_id = u.user_id
            $where
            ORDER BY u.user_id DESC
            LIMIT ?
        ";
    }

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
        $nextCursor = $rows[count($rows) - 1]["cursor_id"];
    }

    response(true, "Vendors loaded", [
        "summary" => [
            "total_vendors" => (int)($summary["total_vendors"] ?? 0),
            "active_shops" => (int)($summary["active_shops"] ?? 0),
            "inactive_shops" => (int)($summary["inactive_shops"] ?? 0),
            "banned_shops" => (int)($summary["banned_shops"] ?? 0),
            "pending_permits" => (int)($summary["pending_permits"] ?? 0)
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