<?php
// Allow frontend
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Allowed headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Allowed methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Prevent warnings from breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
