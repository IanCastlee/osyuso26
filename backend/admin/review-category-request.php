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
    $admin = requireRole(["admin"]);
    $adminId = (int)($admin->user_id ?? 0);

    if ($adminId <= 0) {
        response(false, "Unauthorized user", null, 401);
    }

    $input = inputData();

    $requestId = (int)($input["id"] ?? 0);
    $action = $input["action"] ?? "";
    $adminNote = trim($input["admin_note"] ?? "");

    if ($requestId <= 0) {
        response(false, "Request ID is required", null, 400);
    }

    if (!in_array($action, ["approved", "rejected"], true)) {
        response(false, "Invalid action", null, 400);
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT
            cr.*,
            u.fullname AS vendor_name,
            u.email AS vendor_email
        FROM category_requests cr
        INNER JOIN users u
            ON u.user_id = cr.vendor_id
        WHERE cr.id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->bind_param("i", $requestId);
    $stmt->execute();

    $request = $stmt->get_result()->fetch_assoc();

    if (!$request) {
        throw new Exception("Request not found");
    }

    if ($request["status"] !== "pending") {
        throw new Exception("This request has already been reviewed");
    }

    $categoryId = null;
    $subcategoryId = null;

    if ($action === "approved") {
        $categoryName = trim($request["category_name"]);
        $subcategoryName = trim($request["subcategory_name"]);

        if (!empty($request["category_id"])) {
            $existingCategory = $conn->prepare("
                SELECT id, name
                FROM categories
                WHERE id = ?
                LIMIT 1
            ");

            $requestCategoryId = (int)$request["category_id"];
            $existingCategory->bind_param("i", $requestCategoryId);
            $existingCategory->execute();

            $category = $existingCategory->get_result()->fetch_assoc();

            if ($category) {
                $categoryId = (int)$category["id"];
                $categoryName = $category["name"];
            }
        }

        if (!$categoryId) {
            $findCategory = $conn->prepare("
                SELECT id
                FROM categories
                WHERE LOWER(name) = LOWER(?)
                LIMIT 1
            ");

            $findCategory->bind_param("s", $categoryName);
            $findCategory->execute();

            $category = $findCategory->get_result()->fetch_assoc();

            if ($category) {
                $categoryId = (int)$category["id"];
            } else {
                $insertCategory = $conn->prepare("
                    INSERT INTO categories (name, created_at)
                    VALUES (?, NOW())
                ");

                $insertCategory->bind_param("s", $categoryName);
                $insertCategory->execute();

                $categoryId = $insertCategory->insert_id;
            }
        }

        $findSubcategory = $conn->prepare("
            SELECT id
            FROM subcategories
            WHERE category_id = ?
                AND LOWER(name) = LOWER(?)
            LIMIT 1
        ");

        $findSubcategory->bind_param("is", $categoryId, $subcategoryName);
        $findSubcategory->execute();

        $subcategory = $findSubcategory->get_result()->fetch_assoc();

        if ($subcategory) {
            $subcategoryId = (int)$subcategory["id"];
        } else {
            $insertSubcategory = $conn->prepare("
                INSERT INTO subcategories (category_id, name, created_at)
                VALUES (?, ?, NOW())
            ");

            $insertSubcategory->bind_param("is", $categoryId, $subcategoryName);
            $insertSubcategory->execute();

            $subcategoryId = $insertSubcategory->insert_id;
        }
    }

    $update = $conn->prepare("
        UPDATE category_requests
        SET
            status = ?,
            admin_note = ?,
            reviewed_by = ?,
            reviewed_at = NOW()
        WHERE id = ?
    ");

    $update->bind_param("ssii", $action, $adminNote, $adminId, $requestId);
    $update->execute();

    $vendorId = (int)$request["vendor_id"];
    $vendorName = $request["vendor_name"] ?: "Vendor";
    $vendorEmail = $request["vendor_email"];

    if ($action === "approved") {
        $title = "Category request approved";
        $message = "Your request for " . $request["category_name"] . " > " . $request["subcategory_name"] . " was approved.";
    } else {
        $title = "Category request rejected";
        $message = "Your request for " . $request["category_name"] . " > " . $request["subcategory_name"] . " was rejected.";
    }

    if ($adminNote !== "") {
        $message .= " Admin note: " . $adminNote;
    }

    createNotification(
        $conn,
        $vendorId,
        $adminId,
        $title,
        $message,
        $requestId,
        "category_request_vendor_" . $vendorId . "_" . $requestId . "_" . $action
    );

    queueEmail(
        $conn,
        $vendorEmail,
        $vendorName,
        $title,
        "<p>{$message}</p>",
        $message,
        $requestId,
        "email_category_request_vendor_" . $vendorId . "_" . $requestId . "_" . $action
    );

    clearPublicCache();

    $conn->commit();

    response(true, "Request reviewed successfully", [
        "request_id" => $requestId,
        "status" => $action,
        "category_id" => $categoryId,
        "subcategory_id" => $subcategoryId
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        try {
            $conn->rollback();
        } catch (Throwable $rollbackError) {
            error_log($rollbackError->getMessage());
        }
    }

    error_log("Review category request failed: " . $e->getMessage());
    response(false, $e->getMessage(), null, 500);
}