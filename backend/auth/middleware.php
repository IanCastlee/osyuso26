<?php

require_once __DIR__ . "/jwt.php";
require_once __DIR__ . "/../dbConn.php";

function jsonError($statusCode, $message) {
    http_response_code($statusCode);
    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);

    exit;
}

function getAuthorizationHeader() {
    $headers = function_exists("getallheaders") ? getallheaders() : [];

    foreach ($headers as $key => $value) {
        if (strtolower($key) === "authorization") {
            return $value;
        }
    }

    if (!empty($_SERVER["HTTP_AUTHORIZATION"])) {
        return $_SERVER["HTTP_AUTHORIZATION"];
    }

    if (!empty($_SERVER["REDIRECT_HTTP_AUTHORIZATION"])) {
        return $_SERVER["REDIRECT_HTTP_AUTHORIZATION"];
    }

    return null;
}

function auth() {
    global $conn;

    $authHeader = getAuthorizationHeader();

    if (!$authHeader) {
        jsonError(401, "No token");
    }

    if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        jsonError(401, "Invalid token format");
    }

    $token = trim($matches[1]);
    $decoded = verifyJWT($token);

    if (!$decoded || empty($decoded->data)) {
        jsonError(401, "Invalid or expired token");
    }

    $tokenUser = $decoded->data;
    $userId = $tokenUser->user_id ?? null;

    if (!$userId) {
        jsonError(401, "Invalid token payload");
    }

    $stmt = $conn->prepare("
        SELECT user_id, email, role, status
        FROM users
        WHERE user_id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $user = $stmt->get_result()->fetch_object();

    if (!$user) {
        jsonError(401, "Account no longer exists");
    }

    $status = $user->status ?? "active";

    if ($status === "banned") {
        jsonError(
            403,
            "Your account has been restricted. Please contact OSYUSO support for assistance."
        );
    }

    if ($status === "inactive") {
        jsonError(
            403,
            "Your account is currently inactive. Please contact OSYUSO support for assistance."
        );
    }

    return $user;
}

function requireRole($roles = []) {
    $user = auth();

    if (!in_array($user->role, $roles, true)) {
        jsonError(403, "Forbidden: insufficient permissions");
    }

    return $user;
}