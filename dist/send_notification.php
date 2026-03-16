<?php
// Set headers to allow cross-origin requests (useful if frontend and backend are on different subdomains)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["sent" => false, "message" => "Method not allowed"]);
    exit();
}

// Get JSON input
$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

if (empty($_POST['message'])) {
    http_response_code(400);
    echo json_encode(["sent" => false, "message" => "No message provided"]);
    exit();
}

// Configuration
$to = 'info@krugerrbrendt.com'; // Your cPanel email
$subject = 'New Inquiry from AI Assistant';
$messageContent = $_POST['message'];

// Construct email headers
$headers = "From: no-reply@krugerrbrendt.com\r\n";
$headers .= "Reply-To: no-reply@krugerrbrendt.com\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
$sent = mail($to, $subject, $messageContent, $headers);

if ($sent) {
    echo json_encode(["sent" => true, "message" => "Email sent successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["sent" => false, "message" => "Mail function failed. Check server logs."]);
}
?>