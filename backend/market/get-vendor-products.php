<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

include("../dbConn.php");

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

try {
    $shop_id = filter_input(INPUT_GET, "shop_id", FILTER_VALIDATE_INT);
    $category_id = filter_input(INPUT_GET, "category_id", FILTER_VALIDATE_INT);
    $subcategory_id = filter_input(INPUT_GET, "subcategory_id", FILTER_VALIDATE_INT);
    $cursor = filter_input(INPUT_GET, "cursor", FILTER_VALIDATE_INT);

    $limit = min(max((int)($_GET["limit"] ?? 20), 1), 50);
    $fetchLimit = $limit + 1;

    if (!$shop_id) {
        response(false, "Missing shop_id", null, [], 400);
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

            s.shop_name

        FROM products p

        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1

        LEFT JOIN shops s
            ON s.id = p.shop_id

        WHERE p.shop_id = ?
            AND p.status = 'active'
    ";

    $params = [$shop_id];
    $types = "i";

    if ($category_id && !$subcategory_id) {
        $sql .= " AND p.category_id = ? ";
        $params[] = $category_id;
        $types .= "i";
    }

    if ($subcategory_id) {
        $sql .= " AND p.subcategory_id = ? ";
        $params[] = $subcategory_id;
        $types .= "i";
    }

    if ($cursor) {
        $sql .= " AND p.id < ? ";
        $params[] = $cursor;
        $types .= "i";
    }

    $sql .= " ORDER BY p.id DESC LIMIT ? ";
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

        $row["id"] = (int)$row["id"];
        $row["price"] = $originalPrice;
        $row["stock"] = (float)$row["stock"];
        $row["original_price"] = $originalPrice;
        $row["final_price"] = $finalPrice;
        $row["is_on_sale"] = $isOnSale ? 1 : 0;
        $row["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

        $data[] = $row;
    }

    $has_more = count($data) > $limit;

    if ($has_more) {
        array_pop($data);
    }

    $next_cursor = $has_more && !empty($data) ? end($data)["id"] : null;

    response(true, "Products fetched successfully", $data, [
        "next_cursor" => $next_cursor,
        "has_more" => $has_more,
        "limit" => $limit
    ]);
} catch (Throwable $e) {
    error_log("Get vendor market products failed: " . $e->getMessage());

    response(false, "Failed to fetch products", null, [], 500);
}