<?php
ob_start();

date_default_timezone_set("Asia/Manila");

header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set("display_errors", 0);

require "../vendor/autoload.php";
include("../dbConn.php");

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function response($success, $message, $data = null) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

try {
    $limit = 10;

    $stmt = $conn->prepare("
        SELECT *
        FROM email_queue
        WHERE status = 'pending'
            AND attempts < 5
        ORDER BY id ASC
        LIMIT ?
    ");

    $stmt->bind_param("i", $limit);
    $stmt->execute();

    $result = $stmt->get_result();

    $processed = 0;
    $sentCount = 0;
    $failedCount = 0;

    while ($email = $result->fetch_assoc()) {
        $emailId = (int)$email["id"];
        $processed++;

        try {
            $attempt = $conn->prepare("
                UPDATE email_queue
                SET attempts = attempts + 1
                WHERE id = ?
                    AND status = 'pending'
            ");

            $attempt->bind_param("i", $emailId);
            $attempt->execute();

            if ($attempt->affected_rows === 0) {
                continue;
            }

            $mail = new PHPMailer(true);

            $mail->isSMTP();
            $mail->Host = $_ENV["MAIL_HOST"];
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV["MAIL_USERNAME"];
            $mail->Password = $_ENV["MAIL_PASSWORD"];
            $mail->Port = (int)$_ENV["MAIL_PORT"];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

            $mail->setFrom($_ENV["MAIL_FROM"], "OSYUSO");
            $mail->addAddress($email["to_email"], $email["to_name"] ?: "");

            $mail->isHTML(true);
            $mail->Subject = $email["subject"];
            $mail->Body = $email["body_html"];
            $mail->AltBody = $email["body_text"] ?: strip_tags($email["body_html"]);

            $mail->send();

            $sent = $conn->prepare("
                UPDATE email_queue
                SET status = 'sent',
                    sent_at = NOW(),
                    last_error = NULL
                WHERE id = ?
            ");

            $sent->bind_param("i", $emailId);
            $sent->execute();

            $sentCount++;
        } catch (Throwable $e) {
            $failedCount++;
            $error = $e->getMessage();

            $failed = $conn->prepare("
                UPDATE email_queue
                SET status = CASE
                        WHEN attempts >= 5 THEN 'failed'
                        ELSE 'pending'
                    END,
                    last_error = ?
                WHERE id = ?
            ");

            $failed->bind_param("si", $error, $emailId);
            $failed->execute();

            error_log("Email queue failed ID {$emailId}: " . $error);
        }
    }

    response(true, "Email queue processed", [
        "processed" => $processed,
        "sent" => $sentCount,
        "failed" => $failedCount
    ]);
} catch (Throwable $e) {
    error_log("Email queue processor failed: " . $e->getMessage());

    response(false, "Email queue processor failed", [
        "error" => $e->getMessage()
    ]);
}