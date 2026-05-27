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
    $user = requireRole(["vendor", "admin"]);

    $vendorId = (int)($user->user_id ?? 0);
    $role = $user->role ?? "";

    if (!$vendorId) {
        throw new Exception("Unauthorized user");
    }

    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $search = trim($_GET["search"] ?? "");

    if ($limit < 1) {
        $limit = 10;
    }

    if ($limit > 50) {
        $limit = 50;
    }

    $where = ["1 = 1"];
    $types = "";
    $params = [];

    if ($role !== "admin") {
        $where[] = "fp.vendor_id = ?";
        $types .= "i";
        $params[] = $vendorId;
    }

    if ($search !== "") {
        $like = "%" . $search . "%";

        $where[] = "(
            fp.title LIKE ?
            OR fp.description LIKE ?
            OR fp.tag LIKE ?
            OR p.name LIKE ?
        )";

        $types .= "ssss";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    if ($cursor > 0) {
        $where[] = "fp.id < ?";
        $types .= "i";
        $params[] = $cursor;
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
            s.shop_name
        FROM featured_promotions fp
        LEFT JOIN products p
            ON p.id = fp.product_id
        LEFT JOIN shops s
            ON s.id = p.shop_id
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
            "xendit_invoice_id" => $row["xend_invoice_id"] ?? $row["xendit_invoice_id"],
            "xendit_checkout_url" => $row["xendit_checkout_url"],
            "paid_at" => $row["paid_at"],
            "created_at" => $row["created_at"],
            "updated_at" => $row["updated_at"],
            "product_name" => $row["product_name"],
            "shop_name" => $row["shop_name"],
        ];
    }

    $hasMore = count($rows) > $limit;

    if ($hasMore) {
        array_pop($rows);
    }

    $nextCursor = null;

    if ($hasMore && count($rows) > 0) {
        $lastVisibleRow = $rows[count($rows) - 1];
        $nextCursor = $lastVisibleRow["id"];
    }

    response(true, "Vendor promotions fetched successfully", [
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $nextCursor
    ]);
} catch (Throwable $e) {
    error_log("Get vendor promotions failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 400);
}

exit;