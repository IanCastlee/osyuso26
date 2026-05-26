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
    requireRole(["admin"]);

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $slug = trim($input["slug"] ?? "");
    $title = trim($input["title"] ?? "");
    $content = trim($input["content"] ?? "");
    $version = trim($input["version"] ?? "1.0");
    $effectiveDate = trim($input["effective_date"] ?? "");
    $isPublished = (int)($input["is_published"] ?? 1);

    $allowedSlugs = ["terms-and-conditions", "privacy-policy"];

    if (!in_array($slug, $allowedSlugs, true)) {
        response(false, "Invalid legal page", [], 400);
    }

    if ($title === "") {
        response(false, "Title is required.", [], 400);
    }

    if (strlen($content) < 30) {
        response(false, "Content must be at least 30 characters.", [], 400);
    }

    if ($version === "") {
        response(false, "Version is required.", [], 400);
    }

    if (!$effectiveDate || !preg_match("/^\d{4}-\d{2}-\d{2}$/", $effectiveDate)) {
        response(false, "Valid effective date is required.", [], 400);
    }

    $isPublished = $isPublished === 1 ? 1 : 0;

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        INSERT INTO legal_pages
        (
            slug,
            title,
            content,
            version,
            effective_date,
            is_published
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = ?,
            content = ?,
            version = ?,
            effective_date = ?,
            is_published = ?,
            updated_at = NOW()
    ");

    $stmt->bind_param(
        "sssssissssi",
        $slug,
        $title,
        $content,
        $version,
        $effectiveDate,
        $isPublished,
        $title,
        $content,
        $version,
        $effectiveDate,
        $isPublished
    );

    $stmt->execute();

    $fetch = $conn->prepare("
        SELECT
            id,
            slug,
            title,
            content,
            version,
            effective_date,
            is_published,
            created_at,
            updated_at
        FROM legal_pages
        WHERE slug = ?
        LIMIT 1
    ");

    $fetch->bind_param("s", $slug);
    $fetch->execute();

    $page = $fetch->get_result()->fetch_assoc();

    $conn->commit();

    response(true, "Legal page updated", $page);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Admin update legal page failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}