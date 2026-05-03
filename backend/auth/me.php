<?php
header("Content-Type: application/json");

include ("../header.php");

require "./middleware.php";

// auth check
$user = auth();

echo json_encode([
    "success" => true,
    "user" => $user
]);