<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require_once "../dbConn.php";
require_once "../helpers/cache.php";

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

try {
    $cacheKey = "featured_promotions:" . ($_SERVER["QUERY_STRING"] ?? "");
    $cached = appGetCache($cacheKey, 60);

    if ($cached !== null) {
        if (ob_get_length()) {
            ob_clean();
        }

        echo json_encode($cached);
        exit;
    }

    $stmt = $conn->prepare("
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

            p.name AS product_name,
            p.price AS product_price,
            p.unit_type,

            s.shop_name
        FROM featured_promotions fp
        INNER JOIN products p
            ON p.id = fp.product_id
        INNER JOIN shops s
            ON s.id = p.shop_id
        INNER JOIN users u
            ON u.user_id = fp.vendor_id
        WHERE fp.status = 'active'
            AND fp.payment_status = 'paid'
            AND fp.start_date <= NOW()
            AND fp.expires_at >= NOW()
            AND p.status = 'active'
            AND s.status = 'active'
            AND u.status = 'active'
        ORDER BY fp.created_at DESC
    ");

    $stmt->execute();

    $result = $stmt->get_result();
    $promotions = [];

    while ($row = $result->fetch_assoc()) {
        $promotions[] = [
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
            "product_name" => $row["product_name"],
            "product_price" => (float)$row["product_price"],
            "unit_type" => $row["unit_type"],
            "shop_name" => $row["shop_name"],
        ];
    }

    $response = [
        "success" => true,
        "message" => "Active promotions fetched successfully",
        "data" => $promotions
    ];

    appSetCache($cacheKey, $response);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($response);
    exit;
} catch (Throwable $e) {
    error_log("Get active promotions failed: " . $e->getMessage());

    response(false, $e->getMessage(), [], 400);
}

exit;