<?php
ob_start();

include("../header.php");
include("../dbConn.php");
require_once "../helpers/cache.php";

header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

date_default_timezone_set("Asia/Manila");

function response($success, $message, $data = null, $extra = [], $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);

    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], $extra));

    exit;
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

function isShopOpen($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return false;
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return false;
    }

    if ((int)($shop["operating_hours_enabled"] ?? 0) !== 1) {
        return true;
    }

    if (empty($shop["opens_at"]) || empty($shop["closes_at"])) {
        return true;
    }

    $now = date("H:i:s");
    $opensAt = $shop["opens_at"];
    $closesAt = $shop["closes_at"];

    if ($opensAt <= $closesAt) {
        return $now >= $opensAt && $now <= $closesAt;
    }

    return $now >= $opensAt || $now <= $closesAt;
}

function getShopClosedMessage($shop) {
    if (($shop["shop_status"] ?? "") !== "active") {
        return "Shop is unavailable.";
    }

    if (!empty($shop["closed_message"])) {
        return $shop["closed_message"];
    }

    if ((int)($shop["is_accepting_orders"] ?? 1) !== 1) {
        return "Shop is closed now.";
    }

    return "Shop is closed now. Please order during operating hours.";
}

try {
    $subcategory_id = $_GET["subcategory_id"] ?? null;
    $category_id = $_GET["category_id"] ?? null;

    $cursor = $_GET["cursor"] ?? null;
    $direction = $_GET["direction"] ?? "next";

    if (!in_array($direction, ["next", "prev"], true)) {
        $direction = "next";
    }

    $limit = min(max((int)($_GET["limit"] ?? 20), 1), 50);
    $fetchLimit = $limit + 1;

    if (!$subcategory_id && !$category_id) {
        response(false, "Missing filter", null, [], 400);
    }

    $cacheKey = "get-products_c:" . ($_SERVER["QUERY_STRING"] ?? "");
    $cached = appGetCache($cacheKey, 30);

    if ($cached !== null) {
        if (ob_get_length()) {
            ob_clean();
        }

        echo json_encode($cached);
        exit;
    }

    $sql = "
        SELECT
            p.id,
            p.name,
            p.price,
            p.stock,
            p.unit_type,
            p.sale_type,
            p.sale_value,
            p.sale_starts_at,
            p.sale_ends_at,

            pi.image_path,

            s.id AS shop_id,
            s.shop_name,
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM products p

        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1

        INNER JOIN shops s
            ON s.id = p.shop_id

        WHERE p.status = 'active'
    ";

    $params = [];
    $types = "";

    if ($subcategory_id) {
        $sql .= " AND p.subcategory_id = ? ";
        $params[] = (int)$subcategory_id;
        $types .= "i";
    }

    if ($category_id) {
        $sql .= " AND p.category_id = ? ";
        $params[] = (int)$category_id;
        $types .= "i";
    }

    if ($cursor) {
        if ($direction === "next") {
            $sql .= " AND p.id < ? ";
        } else {
            $sql .= " AND p.id > ? ";
        }

        $params[] = (int)$cursor;
        $types .= "i";
    }

    $sql .= $direction === "next"
        ? " ORDER BY p.id DESC "
        : " ORDER BY p.id ASC ";

    $sql .= " LIMIT ? ";
    $params[] = $fetchLimit;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, [], 500);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();

    $data = [];
    $now = date("Y-m-d H:i:s");

    while ($row = $result->fetch_assoc()) {
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

        $isOpen = isShopOpen($row);

        $row["id"] = (int)$row["id"];
        $row["shop_id"] = (int)$row["shop_id"];
        $row["price"] = $originalPrice;
        $row["stock"] = (float)$row["stock"];
        $row["original_price"] = round($originalPrice, 2);
        $row["final_price"] = round($finalPrice, 2);
        $row["is_on_sale"] = $isOnSale ? 1 : 0;
        $row["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

        $row["is_shop_open"] = $isOpen ? 1 : 0;
        $row["shop_closed_message"] = $isOpen ? null : getShopClosedMessage($row);
        $row["shop_opens_at"] = $row["opens_at"];
        $row["shop_closes_at"] = $row["closes_at"];

        unset(
            $row["is_accepting_orders"],
            $row["operating_hours_enabled"],
            $row["opens_at"],
            $row["closes_at"],
            $row["closed_message"]
        );

        $data[] = $row;
    }

    $hasMore = count($data) > $limit;

    if ($hasMore) {
        array_pop($data);
    }

    if ($direction === "prev") {
        $data = array_reverse($data);
    }

    $nextCursor = null;
    $prevCursor = null;

    if (!empty($data)) {
        $last = end($data);
        $first = reset($data);

        $nextCursor = $hasMore ? $last["id"] : null;
        $prevCursor = $first["id"];
    }

    $response = array_merge([
        "success" => true,
        "message" => "Products fetched successfully",
        "data" => $data
    ], [
        "next_cursor" => $nextCursor,
        "prev_cursor" => $prevCursor,
        "has_more" => $hasMore,
        "limit" => $limit
    ]);

    appSetCache($cacheKey, $response);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($response);
    exit;
} catch (Throwable $e) {
    error_log("Get category products failed: " . $e->getMessage());

    response(false, "Failed to fetch products", null, [], 500);
}