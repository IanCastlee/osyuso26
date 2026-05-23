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

function response($success, $message, $data = [], $extra = []) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], $extra));

    exit;
}

function getUserValue($user, $key) {
    if (is_object($user)) {
        return $user->{$key} ?? null;
    }

    if (is_array($user)) {
        return $user[$key] ?? null;
    }

    return null;
}

function bindParams($stmt, $types, &$params) {
    $refs = [];

    foreach ($params as $key => &$value) {
        $refs[$key] = &$value;
    }

    array_unshift($refs, $types);
    return call_user_func_array([$stmt, "bind_param"], $refs);
}

function getPlatformCommissionRate($conn) {
    $rate = 10.00;

    $stmt = $conn->prepare("
        SELECT platform_commission_rate
        FROM admin_settings
        ORDER BY id ASC
        LIMIT 1
    ");

    $stmt->execute();
    $setting = $stmt->get_result()->fetch_assoc();

    if ($setting && $setting["platform_commission_rate"] !== null) {
        $rate = (float)$setting["platform_commission_rate"];
    }

    if ($rate < 0 || $rate > 100) {
        throw new Exception("Invalid platform commission rate");
    }

    return $rate;
}

try {
    $user = requireRole(["vendor", "admin"]);

    $role = getUserValue($user, "role");
    $vendor_id = (int)getUserValue($user, "user_id");

    if ($role === "admin" && isset($_GET["vendor_id"])) {
        $vendor_id = (int)$_GET["vendor_id"];
    }

    if ($vendor_id <= 0) {
        response(false, "Invalid vendor", []);
    }

    $limit = isset($_GET["limit"]) ? (int)$_GET["limit"] : 10;
    if ($limit < 1) $limit = 10;
    if ($limit > 50) $limit = 50;

    $cursor = isset($_GET["cursor"]) ? (int)$_GET["cursor"] : 0;
    $search = trim($_GET["search"] ?? "");

   $today = new DateTimeImmutable("today", new DateTimeZone("Asia/Manila"));
$isSunday = in_array($today->format("w"), ["0", "5"], true);
$nextSunday = $isSunday ? $today : $today->modify("next sunday");

    $currentCommissionRate = getPlatformCommissionRate($conn);

    $summaryStmt = $conn->prepare("
        SELECT
            COALESCE(SUM(gross_amount), 0) AS gross_amount,
            COALESCE(SUM(commission_amount), 0) AS commission_amount,
            COALESCE(SUM(net_amount), 0) AS net_amount,
            COUNT(*) AS items_count
        FROM vendor_earnings
        WHERE vendor_id = ?
          AND status = 'available'
          AND payout_id IS NULL
          AND available_at <= NOW()
    ");

    $summaryStmt->bind_param("i", $vendor_id);
    $summaryStmt->execute();

    $summary = $summaryStmt->get_result()->fetch_assoc();

    $grossAmount = (float)$summary["gross_amount"];
    $commissionAmount = (float)$summary["commission_amount"];
    $netAmount = (float)$summary["net_amount"];
    $itemsCount = (int)$summary["items_count"];

    $displayCommissionRate = $grossAmount > 0
        ? round(($commissionAmount / $grossAmount) * 100, 2)
        : $currentCommissionRate;

    $pendingStmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM payouts
        WHERE vendor_id = ?
          AND status IN ('pending', 'processing')
    ");

    $pendingStmt->bind_param("i", $vendor_id);
    $pendingStmt->execute();

    $pending = $pendingStmt->get_result()->fetch_assoc();

    $where = "WHERE vendor_id = ?";
    $types = "i";
    $params = [$vendor_id];

    if ($cursor > 0) {
        $where .= " AND id < ?";
        $types .= "i";
        $params[] = $cursor;
    }

    if ($search !== "") {
        $where .= " AND reference_no LIKE ?";
        $types .= "s";
        $params[] = "%" . $search . "%";
    }

    $fetchLimit = $limit + 1;

    $sql = "
        SELECT
            id,
            reference_no,
            gross_amount,
            commission_rate,
            commission_amount,
            net_amount,
            items_count,
            period_start,
            period_end,
            status,
            requested_at,
            processed_at,
            paid_at,
            failure_reason,
            created_at
        FROM payouts
        $where
        ORDER BY id DESC
        LIMIT ?
    ";

    $types .= "i";
    $params[] = $fetchLimit;

    $stmt = $conn->prepare($sql);
    bindParams($stmt, $types, $params);
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
        $nextCursor = $rows[count($rows) - 1]["id"];
    }

    response(true, "Payout data loaded", [
        "summary" => [
            "available_gross_amount" => $grossAmount,
            "available_commission_amount" => $commissionAmount,
            "available_net_amount" => $netAmount,
            "available_items_count" => $itemsCount,
            "commission_rate" => $displayCommissionRate,
            "next_payout_date" => $nextSunday->format("Y-m-d"),
            "can_request_payout" => $isSunday,
            "has_pending_payout" => ((int)$pending["total"]) > 0
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