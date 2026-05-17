<?php

date_default_timezone_set('Asia/Manila');
include("../header.php");


error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");

require '../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

include("../dbConn.php");

require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid input"
    ]);
    exit;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$address = trim($data['address'] ?? '');
$nearby = trim($data['nearby'] ?? '');
$password = trim($data['password'] ?? '');

if (!$name || !$email || !$password) {
    echo json_encode([
        "success" => false,
        "message" => "All fields required"
    ]);
    exit;
}

// ================= CHECK EMAIL =================
$check = $conn->prepare("
    SELECT user_id 
    FROM users 
    WHERE email = ?
");

$check->bind_param("s", $email);
$check->execute();

if ($check->get_result()->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email already exists"
    ]);
    exit;
}

// ================= HASH PASSWORD =================
$hashed = password_hash($password, PASSWORD_DEFAULT);

// ================= VERIFICATION TOKEN =================
$token = bin2hex(random_bytes(32));

$expires = date(
    "Y-m-d H:i:s",
    strtotime("+30 minutes")
);

$role = "customer";

// ================= INSERT USER =================
$stmt = $conn->prepare("
    INSERT INTO users (
        fullname,
        address,
        nearby,
        email,
        password,
        role,
        verification_token,
        verification_expires
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "ssssssss",
    $name,
    $address,
    $nearby,
    $email,
    $hashed,
    $role,
    $token,
    $expires
);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Insert failed"
    ]);
    exit;
}

// ================= VERIFICATION LINK =================
$verifyLink =
    "http://localhost/OSYUSO26/backend/auth/verify-email.php?token=" . $token;

// ================= SEND EMAIL =================
$mail = new PHPMailer(true);

try {

$mail->isSMTP();

$mail->Host = $_ENV['MAIL_HOST'];

$mail->SMTPAuth = true;


$mail->Username = $_ENV['MAIL_USERNAME'];

$mail->Password = $_ENV['MAIL_PASSWORD'];

$mail->Port = $_ENV['MAIL_PORT'];

$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;


$mail->setFrom(
    $_ENV['MAIL_FROM'],
    'OSYUSO'
);


    $mail->addAddress($email, $name);

    $mail->isHTML(true);

    $mail->Subject = 'Verify your email';

    $mail->Body = "
        <h2>Email Verification</h2>

        <p>Click the button below to verify your account.</p>

        <a href='$verifyLink'
           style='
             display:inline-block;
             padding:12px 20px;
             background:#ff6600;
             color:white;
             text-decoration:none;
             border-radius:6px;
           '>
           Verify Email
        </a>

        <p>This link expires in 30 minutes.</p>
    ";

    $mail->send();

    echo json_encode([
        "success" => true,
        "message" => "Account created. Verification email sent."
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => "Email send failed",
        "error" => $mail->ErrorInfo
    ]);
}