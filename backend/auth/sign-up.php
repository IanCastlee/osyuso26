<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

include ("../header.php");
include("../dbConn.php");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$address = $data['email'] ?? '';
$nearby = $data['nearby'] ?? '';
$password = $data['password'] ?? '';

if (!$name || !$email || !$password) {
    echo json_encode(["success" => false, "message" => "All fields required"]);
    exit;
}

$check = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();

if ($check->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email exists"]);
    exit;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

$role = "customer";

$stmt = $conn->prepare("
    INSERT INTO users (fullname, address, nearby, email, password, role)
    VALUES (?, ?, ?, ?, ?, ?)
");

$stmt->bind_param("ssssss", $name, $address, $nearby, $email, $hashed, $role);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Account created"]);
} else {
    echo json_encode(["success" => false, "message" => "Insert failed"]);
}