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

function response($success, $message, $data = [], $statusCode = 200) {
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

function makeReferenceNo($vendorId) {
    return "PO-" . date("Ymd") . "-V" . $vendorId . "-" . strtoupper(bin2hex(random_bytes(4)));
}

try {
    $user = requireRole(["vendor", "admin"]);

    $role = getUserValue($user, "role");
    $vendor_id = (int)getUserValue($user, "user_id");

    if ($role === "admin" && isset($_POST["vendor_id"])) {
        $vendor_id = (int)$_POST["vendor_id"];
    }

    if ($vendor_id <= 0) {
        response(false, "Invalid vendor", [], 400);
    }

    $today = new DateTimeImmutable("today", new DateTimeZone("Asia/Manila"));

    // if ($today->format("w") !== "0") {
    //     response(false, "Payout is only available every Sunday.", [], 400);
    // }
if (!in_array($today->format("w"), ["0", "5"], true)) {
    response(false, "Payout is only available every Sunday.", [], 400);
}

    $conn->begin_transaction();

    $pendingStmt = $conn->prepare("
        SELECT id
        FROM payouts
        WHERE vendor_id = ?
          AND status IN ('pending', 'processing')
        LIMIT 1
        FOR UPDATE
    ");

    $pendingStmt->bind_param("i", $vendor_id);
    $pendingStmt->execute();

    if ($pendingStmt->get_result()->num_rows > 0) {
        $conn->rollback();
        response(false, "You already have a pending or processing payout.", [], 400);
    }

    $earningStmt = $conn->prepare("
        SELECT
            id,
            gross_amount,
            commission_amount,
            net_amount,
            created_at,
            available_at
        FROM vendor_earnings
        WHERE vendor_id = ?
          AND status = 'available'
          AND payout_id IS NULL
          AND available_at <= NOW()
        ORDER BY id ASC
        FOR UPDATE
    ");

    $earningStmt->bind_param("i", $vendor_id);
    $earningStmt->execute();

    $result = $earningStmt->get_result();

    $earningIds = [];
    $grossAmount = 0;
    $commissionAmount = 0;
    $netAmount = 0;
    $periodStart = null;
    $periodEnd = date("Y-m-d H:i:s");

    while ($row = $result->fetch_assoc()) {
        $earningIds[] = (int)$row["id"];

        $grossAmount += (float)$row["gross_amount"];
        $commissionAmount += (float)$row["commission_amount"];
        $netAmount += (float)$row["net_amount"];

        $rowDate = $row["available_at"] ?: $row["created_at"];

        if (!$periodStart || $rowDate < $periodStart) {
            $periodStart = $rowDate;
        }
    }

    $itemsCount = count($earningIds);

    if ($itemsCount <= 0 || $netAmount <= 0) {
        $conn->rollback();
        response(false, "No available earnings for payout.", [], 400);
    }

    $grossAmount = round($grossAmount, 2);
    $commissionAmount = round($commissionAmount, 2);
    $netAmount = round($netAmount, 2);

    $commissionRate = $grossAmount > 0
        ? round(($commissionAmount / $grossAmount) * 100, 2)
        : 0.00;

    $referenceNo = makeReferenceNo($vendor_id);

    if (!$periodStart) {
        $periodStart = date("Y-m-d H:i:s");
    }

    $insertStmt = $conn->prepare("
        INSERT INTO payouts (
            vendor_id,
            gross_amount,
            commission_rate,
            commission_amount,
            net_amount,
            items_count,
            period_start,
            period_end,
            status,
            reference_no,
            requested_at
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'pending',
            ?,
            NOW()
        )
    ");

    $insertStmt->bind_param(
        "iddddisss",
        $vendor_id,
        $grossAmount,
        $commissionRate,
        $commissionAmount,
        $netAmount,
        $itemsCount,
        $periodStart,
        $periodEnd,
        $referenceNo
    );

    $insertStmt->execute();

    $payoutId = (int)$conn->insert_id;

    $placeholders = implode(",", array_fill(0, count($earningIds), "?"));

    $updateSql = "
        UPDATE vendor_earnings
        SET
            status = 'processing',
            payout_id = ?,
            updated_at = NOW()
        WHERE id IN ($placeholders)
          AND vendor_id = ?
          AND status = 'available'
          AND payout_id IS NULL
    ";

    $updateStmt = $conn->prepare($updateSql);

    $types = "i" . str_repeat("i", count($earningIds)) . "i";
    $params = array_merge([$payoutId], $earningIds, [$vendor_id]);

    bindParams($updateStmt, $types, $params);
    $updateStmt->execute();

    if ($updateStmt->affected_rows !== $itemsCount) {
        $conn->rollback();
        response(false, "Payout creation failed. Please try again.", [], 400);
    }

    $conn->commit();

    response(true, "Payout request created", [
        "payout_id" => $payoutId,
        "reference_no" => $referenceNo,
        "gross_amount" => $grossAmount,
        "commission_rate" => $commissionRate,
        "commission_amount" => $commissionAmount,
        "net_amount" => $netAmount,
        "items_count" => $itemsCount,
        "status" => "pending"
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}