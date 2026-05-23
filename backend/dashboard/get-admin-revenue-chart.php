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

function response($success, $message, $data = []) {
    if (ob_get_length()) ob_clean();

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    requireRole(["admin"]);

    $range = $_GET["range"] ?? "daily";
    $allowed = ["daily", "weekly", "monthly", "annual"];

    if (!in_array($range, $allowed, true)) {
        $range = "daily";
    }

    $rows = [];

    if ($range === "daily") {
        $start = date("Y-m-d 00:00:00", strtotime("monday this week"));
        $end = date("Y-m-d 23:59:59", strtotime("sunday this week"));

        $labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        foreach ($labels as $label) {
            $rows[$label] = [
                "label" => $label,
                "gross" => 0,
                "platform_fee" => 0,
                "net_released" => 0
            ];
        }

        $earningSelect = "DATE_FORMAT(available_at, '%a')";
        $earningGroup = "DATE(available_at), DATE_FORMAT(available_at, '%a')";

        $payoutSelect = "DATE_FORMAT(paid_at, '%a')";
        $payoutGroup = "DATE(paid_at), DATE_FORMAT(paid_at, '%a')";
    } elseif ($range === "weekly") {
        $start = date("Y-m-01 00:00:00");
        $end = date("Y-m-t 23:59:59");

        for ($i = 1; $i <= 5; $i++) {
            $label = "Week " . $i;
            $rows[$label] = [
                "label" => $label,
                "gross" => 0,
                "platform_fee" => 0,
                "net_released" => 0
            ];
        }

        $earningSelect = "CONCAT('Week ', FLOOR((DAYOFMONTH(available_at) - 1) / 7) + 1)";
        $earningGroup = $earningSelect;

        $payoutSelect = "CONCAT('Week ', FLOOR((DAYOFMONTH(paid_at) - 1) / 7) + 1)";
        $payoutGroup = $payoutSelect;
    } elseif ($range === "monthly") {
        $start = date("Y-01-01 00:00:00");
        $end = date("Y-12-31 23:59:59");

        $labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        foreach ($labels as $label) {
            $rows[$label] = [
                "label" => $label,
                "gross" => 0,
                "platform_fee" => 0,
                "net_released" => 0
            ];
        }

        $earningSelect = "DATE_FORMAT(available_at, '%b')";
        $earningGroup = "MONTH(available_at), DATE_FORMAT(available_at, '%b')";

        $payoutSelect = "DATE_FORMAT(paid_at, '%b')";
        $payoutGroup = "MONTH(paid_at), DATE_FORMAT(paid_at, '%b')";
    } else {
        $start = date("Y-01-01 00:00:00", strtotime("-4 years"));
        $end = date("Y-12-31 23:59:59");

        for ($year = (int)date("Y") - 4; $year <= (int)date("Y"); $year++) {
            $label = (string)$year;
            $rows[$label] = [
                "label" => $label,
                "gross" => 0,
                "platform_fee" => 0,
                "net_released" => 0
            ];
        }

        $earningSelect = "DATE_FORMAT(available_at, '%Y')";
        $earningGroup = "YEAR(available_at)";

        $payoutSelect = "DATE_FORMAT(paid_at, '%Y')";
        $payoutGroup = "YEAR(paid_at)";
    }

    $stmt = $conn->prepare("
        SELECT
            {$earningSelect} AS label,
            COALESCE(SUM(gross_amount), 0) AS gross,
            COALESCE(SUM(commission_amount), 0) AS platform_fee
        FROM vendor_earnings
        WHERE status IN ('available', 'processing', 'paid')
          AND available_at BETWEEN ? AND ?
        GROUP BY {$earningGroup}
    ");

    $stmt->bind_param("ss", $start, $end);
    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        if (isset($rows[$row["label"]])) {
            $rows[$row["label"]]["gross"] = (float)$row["gross"];
            $rows[$row["label"]]["platform_fee"] = (float)$row["platform_fee"];
        }
    }

    $releasedStmt = $conn->prepare("
        SELECT
            {$payoutSelect} AS label,
            COALESCE(SUM(net_amount), 0) AS net_released
        FROM payouts
        WHERE status = 'paid'
          AND paid_at BETWEEN ? AND ?
        GROUP BY {$payoutGroup}
    ");

    $releasedStmt->bind_param("ss", $start, $end);
    $releasedStmt->execute();

    $releasedResult = $releasedStmt->get_result();

    while ($row = $releasedResult->fetch_assoc()) {
        if (isset($rows[$row["label"]])) {
            $rows[$row["label"]]["net_released"] = (float)$row["net_released"];
        }
    }

    $summary = [
        "gross_sales" => 0,
        "platform_revenue" => 0,
        "net_released" => 0,
        "orders_count" => 0
    ];

    foreach ($rows as $row) {
        $summary["gross_sales"] += $row["gross"];
        $summary["platform_revenue"] += $row["platform_fee"];
        $summary["net_released"] += $row["net_released"];
    }

    $countStmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM vendor_earnings
        WHERE status IN ('available', 'processing', 'paid')
          AND available_at BETWEEN ? AND ?
    ");

    $countStmt->bind_param("ss", $start, $end);
    $countStmt->execute();

    $count = $countStmt->get_result()->fetch_assoc();
    $summary["orders_count"] = (int)($count["total"] ?? 0);

    response(true, "Admin revenue chart loaded", [
        "range" => $range,
        "summary" => $summary,
        "rows" => array_values($rows)
    ]);
} catch (Throwable $e) {
    response(false, "Server error", [
        "error" => $e->getMessage()
    ]);
}