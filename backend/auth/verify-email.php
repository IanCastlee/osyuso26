<?php

date_default_timezone_set('Asia/Manila');

include("../dbConn.php");

$token = $_GET['token'] ?? '';

if (!$token) {
    die("Invalid token");
}

$currentTime = date("Y-m-d H:i:s");

$stmt = $conn->prepare("
    SELECT user_id
    FROM users
    WHERE verification_token = ?
    AND verification_expires > ?
");

$stmt->bind_param("ss", $token, $currentTime);

$stmt->execute();

$result = $stmt->get_result();

$success = false;

if ($result->num_rows > 0) {

    $user = $result->fetch_assoc();

    $update = $conn->prepare("
        UPDATE users
        SET
            email_verified = 1,
            verification_token = NULL,
            verification_expires = NULL
        WHERE user_id = ?
    ");

    $update->bind_param("i", $user['user_id']);

    $update->execute();

    $success = true;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>Email Verification</title>

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial, sans-serif;
}

body{
    width:100%;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#f5f5f5;
    padding:20px;
}

.card{
    width:100%;
    max-width:420px;
    background:white;
    padding:40px 30px;
    border-radius:16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.08);
    text-align:center;
}

.icon{
    width:80px;
    height:80px;
    border-radius:50%;
    margin:0 auto 20px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:40px;
    color:white;
}

.success{
    background:#22c55e;
}

.error{
    background:#ef4444;
}

h1{
    font-size:24px;
    margin-bottom:12px;
    color:#111827;
}

p{
    color:#6b7280;
    font-size:14px;
    line-height:1.6;
    margin-bottom:25px;
}

.btn{
    display:inline-block;
    padding:12px 20px;
    background:#ff6600;
    color:white;
    text-decoration:none;
    border-radius:8px;
    font-size:14px;
    font-weight:600;
    transition:.2s;
}

.btn:hover{
    opacity:.9;
}

</style>

</head>
<body>

<div class="card">

    <?php if($success): ?>

        <div class="icon success">
            ✓
        </div>

        <h1>Email Verified</h1>

        <p>
            Your account has been successfully verified.
            You can now sign in to your account.
        </p>

        <a
            href="http://localhost:5173/signin"
            class="btn"
        >
            Go to Sign In
        </a>

    <?php else: ?>

        <div class="icon error">
            ✕
        </div>

        <h1>Invalid or Expired</h1>

        <p>
            This verification link is invalid or already expired.
        </p>

        <a
            href="http://localhost:5173/signup"
            class="btn"
        >
            Back to Register
        </a>

    <?php endif; ?>

</div>

</body>
</html>