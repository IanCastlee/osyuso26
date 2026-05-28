<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

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

function getUserId($user) {
    if (is_object($user)) {
        return (int)($user->user_id ?? 0);
    }

    if (is_array($user)) {
        return (int)($user["user_id"] ?? 0);
    }

    return 0;
}

function getCount($conn, $sql) {
    $result = $conn->query($sql);

    if (!$result) {
        return 0;
    }

    $row = $result->fetch_assoc();

    return (int)($row["count_value"] ?? 0);
}

try {
    $authUser = requireRole(["admin"]);
    $admin_id = getUserId($authUser);

    if (!$admin_id) {
        response(false, "Unauthorized user", null, 401);
    }

    $stmt = $conn->prepare("
        SELECT
            user_id,
            profile_picture,
            fullname,
            address,
            nearby,
            email,
            role,
            status,
            email_verified,
            created_at,
            updated_at
        FROM users
        WHERE user_id = ?
            AND role = 'admin'
        LIMIT 1
    ");

    $stmt->bind_param("i", $admin_id);
    $stmt->execute();

    $admin = $stmt->get_result()->fetch_assoc();

    if (!$admin) {
        response(false, "Admin account not found", null, 404);
    }

    $stats = [
        "customers_count" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM users
            WHERE role = 'customer'
        "),

        "active_vendors" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM users
            WHERE role = 'vendor'
                AND status = 'active'
        "),

        "pending_sellers" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM shops
            WHERE status = 'pending'
        "),

        "pending_promotions" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM featured_promotions
            WHERE status = 'pending'
                AND payment_status = 'paid'
        "),

        "paid_orders" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM orders
            WHERE payment_status = 'paid'
        "),

        "claimed_orders" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM orders
            WHERE claim_status = 'claimed'
        "),

        "products_count" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM products
        "),

        "shops_count" => getCount($conn, "
            SELECT COUNT(*) AS count_value
            FROM shops
        ")
    ];

    response(true, "Admin account fetched successfully", [
        "user" => $admin,
        "stats" => $stats
    ]);
} catch (Throwable $e) {
    error_log("Get admin account failed: " . $e->getMessage());

    response(false, $e->getMessage(), null, 500);
}