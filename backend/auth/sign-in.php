<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);

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

if ($email === '' || $password === '') {
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT *
    FROM users
    WHERE email = ?
    LIMIT 1
");

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

if ((int)$user['email_verified'] !== 1) {
    echo json_encode([
        "success" => false,
        "message" => "Please verify your email before signing in."
    ]);
    exit;
}

$status = $user['status'] ?? 'active';

if ($status === 'banned') {
    echo json_encode([
        "success" => false,
        "message" => "Your account has been restricted. Please contact OSYUSO support for assistance."
    ]);
    exit;
}

if ($status === 'inactive') {
    echo json_encode([
        "success" => false,
        "message" => "Your account is currently inactive. Please contact OSYUSO support for assistance."
    ]);
    exit;
}

$role = $user['role'] ?? 'customer';

$token = generateJWT($user);

echo json_encode([
    "success" => true,
    "token" => $token,
    "role" => $role,
    "user" => [
        "user_id" => (int)$user["user_id"],
        "fullname" => $user["fullname"],
        "email" => $user["email"],
        "role" => $role,
        "status" => $status
    ]
]);