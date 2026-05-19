<?php
ob_start();

include("../header.php");
header("Content-Type: application/json");

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
    $user = requireRole(["vendor", "admin"]);
    $vendor_id = (int)$user->user_id;
    $role = $user->role ?? "";

    $limit = min(max((int)($_GET["limit"] ?? 10), 1), 50);
    $fetchLimit = $limit + 1;

    $cursor = $_GET["cursor"] ?? null;
    $search = trim($_GET["search"] ?? "");
    $saleOnly = ($_GET["sale"] ?? "") === "1";

    $conditions = [
        "p.status = 'active'"
    ];

    $params = [];
    $types = "";

    if ($role !== "admin") {
        $conditions[] = "s.owner_id = ?";
        $params[] = $vendor_id;
        $types .= "i";
    }

    if ($search !== "") {
        $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
        $like = "%" . $search . "%";

        $params[] = $like;
        $params[] = $like;
        $types .= "ss";
    }

    if ($saleOnly) {
        $conditions[] = "
            p.sale_type <> 'none'
            AND p.sale_value > 0
            AND (p.sale_starts_at IS NULL OR p.sale_starts_at <= NOW())
            AND (p.sale_ends_at IS NULL OR p.sale_ends_at >= NOW())
        ";
    }

    if (!empty($cursor)) {
        $conditions[] = "
            (
                p.created_at < (
                    SELECT created_at
                    FROM products
                    WHERE id = ?
                )
                OR (
                    p.created_at = (
                        SELECT created_at
                        FROM products
                        WHERE id = ?
                    )
                    AND p.id < ?
                )
            )
        ";

        $params[] = (int)$cursor;
        $params[] = (int)$cursor;
        $params[] = (int)$cursor;
        $types .= "iii";
    }

    $whereSql = "WHERE " . implode(" AND ", $conditions);

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
            p.updated_at,

            pi.image_path AS image

        FROM products p

        INNER JOIN shops s
            ON s.id = p.shop_id

        LEFT JOIN product_images pi
            ON pi.product_id = p.id
            AND pi.is_primary = 1

        $whereSql

        ORDER BY p.created_at DESC, p.id DESC

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

    $products = [];
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

        $row["original_price"] = $originalPrice;
        $row["final_price"] = $finalPrice;
        $row["is_on_sale"] = $isOnSale ? 1 : 0;
        $row["sale_label"] = $isOnSale ? saleLabel($saleType, $saleValue) : null;

        $products[] = $row;
    }

    $hasMore = count($products) > $limit;

    if ($hasMore) {
        array_pop($products);
    }

    $last = !empty($products) ? end($products) : null;

    response(true, "Products fetched successfully", [
        "rows" => $products,
        "limit" => $limit,
        "has_more" => $hasMore,
        "next_cursor" => $hasMore && $last ? $last["id"] : null
    ]);
} catch (Throwable $e) {
    error_log("Get vendor products failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}