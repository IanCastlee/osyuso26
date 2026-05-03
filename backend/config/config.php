<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// JWT CONFIG FROM .env
$secret_key = $_ENV['JWT_SECRET'] ?? null;
$jwt_expire = $_ENV['JWT_EXPIRE'] ?? 3600;

// SAFETY CHECK (important for debugging)
if (!$secret_key) {
    die(json_encode([
        "success" => false,
        "message" => "JWT_SECRET not found in .env"
    ]));
}