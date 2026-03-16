<?php
require_once __DIR__ . '/config.php';

function get_pdo() {
    static $pdo = null;
    if ($pdo) return $pdo;
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS, $DB_CHARSET;
    $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=$DB_CHARSET";
    try {
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        json_response(['error' => 'Database connection failed', 'details' => $e->getMessage()], 500);
    }
    return $pdo;
}
