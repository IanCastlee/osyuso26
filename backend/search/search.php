<?php
ob_start();

include("../header.php");
require_once "../dbConn.php";

header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

date_default_timezone_set("Asia/Manila");

function response($success, $message, $data = [], $status = 200) {
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

function emptyResults($query, $type) {
    return [
        "query" => $query,
        "type" => $type,
        "products" => [
            "rows" => [],
            "has_more" => false,
            "next_cursor" => null
        ],
        "shops" => [
            "rows" => [],
            "has_more" => false,
            "next_cursor" => null
        ]
    ];
}

function buildBooleanQuery($query) {
    $query = strtolower(trim($query));
    $query = preg_replace("/[^a-z0-9\s]/i", " ", $query);
    $words = preg_split("/\s+/", $query);

    $clean = [];

    foreach ($words as $word) {
        $word = trim($word);

        if (strlen($word) >= 2) {
            $clean[] = "+" . $word . "*";
        }
    }

    return implode(" ", array_slice($clean, 0, 8));
}

function saleLabel($saleType, $saleValue) {
    $saleValue = (float)$saleValue;

    if ($saleType === "percent") {
        $value = rtrim(rtrim(number_format($saleValue, 2), "0"), ".");
        return $value . "% OFF";
    }

    if ($saleType === "fixed") {
        return "₱" . number_format($saleValue, 2) . " OFF";
    }

    return null;
}

function applySalePricing($row) {
    $now = date("Y-m-d H:i:s");

    $originalPrice = (float)$row["price"];
    $finalPrice = $originalPrice;

    $saleType = $row["sale_type"] ?? "none";
    $saleValue = (float)($row["sale_value"] ?? 0);

    $saleStarted =
        empty($row["sale_starts_at"]) ||
        $row["sale_starts_at"] <= $now;

    $saleNotEnded =
        empty($row["sale_ends_at"]) ||
        $row["sale_ends_at"] >= $now;

    $isOnSale =
        $saleType !== "none" &&
        $saleValue > 0 &&
        $saleStarted &&
        $saleNotEnded;

    if ($isOnSale) {
        if ($saleType === "percent") {
            $finalPrice = $originalPrice - ($originalPrice * ($saleValue / 100));
        }

        if ($saleType === "fixed") {
            $finalPrice = $originalPrice - $saleValue;
        }

        $finalPrice = max(0, $finalPrice);
    }

    $row["price"] = $originalPrice;
    $row["original_price"] = $originalPrice;
    $row["final_price"] = $finalPrice;
    $row["is_on_sale"] = $isOnSale ? 1 : 0;
    $row["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

    return $row;
}

function fetchProducts($conn, $search, $limit, $cursor = null) {
    $fetchLimit = $limit + 1;

    $sql = "
        SELECT
            p.id,
            p.shop_id,
            p.category_id,
            p.subcategory_id,
            p.name,
            p.description,
            p.price,
            p.stock,
            p.unit_type,
            p.status,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,
            p.created_at,

            pi.image_path,

            s.shop_name,

            MATCH(p.name, p.description)
                AGAINST (? IN BOOLEAN MODE) AS score
        FROM products p
        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1
        LEFT JOIN shops s
            ON s.id = p.shop_id
        WHERE p.status = 'active'
            AND MATCH(p.name, p.description)
                AGAINST (? IN BOOLEAN MODE)
    ";

    $params = [$search, $search];
    $types = "ss";

    if (!empty($cursor)) {
        $sql .= " AND p.id < ? ";
        $params[] = (int)$cursor;
        $types .= "i";
    }

    $sql .= "
        ORDER BY score DESC, p.id DESC
        LIMIT ?
    ";

    $params[] = $fetchLimit;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Product search prepare failed: " . $conn->error, [], 500);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();
    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = applySalePricing($row);
    }

    $hasMore = count($rows) > $limit;

    if ($hasMore) {
        array_pop($rows);
    }

    $last = !empty($rows) ? end($rows) : null;

    return [
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $hasMore && $last ? $last["id"] : null
    ];
}

function fetchShops($conn, $search, $limit, $cursor = null) {
    $fetchLimit = $limit + 1;

    $sql = "
        SELECT
            s.id,
            s.owner_id,
            s.shop_name,
            s.shop_description,
            s.address,
            s.nearby_landmark,
            s.phone,
            s.shop_logo,
            s.shop_cover_photo,
            s.created_at,
            MATCH(
                s.shop_name,
                s.shop_description,
                s.address,
                s.nearby_landmark
            ) AGAINST (? IN BOOLEAN MODE) AS score
        FROM shops s
        WHERE MATCH(
            s.shop_name,
            s.shop_description,
            s.address,
            s.nearby_landmark
        ) AGAINST (? IN BOOLEAN MODE)
    ";

    $params = [$search, $search];
    $types = "ss";

    if (!empty($cursor)) {
        $sql .= " AND s.id < ? ";
        $params[] = (int)$cursor;
        $types .= "i";
    }

    $sql .= "
        ORDER BY score DESC, s.id DESC
        LIMIT ?
    ";

    $params[] = $fetchLimit;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Shop search prepare failed: " . $conn->error, [], 500);
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

    return [
        "rows" => $rows,
        "has_more" => $hasMore,
        "next_cursor" => $hasMore && $last ? $last["id"] : null
    ];
}

try {
    $query = trim($_GET["q"] ?? "");
    $type = $_GET["type"] ?? "all";
    $limit = min(max((int)($_GET["limit"] ?? 20), 1), 50);

    $productCursor = $_GET["product_cursor"] ?? null;
    $shopCursor = $_GET["shop_cursor"] ?? null;

    if (!in_array($type, ["all", "products", "shops"], true)) {
        $type = "all";
    }

    if ($query === "") {
        response(true, "Empty search", emptyResults("", $type));
    }

    $search = buildBooleanQuery($query);

    if ($search === "") {
        response(true, "Search query too short", emptyResults($query, $type));
    }

    $results = emptyResults($query, $type);

    if ($type === "all" || $type === "products") {
        $results["products"] = fetchProducts(
            $conn,
            $search,
            $limit,
            $productCursor
        );
    }

    if ($type === "all" || $type === "shops") {
        $results["shops"] = fetchShops(
            $conn,
            $search,
            $limit,
            $shopCursor
        );
    }

    response(true, "Search results fetched successfully", $results);
} catch (Throwable $e) {
    error_log("Search failed: " . $e->getMessage());

    response(false, "Search failed", [], 500);
}