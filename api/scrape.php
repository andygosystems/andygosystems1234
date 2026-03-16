<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

function http_get($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.9',
            'Cache-Control: no-cache',
            'Pragma: no-cache'
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($err) {
            error_log("Scrape error: $err for URL $url");
            return false;
        }
        return $res;
    }
    return @file_get_contents($url);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = '';
if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
$payload = verify_jwt($token);
if (!$payload) { json_response(['error' => 'Unauthorized'], 401); }

$body = json_decode(file_get_contents('php://input'), true);
$urls = isset($body['urls']) && is_array($body['urls']) ? $body['urls'] : [];
if (!$urls) json_response(['error' => 'No URLs provided'], 400);

$results = [];
foreach ($urls as $url) {
    $html = http_get($url);
    if (!$html) {
        $results[] = ['url' => $url, 'error' => 'Failed to fetch'];
        continue;
    }

    $title = null;
    $description = null;
    $images = [];
    // Improved regex to handle various meta tag formats
    if (preg_match('/<meta[^>]+(?:property|name)=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $title = html_entity_decode($m[1], ENT_QUOTES);
    }
    if (preg_match('/<meta[^>]+(?:property|name)=["\'](?:og:)?description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        $description = html_entity_decode($m[1], ENT_QUOTES);
    }
    if (preg_match_all('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
        foreach ($m[1] as $img) $images[] = $img;
    }
    // Fallback title from h1 if meta fails
    if (!$title && preg_match('/<h1[^>]*>([^<]+)<\/h1>/i', $html, $m)) {
        $title = trim(strip_tags(html_entity_decode($m[1], ENT_QUOTES)));
    }
    // Fallback images from main property images
    if (count($images) === 0 && preg_match_all('/<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']/i', $html, $m)) {
        foreach ($m[1] as $img) {
            if (preg_match('/\.(jpg|jpeg|png|webp)/i', $img) && stripos($img, 'property') !== false) $images[] = $img;
        }
    }
    // Keywords & Features detection
    $keywords = [];
    $features_list = [
        'all ensuite', 'servant quarters', 'sq', 'modern finishes', 'gated community', 
        'electric fence', 'cctv', 'borehole', 'generator', 'solar', 'airbnb', 
        'furnished', 'electricity available', 'beacons', 'ready for construction', 
        'scenic views', 'title deed ready', 'fenced', 'main road', 'bypass', 
        'installment', 'payment plan', 'financing', '50x100', '1/8 acre', '1/4 acre'
    ];
    foreach ($features_list as $kw) {
        if (stripos($html, $kw) !== false) $keywords[] = $kw;
    }
    $results[] = [
        'url' => $url,
        'title' => $title,
        'description' => $description,
        'images' => array_values(array_unique($images)),
        'keywords' => $keywords,
    ];
}

json_response(['items' => $results]);
