<?php

date_default_timezone_set('Asia/Manila');

include("../header.php");

header("Content-Type: application/json");

include("../dbConn.php");

$data = json_decode(file_get_contents("php://input"), true);

$token = trim($data['token'] ?? '');
$password = trim($data['password'] ?? '');

if (!$token || !$password) {

    echo json_encode([
        "success" => false,
        "message" => "Missing fields"
    ]);

    exit;
}

$current = date("Y-m-d H:i:s");

// ================= CHECK TOKEN =================
$stmt = $conn->prepare("
    SELECT user_id
    FROM users
    WHERE reset_token = ?
    AND reset_expires > ?
");

$stmt->bind_param("ss", $token, $current);

$stmt->execute();

$user = $stmt->get_result()->fetch_assoc();

if (!$user) {

    echo json_encode([
        "success" => false,
        "message" => "Invalid or expired token"
    ]);

    exit;
}

// ================= HASH =================
$hashed = password_hash(
    $password,
    PASSWORD_DEFAULT
);

// ================= UPDATE =================
$update = $conn->prepare("
    UPDATE users
    SET
        password = ?,
        reset_token = NULL,
        reset_expires = NULL
    WHERE user_id = ?
");

$update->bind_param(
    "si",
    $hashed,
    $user['user_id']
);

$update->execute();

echo json_encode([
    "success" => true,
    "message" => "Password updated"
]);