<?php

date_default_timezone_set('Asia/Manila');
include("../header.php");

ob_start();
header("Content-Type: application/json");

require '../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();


error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once "../dbConn.php";
require_once "../config/cloudinary.php";

require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {

    /**
     * ================= GET DATA =================
     */
    $fname = trim($_POST['fname'] ?? '');
    $lname = trim($_POST['lname'] ?? '');
    $shopName = trim($_POST['shopName'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $nearby = trim($_POST['nearby'] ?? '');
    $permit_number = trim($_POST['permit_number'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    /**
     * ================= VALIDATION =================
     */
    if (!$email || !$password || !$shopName) {

        throw new Exception("Missing required fields");
    }

    /**
     * ================= CHECK EMAIL =================
     */
    $stmt = $conn->prepare("
        SELECT user_id 
        FROM users 
        WHERE email = ?
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param("s", $email);

    $stmt->execute();

    $res = $stmt->get_result();

    if ($res->num_rows > 0) {

        throw new Exception("Email already exists");
    }

    /**
     * ================= SECURITY =================
     */
    $hashedPassword = password_hash(
        $password,
        PASSWORD_BCRYPT
    );

    $fullname = $fname . " " . $lname;

    $token = bin2hex(random_bytes(32));

    $expires = date(
        "Y-m-d H:i:s",
        strtotime("+30 minutes")
    );

    /**
     * ================= INSERT USER =================
     */
    $stmt = $conn->prepare("
        INSERT INTO users (
            fullname,
            address,
            nearby,
            email,
            password,
            role,
            status,
            email_verified,
            verification_token,
            verification_expires
        )
        VALUES (
            ?, ?, ?, ?, ?,
            'vendor',
            'inactive',
            0,
            ?,
            ?
        )
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param(
        "sssssss",
        $fullname,
        $address,
        $nearby,
        $email,
        $hashedPassword,
        $token,
        $expires
    );

    if (!$stmt->execute()) {

        throw new Exception($stmt->error);
    }

    $user_id = $conn->insert_id;

    /**
     * ================= VENDOR PROFILE =================
     */
    $stmt = $conn->prepare("
        INSERT INTO shops (
            owner_id,
            shop_name,
            address,
            nearby_landmark,
            phone
        )
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param(
        "issss",
        $user_id,
        $shopName,
        $address,
        $nearby,
        $phone
    );

    if (!$stmt->execute()) {

        throw new Exception($stmt->error);
    }

    /**
     * ================= CLOUDINARY UPLOAD =================
     */
    $permitUrl = "";

    if (
        !empty($_FILES['permit']) &&
        $_FILES['permit']['error'] === UPLOAD_ERR_OK
    ) {

        $cloudName = defined('CLOUDINARY_CLOUD_NAME')
            ? CLOUDINARY_CLOUD_NAME
            : null;

        if (!$cloudName) {

            throw new Exception("Cloudinary config missing");
        }

        $file = $_FILES['permit']['tmp_name'];

        $ch = curl_init(
            "https://api.cloudinary.com/v1_1/$cloudName/image/upload"
        );

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        curl_setopt($ch, CURLOPT_POST, true);

        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            "file" => new CURLFile($file),
            "upload_preset" => "unsigned_upload"
        ]);

        $response = curl_exec($ch);

        if ($response === false) {

            throw new Exception(
                "Cloudinary CURL error: " . curl_error($ch)
            );
        }

        curl_close($ch);

        $result = json_decode($response, true);

        if (
            !$result ||
            !isset($result['secure_url'])
        ) {

            throw new Exception(
                "Cloudinary upload failed: " . $response
            );
        }

        $permitUrl = $result['secure_url'];
    }

    /**
     * ================= BUSINESS PERMIT =================
     */
    $stmt = $conn->prepare("
        INSERT INTO business_permits (
            user_id,
            permit_image,
            permit_number,
            status
        )
        VALUES (?, ?, ?, 'pending')
    ");

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param(
        "iss",
        $user_id,
        $permitUrl,
        $permit_number
    );

    if (!$stmt->execute()) {

        throw new Exception($stmt->error);
    }

    /**
     * ================= VERIFY LINK =================
     */
    $verifyLink =
        "http://localhost/OSYUSO26/backend/auth/verify-email.php?token=" . $token;

    /**
     * ================= SEND EMAIL =================
     */
    $mail = new PHPMailer(true);

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




    $mail->addAddress($email, $fullname);

    $mail->isHTML(true);

    $mail->Subject = 'Verify your seller account';

    $mail->Body = "
        <h2>Seller Email Verification</h2>

        <p>
            Please verify your seller account by clicking the button below.
        </p>

        <a href='$verifyLink'
           style='
                display:inline-block;
                padding:12px 20px;
                background:#ff6600;
                color:white;
                text-decoration:none;
                border-radius:6px;
           '>
           Verify Seller Account
        </a>

        <p>
            This link expires in 30 minutes.
        </p>
    ";

    $mail->send();

    /**
     * ================= SUCCESS =================
     */
    ob_end_clean();

    echo json_encode([
        "success" => true,
        "message" => "Seller registered successfully. Verification email sent.",
        "user_id" => $user_id,
        "permit_url" => $permitUrl
    ]);

} catch (Exception $e) {

    ob_end_clean();

    echo json_encode([
        "success" => false,
        "message" => "SERVER ERROR",
        "error" => $e->getMessage()
    ]);
}