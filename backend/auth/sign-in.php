<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");

include("../header.php");
include("../dbConn.php");

require_once __DIR__ . "/jwt.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON input"
    ]);
    exit;
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

$stmt = $conn->prepare("
    SELECT * 
    FROM users 
    WHERE email = ?
");

$stmt->bind_param("s", $email);

$stmt->execute();

$user = $stmt->get_result()->fetch_assoc();

// ================= INVALID =================
if (!$user || !password_verify($password, $user['password'])) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid credentials"
    ]);

    exit;
}

// ================= EMAIL NOT VERIFIED =================
if ((int)$user['email_verified'] !== 1) {

    echo json_encode([
        "success" => false,
        "message" => "Please verify your email before signing in."
    ]);

    exit;
}

// ================= ROLE =================
$role = $user['role'] ?? 'customer';

// ================= JWT =================
$token = generateJWT($user);

echo json_encode([
    "success" => true,
    "token" => $token,
    "role" => $role
]);