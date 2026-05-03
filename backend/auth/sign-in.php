<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

include ("../header.php");
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

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

$user = $stmt->get_result()->fetch_assoc();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid credentials"
    ]);
    exit;
}

$role = $user['role'] ?? 'customer';

$token = generateJWT($user);

echo json_encode([
    "success" => true,
    "token" => $token,
    "role" => $role
]);