<?php
require_once __DIR__ . '/config.php';

$file = $_GET['file'] ?? '';
$w = intval($_GET['w'] ?? 720);
if ($w < 100) $w = 100;
if ($w > 2048) $w = 2048;

global $UPLOADS_DIR;
$path = rtrim($UPLOADS_DIR, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . basename($file);
if (!file_exists($path)) {
    http_response_code(404);
    exit();
}

$info = getimagesize($path);
if (!$info) {
    http_response_code(415);
    exit();
}
$mime = $info['mime'];
switch ($mime) {
    case 'image/jpeg':
        $img = imagecreatefromjpeg($path);
        break;
    case 'image/png':
        $img = imagecreatefrompng($path);
        imagesavealpha($img, true);
        break;
    case 'image/webp':
        if (function_exists('imagecreatefromwebp')) {
            $img = imagecreatefromwebp($path);
        } else {
            $img = imagecreatefrompng($path);
        }
        break;
    default:
        http_response_code(415);
        exit();
}

$width = imagesx($img);
$height = imagesy($img);
if ($width > $w) {
    $newWidth = $w;
    $newHeight = intval($height * ($newWidth / $width));
    $resized = imagecreatetruecolor($newWidth, $newHeight);
    imagealphablending($resized, true);
    imagesavealpha($resized, true);
    imagecopyresampled($resized, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    imagedestroy($img);
    $img = $resized;
}

header('Content-Type: image/webp');
header('Cache-Control: public, max-age=604800');
if (function_exists('imagewebp')) {
    imagewebp($img, null, 82);
} else {
    imagepng($img);
}
imagedestroy($img);
