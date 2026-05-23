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

function getUserValue($user, $key) {
    if (is_object($user)) return $user->{$key} ?? null;
    if (is_array($user)) return $user[$key] ?? null;
    return null;
}

try {
    $user = requireRole(["vendor"]);
    $vendor_id = (int)getUserValue($user, "user_id");

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
            $rows[$label] = ["label" => $label, "gross" => 0, "fee" => 0, "net" => 0];
        }

        $stmt = $conn->prepare("
            SELECT
                DATE_FORMAT(available_at, '%a') AS label,
                SUM(gross_amount) AS gross,
                SUM(commission_amount) AS fee,
                SUM(net_amount) AS net
            FROM vendor_earnings
            WHERE vendor_id = ?
              AND status IN ('available', 'processing', 'paid')
              AND available_at BETWEEN ? AND ?
            GROUP BY DATE(available_at), DATE_FORMAT(available_at, '%a')
        ");

        $stmt->bind_param("iss", $vendor_id, $start, $end);
    } elseif ($range === "weekly") {
        $start = date("Y-m-01 00:00:00");
        $end = date("Y-m-t 23:59:59");

        for ($i = 1; $i <= 5; $i++) {
            $label = "Week " . $i;
            $rows[$label] = ["label" => $label, "gross" => 0, "fee" => 0, "net" => 0];
        }

        $stmt = $conn->prepare("
            SELECT
                CONCAT('Week ', FLOOR((DAYOFMONTH(available_at) - 1) / 7) + 1) AS label,
                SUM(gross_amount) AS gross,
                SUM(commission_amount) AS fee,
                SUM(net_amount) AS net
            FROM vendor_earnings
            WHERE vendor_id = ?
              AND status IN ('available', 'processing', 'paid')
              AND available_at BETWEEN ? AND ?
            GROUP BY label
        ");

        $stmt->bind_param("iss", $vendor_id, $start, $end);
    } elseif ($range === "monthly") {
        $start = date("Y-01-01 00:00:00");
        $end = date("Y-12-31 23:59:59");

        $labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        foreach ($labels as $label) {
            $rows[$label] = ["label" => $label, "gross" => 0, "fee" => 0, "net" => 0];
        }

        $stmt = $conn->prepare("
            SELECT
                DATE_FORMAT(available_at, '%b') AS label,
                SUM(gross_amount) AS gross,
                SUM(commission_amount) AS fee,
                SUM(net_amount) AS net
            FROM vendor_earnings
            WHERE vendor_id = ?
              AND status IN ('available', 'processing', 'paid')
              AND available_at BETWEEN ? AND ?
            GROUP BY MONTH(available_at), DATE_FORMAT(available_at, '%b')
        ");

        $stmt->bind_param("iss", $vendor_id, $start, $end);
    } else {
        $start = date("Y-01-01 00:00:00", strtotime("-4 years"));
        $end = date("Y-12-31 23:59:59");

        for ($year = (int)date("Y") - 4; $year <= (int)date("Y"); $year++) {
            $label = (string)$year;
            $rows[$label] = ["label" => $label, "gross" => 0, "fee" => 0, "net" => 0];
        }

        $stmt = $conn->prepare("
            SELECT
                DATE_FORMAT(available_at, '%Y') AS label,
                SUM(gross_amount) AS gross,
                SUM(commission_amount) AS fee,
                SUM(net_amount) AS net
            FROM vendor_earnings
            WHERE vendor_id = ?
              AND status IN ('available', 'processing', 'paid')
              AND available_at BETWEEN ? AND ?
            GROUP BY YEAR(available_at)
        ");

        $stmt->bind_param("iss", $vendor_id, $start, $end);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        if (isset($rows[$row["label"]])) {
            $rows[$row["label"]] = [
                "label" => $row["label"],
                "gross" => (float)$row["gross"],
                "fee" => (float)$row["fee"],
                "net" => (float)$row["net"]
            ];
        }
    }

    $summary = [
        "gross_sales" => 0,
        "platform_fee" => 0,
        "net_income" => 0,
        "orders_count" => 0
    ];

    foreach ($rows as $row) {
        $summary["gross_sales"] += $row["gross"];
        $summary["platform_fee"] += $row["fee"];
        $summary["net_income"] += $row["net"];
    }

    $countStmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM vendor_earnings
        WHERE vendor_id = ?
          AND status IN ('available', 'processing', 'paid')
          AND available_at BETWEEN ? AND ?
    ");

    $countStmt->bind_param("iss", $vendor_id, $start, $end);
    $countStmt->execute();

    $count = $countStmt->get_result()->fetch_assoc();
    $summary["orders_count"] = (int)($count["total"] ?? 0);

    response(true, "Vendor sales chart loaded", [
        "range" => $range,
        "summary" => $summary,
        "rows" => array_values($rows)
    ]);
} catch (Throwable $e) {
    response(false, "Server error", [
        "error" => $e->getMessage()
    ]);
}