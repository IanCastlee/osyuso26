<?php

date_default_timezone_set('Asia/Manila');
include("../header.php");
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");

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

$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode([
        "success" => false,
        "message" => "Email is required"
    ]);
    exit;
}

/**
 * CHECK EMAIL EXISTS
 */
$stmt = $conn->prepare("
    SELECT user_id, fullname
    FROM users
    WHERE email = ?
");

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "message" => "Email does not exist"
    ]);

    exit;
}

$user = $result->fetch_assoc();

/**
 * GENERATE RESET TOKEN
 */
$token = bin2hex(random_bytes(32));

$expires = date(
    "Y-m-d H:i:s",
    strtotime("+30 minutes")
);

/**
 * SAVE TOKEN
 */
$update = $conn->prepare("
    UPDATE users
    SET
        reset_token = ?,
        reset_expires = ?
    WHERE user_id = ?
");

$update->bind_param(
    "ssi",
    $token,
    $expires,
    $user['user_id']
);

$update->execute();

/**
 * RESET LINK
 */
$resetLink =
    "http://localhost:5173/reset-password?token=" . $token;

/**
 * SEND EMAIL
 */
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

    $mail->addAddress($email, $user['fullname']);

    $mail->isHTML(true);

    $mail->Subject = 'Reset your password';

    $mail->Body = "
        <div style='font-family:Arial;padding:20px'>
            <h2>Password Reset</h2>

            <p>
                Click the button below to reset your password.
            </p>

            <a
                href='$resetLink'
                style='
                    display:inline-block;
                    padding:12px 20px;
                    background:#ff6600;
                    color:white;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                '
            >
                Reset Password
            </a>

            <p style='margin-top:20px'>
                This link expires in 30 minutes.
            </p>
        </div>
    ";

    $mail->send();

    echo json_encode([
        "success" => true,
        "message" => "Password reset email sent"
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => "Email send failed",
        "error" => $mail->ErrorInfo
    ]);
}