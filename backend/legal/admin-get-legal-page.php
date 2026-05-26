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

function defaultLegalContent($slug) {
    if ($slug === "privacy-policy") {
        return "## Introduction\n\nThis Privacy Policy explains how OSYUSO collects, uses, stores, and protects personal information.\n\n## Information We Collect\n\nWe may collect account, contact, shop, permit, order, payment, notification, and support information.\n\n## Contact\n\nFor privacy concerns, contact OSYUSO through the official contact page.";
    }

    return "## Introduction\n\nWelcome to OSYUSO. These Terms and Conditions govern your access to and use of the OSYUSO marketplace.\n\n## Platform Rules\n\nUsers must provide accurate information and follow marketplace policies.\n\n## Contact\n\nFor questions, contact OSYUSO through the official contact page.";
}

try {
    requireRole(["admin"]);

    $slug = trim($_GET["slug"] ?? "");
    $allowedSlugs = ["terms-and-conditions", "privacy-policy"];

    if (!in_array($slug, $allowedSlugs, true)) {
        response(false, "Invalid legal page", [], 400);
    }

    $stmt = $conn->prepare("
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

    $stmt->bind_param("s", $slug);
    $stmt->execute();

    $page = $stmt->get_result()->fetch_assoc();

    if (!$page) {
        $title = $slug === "privacy-policy" ? "Privacy Policy" : "Terms and Conditions";
        $content = defaultLegalContent($slug);
        $version = "1.0";
        $effectiveDate = date("Y-m-d");
        $isPublished = 1;

        $insert = $conn->prepare("
            INSERT INTO legal_pages
            (slug, title, content, version, effective_date, is_published)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $insert->bind_param(
            "sssssi",
            $slug,
            $title,
            $content,
            $version,
            $effectiveDate,
            $isPublished
        );

        $insert->execute();

        $page = [
            "id" => $insert->insert_id,
            "slug" => $slug,
            "title" => $title,
            "content" => $content,
            "version" => $version,
            "effective_date" => $effectiveDate,
            "is_published" => $isPublished,
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ];
    }

    response(true, "Legal page fetched", $page);
} catch (Throwable $e) {
    error_log("Admin get legal page failed: " . $e->getMessage());

    response(false, "Server error", [
        "error" => $e->getMessage()
    ], 500);
}