<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['file'])) {
    json_response(['error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'Upload error', 'code' => $file['error']], 400);
}

$allowed = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($file['type'], $allowed)) {
    json_response(['error' => 'Unsupported image format'], 415);
}

// Size limit ~8MB
if ($file['size'] > 8 * 1024 * 1024) {
    json_response(['error' => 'File too large'], 413);
}

$extMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp'
];
$ext = $extMap[$file['type']] ?? 'jpg';
$filename = uniqid('img_', true) . '.' . $ext;

global $UPLOADS_DIR;
$dest = rtrim($UPLOADS_DIR, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;

$ok = compress_and_watermark($file['tmp_name'], $dest);
if (!$ok) {
    // Fallback: move without processing
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_response(['error' => 'Failed to save file'], 500);
    }
}

$url = uploads_public_url($filename);
json_response(['url' => $url, 'filename' => $filename], 201);
