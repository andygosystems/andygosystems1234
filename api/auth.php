<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

$envEmail = getenv('ADMIN_EMAIL') ?: '';
$envPass = getenv('ADMIN_PASSWORD') ?: '';

if ($email !== $envEmail || $password !== $envPass) {
    json_response(['error' => 'Invalid credentials'], 401);
}

$token = create_jwt(['sub' => $email, 'role' => 'admin'], 86400);
json_response(['token' => $token]);
