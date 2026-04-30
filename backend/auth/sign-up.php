<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

include("../header.php");
include("../dbConn.php");

// GET JSON INPUT
$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// VALIDATION
if (!$name || !$email || !$password) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required"
    ]);
    exit;
}

// CHECK IF EMAIL EXISTS
$check = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email already exists"
    ]);
    exit;
}

// HASH PASSWORD
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// INSERT USER
$address = "Address Sample";
$nearby = "Nearby Sample";

$stmt = $conn->prepare("
    INSERT INTO users (fullname, address, nearby, email, password)
    VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param("sssss", $name, $address, $nearby, $email, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Account created successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create account"
    ]);
}