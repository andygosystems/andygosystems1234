<?php
// Load environment variables from .env file if present
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $key = trim($key);
        $value = trim($value);
        if ($key !== '') {
            putenv("$key=$value");
        }
    }
}

// CORS and security headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: no-referrer-when-downgrade');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database config via env
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_NAME = getenv('DB_NAME') ?: 'krugerr_brendt';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_CHARSET = 'utf8mb4';

// Uploads directory (ensure 755 in cPanel)
$UPLOADS_DIR = realpath(__DIR__ . '/../public/uploads');
if ($UPLOADS_DIR === false) {
    $UPLOADS_DIR = __DIR__ . '/../public/uploads';
}
if (!is_dir($UPLOADS_DIR)) {
    @mkdir($UPLOADS_DIR, 0755, true);
}

// Base URL for uploaded files (adjust when deploying)
$BASE_URL = getenv('BASE_URL') ?: ''; // e.g., https://yourdomain.com
function uploads_public_url($filename) {
    global $BASE_URL;
    $path = '/uploads/' . $filename;
    return $BASE_URL ? rtrim($BASE_URL, '/') . $path : $path;
}

// Simple JSON response helper
function json_response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}
