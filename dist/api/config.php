<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");

// Database Credentials
$host = "localhost";
$db_name = "afdotfkr_krugerr_brendt_db"; // Assumed database name convention for cPanel
$username = "afdotfkr"; 
$password = "Ox-Mu#T5j3g47V";

$conn = null;

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->exec("set names utf8");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    // Database connection failed
    // We do NOT exit here so that scripts can continue (e.g. to send email)
    // error_log("Connection error: " . $exception->getMessage());
}

// Helper to get POST data
function getInput() {
    return json_decode(file_get_contents("php://input"), true);
}
?>