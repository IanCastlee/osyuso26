<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../helpers/cache.php";

date_default_timezone_set("Asia/Manila");

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
    $limit = isset($_GET["limit"]) ? intval($_GET["limit"]) : 12;
    $limit = min(max($limit, 1), 50);

    $cursor = isset($_GET["cursor"]) ? intval($_GET["cursor"]) : null;

    $cacheKey = "markets:" . ($_SERVER["QUERY_STRING"] ?? "");
    $cached = appGetCache($cacheKey, 60);

    if ($cached !== null) {
        if (ob_get_length()) {
            ob_clean();
        }

        echo json_encode($cached);
        exit;
    }

    $sql = "
        SELECT
            u.user_id,

            s.id AS shop_id,
            s.shop_name,
            s.shop_logo,
            s.shop_cover_photo,
            s.status AS shop_status,
            s.is_accepting_orders,
            s.operating_hours_enabled,
            s.opens_at,
            s.closes_at,
            s.closed_message
        FROM users u
        INNER JOIN shops s
            ON s.owner_id = u.user_id
        WHERE u.role = 'vendor'
            AND u.status = 'active'
            AND s.status = 'active'
    ";

    $params = [];
    $types = "";

    if ($cursor !== null) {
        $sql .= " AND u.user_id < ?";
        $params[] = $cursor;
        $types .= "i";
    }

    $sql .= " ORDER BY u.user_id DESC LIMIT ?";

    $params[] = $limit + 1;
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
        $isOpen = isShopOpen($row);

        $row["user_id"] = (int)$row["user_id"];
        $row["shop_id"] = (int)$row["shop_id"];
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

    $nextCursor = !empty($data) ? end($data)["user_id"] : null;

    $response = [
        "success" => true,
        "message" => "Markets fetched",
        "data" => [
            "data" => $data,
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
    error_log("Get markets failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}