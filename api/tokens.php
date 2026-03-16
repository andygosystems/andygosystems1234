<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
    $payload = verify_jwt($token);
    if (!$payload) { http_response_code(401); exit(); }
    $body = json_decode(file_get_contents('php://input'), true);
    $t = $body['token'] ?? '';
    $platform = $body['platform'] ?? '';
    $filters = isset($body['filters']) ? json_encode($body['filters']) : null;
    if (!$t || !$platform) { http_response_code(400); exit(); }
    $stmt = $pdo->prepare("INSERT INTO push_tokens (token, platform, filters) VALUES (:t, :p, :f)");
    $stmt->execute([':t' => $t, ':p' => $platform, ':f' => $filters]);
    json_response(['message' => 'registered']);
}

if ($method === 'DELETE') {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
    $payload = verify_jwt($token);
    if (!$payload) { http_response_code(401); exit(); }
    $body = json_decode(file_get_contents('php://input'), true);
    $t = $body['token'] ?? '';
    if (!$t) { http_response_code(400); exit(); }
    $stmt = $pdo->prepare("DELETE FROM push_tokens WHERE token = :t");
    $stmt->execute([':t' => $t]);
    json_response(['message' => 'deleted']);
}

http_response_code(405);
