<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// DB CONFIG
$host = $_ENV['DB_HOST'] ?? 'localhost';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';
$database = $_ENV['DB_NAME'] ?? 'osyosyso';

$conn = mysqli_connect($host, $username, $password, $database);

if (!$conn) {
    die(json_encode([
        "success" => false,
        "message" => "DB CONNECTION FAILED",
        "error" => mysqli_connect_error()
    ]));
}