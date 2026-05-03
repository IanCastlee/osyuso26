<?php

require_once __DIR__ . '/../vendor/autoload.php';

// LOAD .env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// CLOUDINARY CONFIG FROM ENV
define("CLOUDINARY_CLOUD_NAME", $_ENV['CLOUDINARY_CLOUD_NAME']);
define("CLOUDINARY_API_KEY", $_ENV['CLOUDINARY_API_KEY']);
define("CLOUDINARY_API_SECRET", $_ENV['CLOUDINARY_API_SECRET']);