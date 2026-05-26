<?php

error_reporting(E_ALL);
ini_set("display_errors", 0);

header("Content-Type: application/json");

include("../header.php");
include("../dbConn.php");

require_once __DIR__ . "/jwt.php";

function response($success, $message, $extra = []) {
    echo json_encode(array_merge([
        "success" => $success,
        "message" => $message
    ], $extra));

    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    response(false, "Invalid JSON input");
}

$email = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");

if ($email === "" || $password === "") {
    response(false, "Email and password are required");
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

if (!$user) {
    response(false, "This email is not registered.");
}

if (!password_verify($password, $user["password"])) {
    response(false, "Incorrect password.");
}

if ((int)$user["email_verified"] !== 1) {
    response(false, "Please verify your email before signing in.");
}

$status = $user["status"] ?? "active";

if ($status === "banned") {
    response(false, "Your account has been restricted. Please contact OSYUSO support for assistance.");
}

if ($status === "inactive") {
    response(false, "Your account is currently inactive. Please contact OSYUSO support for assistance.");
}

$role = $user["role"] ?? "customer";

$token = generateJWT($user);

response(true, "Login successful", [
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