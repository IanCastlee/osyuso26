<?php
ob_start();

error_reporting(E_ALL);
ini_set("display_errors", 0);

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../helpers/cache.php";

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

try {
    $limit = isset($_GET["limit"]) ? intval($_GET["limit"]) : 20;
    $limit = min(max($limit, 1), 50);

    $cursor = isset($_GET["cursor"]) ? intval($_GET["cursor"]) : null;
    $limitPlusOne = $limit + 1;

    $cacheKey = "categories:" . ($_SERVER["QUERY_STRING"] ?? "");
    $cached = appGetCache($cacheKey, 300);

    if ($cached !== null) {
        if (ob_get_length()) {
            ob_clean();
        }

        echo json_encode($cached);
        exit;
    }

    $sql = "
        SELECT
            c.id,
            c.name,
            c.created_at,

            (
                SELECT pi.image_path
                FROM products p
                INNER JOIN product_images pi
                    ON pi.product_id = p.id
                WHERE p.category_id = c.id
                    AND p.status = 'active'
                ORDER BY p.id ASC
                LIMIT 1
            ) AS image
        FROM categories c
        WHERE 1 = 1
    ";

    $params = [];
    $types = "";

    if ($cursor !== null) {
        $sql .= " AND c.id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    $sql .= " ORDER BY c.id DESC LIMIT ?";

    $params[] = $limitPlusOne;
    $types .= "i";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $data[] = $row;
    }

    $hasMore = count($data) > $limit;

    if ($hasMore) {
        array_pop($data);
    }

    $nextCursor = !empty($data) ? end($data)["id"] : null;

    $response = [
        "success" => true,
        "message" => "Categories fetched successfully",
        "data" => [
            "categories" => $data,
            "next_cursor" => $nextCursor,
            "has_more" => $hasMore
        ]
    ];

    appSetCache($cacheKey, $response);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($response);
    exit;
} catch (Throwable $e) {
    error_log("Get categories failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}