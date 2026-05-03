<?php

require_once __DIR__ . '/jwt.php';

function auth() {
    $headers = getallheaders();

    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(["message" => "No token"]);
        exit;
    }

    $token = str_replace("Bearer ", "", $headers['Authorization']);

    $decoded = verifyJWT($token);

    if (!$decoded) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid or expired token"]);
        exit;
    }

    return $decoded->data;
}

/**
 * ROLE-BASED PROTECTION
 */
function requireRole($roles = []) {
    $user = auth();

    if (!in_array($user->role, $roles)) {
        http_response_code(403);
        echo json_encode(["message" => "Forbidden: insufficient permissions"]);
        exit;
    }

    return $user;
}