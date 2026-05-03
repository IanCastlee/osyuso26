<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/../config/config.php';

function generateJWT($user) {
    global $secret_key, $jwt_expire;

    $payload = [
        "iat" => time(),
        "exp" => time() + $jwt_expire,
        "data" => [
            "user_id" => $user['user_id'],
            "email" => $user['email'],
            "role" => $user['role']
        ]
    ];

    return JWT::encode($payload, $secret_key, 'HS256');
}

function verifyJWT($token) {
    global $secret_key;

    try {
        return JWT::decode($token, new Key($secret_key, 'HS256'));
    } catch (Exception $e) {
        return null;
    }
}