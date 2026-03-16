<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$pdo = get_pdo();

$from = $_GET['from'] ?? date('Y-m-01');
$to = $_GET['to'] ?? date('Y-m-t');

// Conversion funnel
$funnel = [];
foreach (['inquiry','viewing','negotiation','closed'] as $stage) {
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM inquiries WHERE stage = :stage AND created_at BETWEEN :from AND :to");
  $stmt->execute([':stage' => $stage, ':from' => $from, ':to' => $to]);
  $funnel[$stage] = intval($stmt->fetchColumn());
}

// Source ROI (counts per source)
$sources = [];
foreach (['whatsapp','facebook','website','referral','other'] as $src) {
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM inquiries WHERE source = :src AND created_at BETWEEN :from AND :to");
  $stmt->execute([':src' => $src, ':from' => $from, ':to' => $to]);
  $sources[$src] = intval($stmt->fetchColumn());
}

// Speed to lead average (seconds)
$stmt = $pdo->prepare("SELECT AVG(speed_to_lead_seconds) FROM inquiries WHERE speed_to_lead_seconds IS NOT NULL AND created_at BETWEEN :from AND :to");
$stmt->execute([':from' => $from, ':to' => $to]);
$speedAvg = intval($stmt->fetchColumn() ?: 0);

// Occupancy vs Vacancy from leases
$stmt = $pdo->prepare("SELECT COUNT(*) FROM properties");
$stmt->execute();
$totalUnits = intval($stmt->fetchColumn());
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT property_id) FROM leases WHERE status = 'active' AND (start_date <= :to AND end_date >= :from)");
$stmt->execute([':from' => $from, ':to' => $to]);
$occupied = intval($stmt->fetchColumn());
$vacant = max(0, $totalUnits - $occupied);

// NOI and Maintenance
$stmt = $pdo->prepare("SELECT SUM(amount) FROM leases WHERE status = 'active' AND (start_date <= :to AND end_date >= :from)");
$stmt->execute([':from' => $from, ':to' => $to]);
$leaseIncome = floatval($stmt->fetchColumn() ?: 0);
$stmt = $pdo->prepare("SELECT SUM(amount) FROM maintenance_costs WHERE date BETWEEN :from AND :to");
$stmt->execute([':from' => $from, ':to' => $to]);
$maintenanceSum = floatval($stmt->fetchColumn() ?: 0);
$noi = $leaseIncome - $maintenanceSum;

// Days on Market (DOM)
$stmt = $pdo->prepare("SELECT AVG(DATEDIFF(COALESCE(updated_at, NOW()), created_at)) FROM properties WHERE status = 'available'");
$stmt->execute();
$dom = intval($stmt->fetchColumn() ?: 0);

// Forecast revenue (next month)
$nextFrom = date('Y-m-01', strtotime('+1 month'));
$nextTo = date('Y-m-t', strtotime('+1 month'));
$stmt = $pdo->prepare("SELECT SUM(amount) FROM leases WHERE status = 'active' AND (start_date <= :nextTo AND end_date >= :nextFrom)");
$stmt->execute([':nextFrom' => $nextFrom, ':nextTo' => $nextTo]);
$forecast = floatval($stmt->fetchColumn() ?: 0);

json_response([
  'funnel' => $funnel,
  'sources' => $sources,
  'speed_to_lead_avg' => $speedAvg,
  'occupancy' => ['occupied' => $occupied, 'vacant' => $vacant, 'total' => $totalUnits],
  'noi' => $noi,
  'maintenance' => $maintenanceSum,
  'lease_income' => $leaseIncome,
  'dom' => $dom,
  'forecast_next_month' => $forecast,
  'range' => ['from' => $from, 'to' => $to]
]);
