<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];

function body() {
  $input = file_get_contents('php://input');
  $data = json_decode($input, true);
  return is_array($data) ? $data : [];
}

if ($method === 'GET') {
  $source = $_GET['source'] ?? null;
  $stage = $_GET['stage'] ?? null;
  $status = $_GET['status'] ?? null;
  $from = $_GET['from'] ?? null;
  $to = $_GET['to'] ?? null;
  $where = [];
  $params = [];
  if ($source) { $where[] = 'source = :source'; $params[':source'] = $source; }
  if ($stage) { $where[] = 'stage = :stage'; $params[':stage'] = $stage; }
  if ($status) { $where[] = 'status = :status'; $params[':status'] = $status; }
  if ($from) { $where[] = 'created_at >= :from'; $params[':from'] = $from; }
  if ($to) { $where[] = 'created_at <= :to'; $params[':to'] = $to; }
  $sql = 'SELECT * FROM inquiries ' . (count($where) ? 'WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY created_at DESC';
  $stmt = $pdo->prepare($sql);
  foreach ($params as $k => $v) $stmt->bindValue($k, $v);
  $stmt->execute();
  json_response($stmt->fetchAll());
}

if ($method === 'POST') {
  $data = body();
  if (!isset($data['action'])) {
    // Create inquiry
    $stmt = $pdo->prepare("INSERT INTO inquiries (property_id, customer_name, email, phone, message, source, stage, status, budget, speed_to_lead_seconds, interactions_count, assigned_agent) 
      VALUES (:property_id, :customer_name, :email, :phone, :message, :source, :stage, :status, :budget, :speed_to_lead_seconds, :interactions_count, :assigned_agent)");
    $stmt->execute([
      ':property_id' => $data['property_id'] ?? null,
      ':customer_name' => $data['customer_name'],
      ':email' => $data['email'],
      ':phone' => $data['phone'] ?? null,
      ':message' => $data['message'] ?? '',
      ':source' => $data['source'] ?? 'website',
      ':stage' => $data['stage'] ?? 'inquiry',
      ':status' => $data['status'] ?? 'new',
      ':budget' => isset($data['budget']) ? floatval($data['budget']) : null,
      ':speed_to_lead_seconds' => $data['speed_to_lead_seconds'] ?? null,
      ':interactions_count' => $data['interactions_count'] ?? 0,
      ':assigned_agent' => $data['assigned_agent'] ?? null,
    ]);
    json_response(['id' => $pdo->lastInsertId()], 201);
  } else {
    // Updates
    $action = $data['action'];
    if ($action === 'update_status') {
      $stmt = $pdo->prepare("UPDATE inquiries SET status = :status WHERE id = :id");
      $stmt->execute([':status' => $data['status'], ':id' => $data['id']]);
      json_response(['message' => 'ok']);
    } else if ($action === 'update_stage') {
      $stmt = $pdo->prepare("UPDATE inquiries SET stage = :stage WHERE id = :id");
      $stmt->execute([':stage' => $data['stage'], ':id' => $data['id']]);
      json_response(['message' => 'ok']);
    } else if ($action === 'update_notes') {
      $stmt = $pdo->prepare("UPDATE inquiries SET message = :message WHERE id = :id");
      $stmt->execute([':message' => $data['notes'], ':id' => $data['id']]);
      json_response(['message' => 'ok']);
    } else {
      json_response(['error' => 'unknown action'], 400);
    }
  }
}

if ($method === 'DELETE') {
  $data = body();
  $id = $data['id'] ?? ($_GET['id'] ?? null);
  if (!$id) json_response(['error' => 'id required'], 400);
  $stmt = $pdo->prepare("DELETE FROM inquiries WHERE id = :id");
  $stmt->execute([':id' => $id]);
  json_response(['message' => 'deleted']);
}

http_response_code(405);
