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

function inputData() {
    $json = json_decode(file_get_contents("php://input"), true);
    return is_array($json) ? $json : $_POST;
}

function clearPublicCache() {
    foreach (glob(__DIR__ . "/../cache/*.json") as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

try {
    requireRole(["admin"]);

    $input = inputData();

    $id = isset($input["id"]) && $input["id"] !== "" ? (int)$input["id"] : 0;
    $category_id = (int)($input["category_id"] ?? 0);
    $name = trim($input["name"] ?? "");

    if ($category_id <= 0) {
        response(false, "Category is required", null, 400);
    }

    if ($name === "") {
        response(false, "Subcategory name is required", null, 400);
    }

    $categoryStmt = $conn->prepare("
        SELECT id
        FROM categories
        WHERE id = ?
        LIMIT 1
    ");

    $categoryStmt->bind_param("i", $category_id);
    $categoryStmt->execute();

    if (!$categoryStmt->get_result()->fetch_assoc()) {
        response(false, "Category not found", null, 404);
    }

    if ($id > 0) {
        $check = $conn->prepare("
            SELECT id
            FROM subcategories
            WHERE category_id = ?
                AND LOWER(name) = LOWER(?)
                AND id <> ?
            LIMIT 1
        ");

        $check->bind_param("isi", $category_id, $name, $id);
    } else {
        $check = $conn->prepare("
            SELECT id
            FROM subcategories
            WHERE category_id = ?
                AND LOWER(name) = LOWER(?)
            LIMIT 1
        ");

        $check->bind_param("is", $category_id, $name);
    }

    $check->execute();

    if ($check->get_result()->fetch_assoc()) {
        response(false, "Subcategory already exists in this category", null, 400);
    }

    if ($id > 0) {
        $stmt = $conn->prepare("
            UPDATE subcategories
            SET category_id = ?, name = ?
            WHERE id = ?
        ");

        $stmt->bind_param("isi", $category_id, $name, $id);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("
            INSERT INTO subcategories (category_id, name, created_at)
            VALUES (?, ?, NOW())
        ");

        $stmt->bind_param("is", $category_id, $name);
        $stmt->execute();

        $id = $conn->insert_id;
    }

    clearPublicCache();

    response(true, "Subcategory saved successfully", [
        "id" => (int)$id,
        "category_id" => $category_id,
        "name" => $name
    ]);
} catch (Throwable $e) {
    error_log("Save subcategory failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}