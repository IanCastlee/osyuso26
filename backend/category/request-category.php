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

function queueEmail($conn, $toEmail, $toName, $subject, $bodyHtml, $bodyText, $relatedId, $dedupeKey) {
    if (!$toEmail) return;

    $stmt = $conn->prepare("
        INSERT INTO email_queue (
            to_email,
            to_name,
            subject,
            body_html,
            body_text,
            related_type,
            related_id,
            dedupe_key,
            status,
            attempts,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, 'category_request', ?, ?, 'pending', 0, NOW())
    ");

    $stmt->bind_param(
        "sssssis",
        $toEmail,
        $toName,
        $subject,
        $bodyHtml,
        $bodyText,
        $relatedId,
        $dedupeKey
    );

    $stmt->execute();
}

function createNotification($conn, $userId, $actorUserId, $title, $message, $relatedId, $dedupeKey) {
    $type = "category_request";

    $stmt = $conn->prepare("
        INSERT INTO notifications (
            user_id,
            actor_user_id,
            type,
            title,
            message,
            related_type,
            related_id,
            dedupe_key,
            is_read,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, 'category_request', ?, ?, 0, NOW())
    ");

    $stmt->bind_param(
        "iisssis",
        $userId,
        $actorUserId,
        $type,
        $title,
        $message,
        $relatedId,
        $dedupeKey
    );

    $stmt->execute();
}

try {
    $user = requireRole(["vendor"]);

    $vendorId = (int)($user->user_id ?? 0);

    if ($vendorId <= 0) {
        response(false, "Unauthorized user", null, 401);
    }

    $input = inputData();

    $categoryId = isset($input["category_id"]) && $input["category_id"] !== ""
        ? (int)$input["category_id"]
        : null;

    $categoryName = trim($input["category_name"] ?? "");
    $subcategoryName = trim($input["subcategory_name"] ?? "");
    $reason = trim($input["reason"] ?? "");

    if ($subcategoryName === "") {
        response(false, "Subcategory name is required", null, 400);
    }

    if ($categoryId) {
        $stmt = $conn->prepare("
            SELECT id, name
            FROM categories
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->bind_param("i", $categoryId);
        $stmt->execute();

        $category = $stmt->get_result()->fetch_assoc();

        if (!$category) {
            response(false, "Selected category not found", null, 404);
        }

        $categoryName = $category["name"];
    } else {
        if ($categoryName === "") {
            response(false, "Category name is required", null, 400);
        }

        $stmt = $conn->prepare("
            SELECT id, name
            FROM categories
            WHERE LOWER(name) = LOWER(?)
            LIMIT 1
        ");

        $stmt->bind_param("s", $categoryName);
        $stmt->execute();

        $existingCategory = $stmt->get_result()->fetch_assoc();

        if ($existingCategory) {
            $categoryId = (int)$existingCategory["id"];
            $categoryName = $existingCategory["name"];
        }
    }

    if ($categoryId) {
        $stmt = $conn->prepare("
            SELECT id
            FROM subcategories
            WHERE category_id = ?
                AND LOWER(name) = LOWER(?)
            LIMIT 1
        ");

        $stmt->bind_param("is", $categoryId, $subcategoryName);
        $stmt->execute();

        if ($stmt->get_result()->fetch_assoc()) {
            response(false, "This subcategory already exists", null, 400);
        }
    }

    $stmt = $conn->prepare("
        SELECT id
        FROM category_requests
        WHERE vendor_id = ?
            AND LOWER(category_name) = LOWER(?)
            AND LOWER(subcategory_name) = LOWER(?)
            AND status = 'pending'
        LIMIT 1
    ");

    $stmt->bind_param("iss", $vendorId, $categoryName, $subcategoryName);
    $stmt->execute();

    if ($stmt->get_result()->fetch_assoc()) {
        response(false, "You already have a pending request for this category", null, 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        INSERT INTO category_requests (
            vendor_id,
            category_id,
            category_name,
            subcategory_name,
            reason,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    ");

    $stmt->bind_param(
        "iisss",
        $vendorId,
        $categoryId,
        $categoryName,
        $subcategoryName,
        $reason
    );

    $stmt->execute();

    $requestId = $stmt->insert_id;

    $vendorStmt = $conn->prepare("
        SELECT fullname, email
        FROM users
        WHERE user_id = ?
        LIMIT 1
    ");

    $vendorStmt->bind_param("i", $vendorId);
    $vendorStmt->execute();

    $vendor = $vendorStmt->get_result()->fetch_assoc();
    $vendorName = $vendor["fullname"] ?? "Vendor";

    $adminStmt = $conn->prepare("
        SELECT user_id, fullname, email
        FROM users
        WHERE role = 'admin'
            AND status = 'active'
    ");

    $adminStmt->execute();
    $admins = $adminStmt->get_result();

    $title = "New category request";
    $message = $vendorName . " requested " . $categoryName . " > " . $subcategoryName;

    while ($admin = $admins->fetch_assoc()) {
        $adminId = (int)$admin["user_id"];

        createNotification(
            $conn,
            $adminId,
            $vendorId,
            $title,
            $message,
            $requestId,
            "category_request_admin_" . $adminId . "_" . $requestId
        );

        queueEmail(
            $conn,
            $admin["email"],
            $admin["fullname"] ?: "Admin",
            "New category request",
            "<p>{$message}</p><p>Please review it in the admin dashboard.</p>",
            $message . "\nPlease review it in the admin dashboard.",
            $requestId,
            "email_category_request_admin_" . $adminId . "_" . $requestId
        );
    }

    $conn->commit();

    response(true, "Category request sent successfully", [
        "request_id" => (int)$requestId
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Category request failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}