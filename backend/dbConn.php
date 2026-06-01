<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

date_default_timezone_set("Asia/Manila");

// DB CONFIG
$host = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';
$database = $_ENV['DB_NAME'] ?? 'osyuso';

$conn = mysqli_connect($host, $username, $password, $database);

if (!$conn) {
    die(json_encode([
        "success" => false,
        "message" => "DB CONNECTION FAILED",
        "error" => mysqli_connect_error()
    ]));
}

mysqli_set_charset($conn, "utf8mb4");

// Make MySQL NOW() use Philippines time for this connection.
mysqli_query($conn, "SET time_zone = '+08:00'");