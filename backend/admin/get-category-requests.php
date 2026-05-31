<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

require_once "../dbConn.php";
require_once "../auth/middleware.php";

function response($success, $message, $data = null, $status = 200) {
    if (ob_get_length()) ob_clean();

    http_response_code($status);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    requireRole(["admin"]);

    $status = $_GET["status"] ?? "pending";

    $where = "";
    $params = [];
    $types = "";

    if (in_array($status, ["pending", "approved", "rejected"], true)) {
        $where = "WHERE cr.status = ?";
        $params[] = $status;
        $types .= "s";
    }

    $sql = "
        SELECT
            cr.id,
            cr.vendor_id,
            cr.category_id,
            cr.category_name,
            cr.subcategory_name,
            cr.reason,
            cr.status,
            cr.admin_note,
            cr.reviewed_by,
            cr.reviewed_at,
            cr.created_at,

            u.fullname AS vendor_name,
            u.email AS vendor_email,

            admin.fullname AS reviewed_by_name
        FROM category_requests cr
        INNER JOIN users u
            ON u.user_id = cr.vendor_id
        LEFT JOIN users admin
            ON admin.user_id = cr.reviewed_by
        $where
        ORDER BY cr.created_at DESC, cr.id DESC
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        response(false, "Prepare failed: " . $conn->error, null, 500);
    }

    if ($types !== "") {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();

    $result = $stmt->get_result();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $row["id"] = (int)$row["id"];
        $row["vendor_id"] = (int)$row["vendor_id"];
        $row["category_id"] = $row["category_id"] ? (int)$row["category_id"] : null;
        $rows[] = $row;
    }

    response(true, "Category requests fetched successfully", [
        "requests" => $rows
    ]);
} catch (Throwable $e) {
    error_log("Get category requests failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}