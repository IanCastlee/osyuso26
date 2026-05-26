<?php
ob_start();

include("../header.php");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set("display_errors", 0);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require_once "../dbConn.php";

function response($success, $message, $data = [], $statusCode = 200) {
    if (ob_get_length()) ob_clean();

    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    $slug = trim($_GET["slug"] ?? "");

    $allowedSlugs = ["terms-and-conditions", "privacy-policy"];

    if (!in_array($slug, $allowedSlugs, true)) {
        response(false, "Invalid legal page", [], 400);
    }

    $stmt = $conn->prepare("
        SELECT
            slug,
            title,
            content,
            version,
            effective_date,
            updated_at
        FROM legal_pages
        WHERE slug = ?
            AND is_published = 1
        LIMIT 1
    ");

    $stmt->bind_param("s", $slug);
    $stmt->execute();

    $page = $stmt->get_result()->fetch_assoc();

    if (!$page) {
        response(false, "Legal page not found", [], 404);
    }

    response(true, "Legal page fetched", $page);
} catch (Throwable $e) {
    error_log("Get public legal page failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}