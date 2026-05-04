<?php
header("Content-Type: application/json");

include("../header.php");
require "./middleware.php";
require_once "../dbConn.php";

// get user from token
$user = auth();

//  GET FULL USER DATA FROM DB
$stmt = $conn->prepare("
    SELECT user_id, fullname, email, role 
    FROM users 
    WHERE user_id = ?
");

$stmt->bind_param("i", $user->user_id);
$stmt->execute();

$result = $stmt->get_result();
$data = $result->fetch_assoc();

echo json_encode([
    "success" => true,
    "user" => $data
]);