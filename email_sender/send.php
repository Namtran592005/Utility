<?php
session_start();

// Thiết lập PHPMailer Autoload
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Yêu cầu không hợp lệ.']);
    exit;
}

// Lấy dữ liệu từ POST
$data = [
    'smtp_user' => trim($_POST['smtp_user'] ?? ''),
    'smtp_pass' => trim($_POST['smtp_pass'] ?? ''),
    'from_email' => trim($_POST['from_email'] ?? ''),
    'to_email' => trim($_POST['to_email'] ?? ''),
    'cc_email' => trim($_POST['cc_email'] ?? ''),
    'bcc_email' => trim($_POST['bcc_email'] ?? ''),
    'subject' => trim($_POST['subject'] ?? ''),
    'html_content' => $_POST['html_content'] ?? ''
];

try {
    if (empty($data['smtp_user']) || empty($data['smtp_pass']) || empty($data['to_email']) || empty($data['html_content'])) {
        throw new Exception("Vui lòng điền đầy đủ Email đăng nhập, Mật khẩu ứng dụng, Email nhận và Nội dung HTML.");
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com'; // Ví dụ: Gmail SMTP
    $mail->SMTPAuth = true;
    $mail->Username = $data['smtp_user'];
    $mail->Password = $data['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';

    // Gửi từ
    $fromEmail = !empty($data['from_email']) ? $data['from_email'] : $data['smtp_user'];
    $mail->setFrom($fromEmail, 'Custom Mail Sender');

    // Người nhận (To)
    $recipients = explode(',', $data['to_email']);
    foreach ($recipients as $recipient) {
        $recipient = trim($recipient);
        if (!empty($recipient)) {
            $mail->addAddress($recipient);
        }
    }
    
    // CC
    if (!empty($data['cc_email'])) {
        $ccs = explode(',', $data['cc_email']);
        foreach ($ccs as $cc) {
            $cc = trim($cc);
            if (!empty($cc)) {
                $mail->addCC($cc);
            }
        }
    }

    // BCC
    if (!empty($data['bcc_email'])) {
        $bccs = explode(',', $data['bcc_email']);
        foreach ($bccs as $bcc) {
            $bcc = trim($bcc);
            if (!empty($bcc)) {
                $mail->addBCC($bcc);
            }
        }
    }

    // Nội dung email
    $mail->isHTML(true);
    $mail->Subject = $data['subject'];
    $mail->Body = $data['html_content'];
    $mail->AltBody = strip_tags($data['html_content']);

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email đã được gửi thành công!']);
    
} catch (Exception $e) {
    $error_message = "Lỗi gửi email: {$mail->ErrorInfo}";
    if (strpos($e->getMessage(), 'authentication failure') !== false) {
        $error_message .= ". Lỗi xác thực. Hãy kiểm tra lại Email và Mật khẩu ứng dụng (App Password).";
    }
    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>