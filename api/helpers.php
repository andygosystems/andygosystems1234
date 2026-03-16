<?php
require_once __DIR__ . '/config.php';

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return $text ?: 'n-a';
}

function validate_property_input($data) {
    $errors = [];
    if (empty($data['title'])) $errors[] = 'Title required';
    if (empty($data['description'])) $errors[] = 'Description required';
    if (!isset($data['price'])) $errors[] = 'Price required';
    if (empty($data['currency'])) $errors[] = 'Currency required';
    if (empty($data['location'])) $errors[] = 'Location required';
    if (empty($data['type'])) $errors[] = 'Property type required';
    if (empty($data['status'])) $errors[] = 'Status required';
    return $errors;
}

function compress_and_watermark($tmpPath, $destPath) {
    // Supports jpg, jpeg, png, webp
    $info = getimagesize($tmpPath);
    if (!$info) return false;
    $mime = $info['mime'];
    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($tmpPath);
            break;
        case 'image/png':
            $image = imagecreatefrompng($tmpPath);
            imagesavealpha($image, true);
            break;
        case 'image/webp':
            if (function_exists('imagecreatefromwebp')) {
                $image = imagecreatefromwebp($tmpPath);
            } else {
                return false;
            }
            break;
        default:
            return false;
    }
    if (!$image) return false;

    // Resize if very large (max width 1920)
    $width = imagesx($image);
    $height = imagesy($image);
    $maxWidth = 1920;
    if ($width > $maxWidth) {
        $newWidth = $maxWidth;
        $newHeight = intval($height * ($newWidth / $width));
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);
        $image = $resized;
        $width = $newWidth;
        $height = $newHeight;
    }

    // Watermark if logo exists
    $logoPath = __DIR__ . '/assets/logo.png';
    if (file_exists($logoPath)) {
        $logo = imagecreatefrompng($logoPath);
        $lw = imagesx($logo);
        $lh = imagesy($logo);
        $scale = 0.18;
        $targetW = intval($width * $scale);
        $targetH = intval($lh * ($targetW / $lw));
        $logoResized = imagecreatetruecolor($targetW, $targetH);
        imagealphablending($logoResized, false);
        imagesavealpha($logoResized, true);
        imagecopyresampled($logoResized, $logo, 0, 0, 0, 0, $targetW, $targetH, $lw, $lh);
        $margin = 12;
        imagecopy($image, $logoResized, $width - $targetW - $margin, $height - $targetH - $margin, 0, 0, $targetW, $targetH);
        imagedestroy($logoResized);
        imagedestroy($logo);
    }

    // Save compressed
    $ext = strtolower(pathinfo($destPath, PATHINFO_EXTENSION));
    $ok = false;
    if ($ext === 'jpg' || $ext === 'jpeg') {
        $ok = imagejpeg($image, $destPath, 82);
    } elseif ($ext === 'png') {
        $ok = imagepng($image, $destPath, 6);
    } elseif ($ext === 'webp' && function_exists('imagewebp')) {
        $ok = imagewebp($image, $destPath, 82);
    }
    imagedestroy($image);
    return $ok;
}
