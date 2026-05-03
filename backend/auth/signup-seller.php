<?php
include("../header.php");

ob_start();
header("Content-Type: application/json");

error_reporting(0);

require_once "../dbConn.php";
require_once "../config/cloudinary.php";

try {

    /**
     * 1. GET DATA
     */
    $fname = $_POST['fname'] ?? '';
    $lname = $_POST['lname'] ?? '';
    $shopName = $_POST['shopName'] ?? '';
    $address = $_POST['address'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $nearby = $_POST['nearby'] ?? '';
    $permit_number = $_POST['permit_number'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    /**
     * VALIDATION
     */
    if (!$email || !$password || !$shopName) {
        throw new Exception("Missing required fields");
    }

    /**
     * 2. CHECK EMAIL
     */
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        throw new Exception("Email already exists");
    }

    /**
     * 3. INSERT USER
     */
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $fullname = $fname . " " . $lname;

    $stmt = $conn->prepare("
        INSERT INTO users (fullname, address, nearby, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, 'vendor', 'pending')
    ");

    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param("sssss", $fullname, $address, $nearby, $email, $hashedPassword);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    $user_id = $conn->insert_id;

    /**
     * 4. VENDOR PROFILE
     */
    $stmt = $conn->prepare("
        INSERT INTO vendor_profiles (user_id, shop_name, address, nearby_landmark, phone)
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param("issss", $user_id, $shopName, $address, $nearby, $phone);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    /**
     * 5. CLOUDINARY UPLOAD (SAFE VERSION)
     */
    $permitUrl = "";

    if (!empty($_FILES['permit']) && $_FILES['permit']['error'] === UPLOAD_ERR_OK) {

        $cloudName = defined('CLOUDINARY_CLOUD_NAME') ? CLOUDINARY_CLOUD_NAME : null;

        if (!$cloudName) {
            throw new Exception("Cloudinary config missing");
        }

        $file = $_FILES['permit']['tmp_name'];

        $ch = curl_init("https://api.cloudinary.com/v1_1/$cloudName/image/upload");

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);

        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            "file" => new CURLFile($file),
            "upload_preset" => "unsigned_upload"
        ]);

        $response = curl_exec($ch);

        if ($response === false) {
            throw new Exception("Cloudinary CURL error: " . curl_error($ch));
        }

        curl_close($ch);

        $result = json_decode($response, true);

        if (!$result || !isset($result['secure_url'])) {
            throw new Exception("Cloudinary upload failed: " . $response);
        }

        $permitUrl = $result['secure_url'];
    }

    /**
     * 6. BUSINESS PERMIT INSERT
     */
    $stmt = $conn->prepare("
        INSERT INTO business_permits (user_id, permit_image, permit_number, status)
        VALUES (?, ?, ?, 'pending')
    ");

    if (!$stmt) throw new Exception($conn->error);

    $stmt->bind_param("iss", $user_id, $permitUrl, $permit_number);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    /**
     * 7. SUCCESS RESPONSE
     */
    ob_end_clean();

    echo json_encode([
        "success" => true,
        "message" => "Seller registered successfully",
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