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
    if (!$types || empty($params)) return;

    $bind = [$types];

    foreach ($params as $key => $value) {
        $bind[] = &$params[$key];
    }

    call_user_func_array([$stmt, "bind_param"], $bind);
}

function isSaleActive($row) {
    $saleType = $row["sale_type"] ?? "none";
    $saleValue = (float)($row["sale_value"] ?? 0);
    $now = date("Y-m-d H:i:s");

    if ($saleType === "none" || $saleValue <= 0) return false;
    if (!empty($row["sale_starts_at"]) && $row["sale_starts_at"] > $now) return false;
    if (!empty($row["sale_ends_at"]) && $row["sale_ends_at"] < $now) return false;

    return true;
}

function getSaleLabel($row) {
    if (!isSaleActive($row)) return null;

    $saleType = $row["sale_type"] ?? "none";
    $saleValue = (float)($row["sale_value"] ?? 0);

    if ($saleType === "percent") {
        return rtrim(rtrim(number_format($saleValue, 2, ".", ""), "0"), ".") . "% OFF";
    }

    if ($saleType === "fixed") {
        return "PHP " . number_format($saleValue, 2) . " OFF";
    }

    return "On Sale";
}

try {
    requireRole(["admin"]);

    $status = $_GET["status"] ?? "all";
    $search = trim($_GET["search"] ?? "");
    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;

    if ($limit < 1) $limit = 10;
    if ($limit > 50) $limit = 50;

    $summaryStmt = $conn->prepare("
        SELECT
            COUNT(*) AS total_products,
            SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_products,
            SUM(CASE WHEN p.status = 'inactive' THEN 1 ELSE 0 END) AS inactive_products,
            SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) AS out_of_stock
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        INNER JOIN users u
            ON u.user_id = s.owner_id
        WHERE u.role = 'vendor'
    ");

    $summaryStmt->execute();
    $summary = $summaryStmt->get_result()->fetch_assoc() ?: [];

    $where = ["u.role = 'vendor'"];
    $types = "";
    $params = [];

    if ($status === "active") {
        $where[] = "p.status = 'active'";
    } elseif ($status === "inactive") {
        $where[] = "p.status = 'inactive'";
    } elseif ($status === "out_of_stock") {
        $where[] = "p.stock <= 0";
    }

    if ($cursor > 0) {
        $where[] = "p.id < ?";
        $types .= "i";
        $params[] = $cursor;
    }

    if ($search !== "") {
        $like = "%" . $search . "%";

        $where[] = "(
            p.name LIKE ?
            OR p.description LIKE ?
            OR s.shop_name LIKE ?
            OR u.fullname LIKE ?
            OR u.email LIKE ?
        )";

        $types .= "sssss";
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
            p.id,
            p.name,
            p.description,
            p.price,
            p.unit_type,
            p.stock,
            p.status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,
            p.created_at,
            p.updated_at,

            pi.image_path,

            s.id AS shop_id,
            s.shop_name,
            s.status AS shop_status,

            u.user_id AS vendor_id,
            u.fullname AS vendor_name,
            u.email AS vendor_email,
            u.status AS vendor_status
        FROM products p
        INNER JOIN shops s
            ON s.id = p.shop_id
        INNER JOIN users u
            ON u.user_id = s.owner_id
        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        WHERE " . implode(" AND ", $where) . "
        ORDER BY p.id DESC
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
            "name" => $row["name"],
            "description" => $row["description"],
            "price" => (float)$row["price"],
            "unit_type" => $row["unit_type"],
            "stock" => (float)$row["stock"],
            "status" => $row["status"],
            "sale_type" => $row["sale_type"],
            "sale_value" => (float)($row["sale_value"] ?? 0),
            "sale_starts_at" => $row["sale_starts_at"],
            "sale_ends_at" => $row["sale_ends_at"],
            "is_on_sale" => isSaleActive($row),
            "sale_label" => getSaleLabel($row),
            "created_at" => $row["created_at"],
            "updated_at" => $row["updated_at"],
            "image_path" => $row["image_path"],
            "shop_id" => (int)$row["shop_id"],
            "shop_name" => $row["shop_name"],
            "shop_status" => $row["shop_status"],
            "vendor_id" => (int)$row["vendor_id"],
            "vendor_name" => $row["vendor_name"],
            "vendor_email" => $row["vendor_email"],
            "vendor_status" => $row["vendor_status"],
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

    response(true, "Products fetched successfully", [
        "summary" => [
            "total_products" => (int)($summary["total_products"] ?? 0),
            "active_products" => (int)($summary["active_products"] ?? 0),
            "inactive_products" => (int)($summary["inactive_products"] ?? 0),
            "out_of_stock" => (int)($summary["out_of_stock"] ?? 0),
        ],
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $nextCursor
    ]);
} catch (Throwable $e) {
    error_log("Get admin products failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;