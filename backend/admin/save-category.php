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
    $name = trim($input["name"] ?? "");

    if ($name === "") {
        response(false, "Category name is required", null, 400);
    }

    if ($id > 0) {
        $check = $conn->prepare("
            SELECT id
            FROM categories
            WHERE LOWER(name) = LOWER(?)
                AND id <> ?
            LIMIT 1
        ");

        $check->bind_param("si", $name, $id);
    } else {
        $check = $conn->prepare("
            SELECT id
            FROM categories
            WHERE LOWER(name) = LOWER(?)
            LIMIT 1
        ");

        $check->bind_param("s", $name);
    }

    $check->execute();

    if ($check->get_result()->fetch_assoc()) {
        response(false, "Category already exists", null, 400);
    }

    if ($id > 0) {
        $stmt = $conn->prepare("
            UPDATE categories
            SET name = ?
            WHERE id = ?
        ");

        $stmt->bind_param("si", $name, $id);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("
            INSERT INTO categories (name, created_at)
            VALUES (?, NOW())
        ");

        $stmt->bind_param("s", $name);
        $stmt->execute();

        $id = $conn->insert_id;
    }

    clearPublicCache();

    response(true, "Category saved successfully", [
        "id" => (int)$id,
        "name" => $name
    ]);
} catch (Throwable $e) {
    error_log("Save category failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}