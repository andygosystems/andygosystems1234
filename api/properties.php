<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';

$pdo = get_pdo();

// Helper to read JSON body
function get_json_body() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if ($method === 'GET') {
    // Pagination and filtering
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 12;
    $offset = ($page - 1) * $limit;

    $filters = [];
    $where = [];
    if (!empty($_GET['type'])) { $where[] = 'type = :type'; $filters[':type'] = $_GET['type']; }
    if (!empty($_GET['status'])) { $where[] = 'status = :status'; $filters[':status'] = $_GET['status']; }
    if (!empty($_GET['location'])) { $where[] = 'location LIKE :location'; $filters[':location'] = '%' . $_GET['location'] . '%'; }
    if (!empty($_GET['min_price'])) { $where[] = 'price >= :min_price'; $filters[':min_price'] = floatval($_GET['min_price']); }
    if (!empty($_GET['max_price'])) { $where[] = 'price <= :max_price'; $filters[':max_price'] = floatval($_GET['max_price']); }
    if (!empty($_GET['bedrooms'])) { $where[] = 'bedrooms >= :bedrooms'; $filters[':bedrooms'] = intval($_GET['bedrooms']); }
    if (!empty($_GET['bathrooms'])) { $where[] = 'bathrooms >= :bathrooms'; $filters[':bathrooms'] = intval($_GET['bathrooms']); }

    if (!empty($_GET['updated_since'])) { $where[] = 'updated_at > :updated_since'; $filters[':updated_since'] = $_GET['updated_since']; }
    if (!empty($_GET['land_category'])) { $where[] = 'land_category = :land_category'; $filters[':land_category'] = $_GET['land_category']; }
    if (!empty($_GET['tenure_type'])) { $where[] = 'tenure_type = :tenure_type'; $filters[':tenure_type'] = $_GET['tenure_type']; }
    if (!empty($_GET['plot_size'])) { $where[] = 'plot_size = :plot_size'; $filters[':plot_size'] = $_GET['plot_size']; }
    if (isset($_GET['doc_ready_title'])) { $where[] = 'doc_ready_title = :doc_ready_title'; $filters[':doc_ready_title'] = intval($_GET['doc_ready_title']) ? 1 : 0; }
    if (isset($_GET['verified_listing'])) { $where[] = 'verified_listing = :verified_listing'; $filters[':verified_listing'] = intval($_GET['verified_listing']) ? 1 : 0; }
    if (!empty($_GET['topography'])) { $where[] = 'topography = :topography'; $filters[':topography'] = $_GET['topography']; }
    if (!empty($_GET['payment_plan'])) { $where[] = 'payment_plan = :payment_plan'; $filters[':payment_plan'] = $_GET['payment_plan']; }
    if (isset($_GET['proximity_near_main_road'])) { $where[] = 'proximity_near_main_road = :near_main_road'; $filters[':near_main_road'] = intval($_GET['proximity_near_main_road']) ? 1 : 0; }
    $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM properties $whereSql");
    foreach ($filters as $k => $v) $countStmt->bindValue($k, $v);
    $countStmt->execute();
    $total = intval($countStmt->fetchColumn());

    $stmt = $pdo->prepare("SELECT * FROM properties $whereSql ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
    foreach ($filters as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    // Attach images and amenities
    $data = [];
    foreach ($rows as $row) {
        $pid = $row['id'];
        $imgs = $pdo->prepare("SELECT url, is_primary FROM property_images WHERE property_id = :pid ORDER BY is_primary DESC, id ASC");
        $imgs->execute([':pid' => $pid]);
        $amen = $pdo->prepare("SELECT name FROM property_amenities WHERE property_id = :pid ORDER BY name ASC");
        $amen->execute([':pid' => $pid]);
        $row['images'] = array_map(fn($i) => $i['url'], $imgs->fetchAll());
        $row['amenities'] = array_map(fn($a) => $a['name'], $amen->fetchAll());
        $data[] = $row;
    }

    json_response([
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'data' => $data
    ]);
}

if ($method === 'POST' && !$id) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
    $payload = verify_jwt($token);
    if (!$payload) json_response(['error' => 'Unauthorized'], 401);
    // Create new property
    $data = $_POST ?: get_json_body();
    $errors = validate_property_input($data);
    if ($errors) json_response(['errors' => $errors], 422);

    $slug = slugify($data['title']);
    $stmt = $pdo->prepare("INSERT INTO properties 
        (title, description, price, currency, location, county, subcounty, estate, type, status, bedrooms, bathrooms, sqm, lat, lng, slug, virtual_tour_url, property_type, land_category, tenure_type, plot_size, doc_ready_title, doc_allotment_letter, doc_search_conducted, invest_fenced, invest_beacons, invest_borehole, invest_electricity, proximity_near_main_road, proximity_distance_cbd, proximity_future_infra, topography, payment_plan, verified_listing, created_at, updated_at) 
        VALUES (:title, :description, :price, :currency, :location, :county, :subcounty, :estate, :type, :status, :bedrooms, :bathrooms, :sqm, :lat, :lng, :slug, :virtual_tour_url, :property_type, :land_category, :tenure_type, :plot_size, :doc_ready_title, :doc_allotment_letter, :doc_search_conducted, :invest_fenced, :invest_beacons, :invest_borehole, :invest_electricity, :proximity_near_main_road, :proximity_distance_cbd, :proximity_future_infra, :topography, :payment_plan, :verified_listing, NOW(), NOW())");
    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'],
        ':price' => floatval($data['price']),
        ':currency' => $data['currency'],
        ':location' => $data['location'] ?? '',
        ':county' => $data['county'] ?? '',
        ':subcounty' => $data['subcounty'] ?? '',
        ':estate' => $data['estate'] ?? '',
        ':type' => $data['type'],
        ':status' => $data['status'],
        ':bedrooms' => intval($data['bedrooms'] ?? ($data['beds'] ?? 0)),
        ':bathrooms' => intval($data['bathrooms'] ?? ($data['baths'] ?? 0)),
        ':sqm' => intval($data['sqm'] ?? ($data['sqft'] ?? 0)),
        ':lat' => isset($data['lat']) ? floatval($data['lat']) : null,
        ':lng' => isset($data['lng']) ? floatval($data['lng']) : null,
        ':slug' => $slug,
        ':virtual_tour_url' => $data['virtual_tour_url'] ?? null,
        ':property_type' => $data['property_type'] ?? null,
        ':land_category' => $data['land_category'] ?? null,
        ':tenure_type' => $data['tenure_type'] ?? null,
        ':plot_size' => $data['plot_size'] ?? null,
        ':doc_ready_title' => !empty($data['doc_ready_title']) ? 1 : 0,
        ':doc_allotment_letter' => !empty($data['doc_allotment_letter']) ? 1 : 0,
        ':doc_search_conducted' => !empty($data['doc_search_conducted']) ? 1 : 0,
        ':invest_fenced' => !empty($data['invest_fenced']) ? 1 : 0,
        ':invest_beacons' => !empty($data['invest_beacons']) ? 1 : 0,
        ':invest_borehole' => !empty($data['invest_borehole']) ? 1 : 0,
        ':invest_electricity' => !empty($data['invest_electricity']) ? 1 : 0,
        ':proximity_near_main_road' => !empty($data['proximity_near_main_road']) ? 1 : 0,
        ':proximity_distance_cbd' => isset($data['proximity_distance_cbd']) ? intval($data['proximity_distance_cbd']) : null,
        ':proximity_future_infra' => !empty($data['proximity_future_infra']) ? 1 : 0,
        ':topography' => $data['topography'] ?? null,
        ':payment_plan' => $data['payment_plan'] ?? null,
        ':verified_listing' => !empty($data['verified_listing']) ? 1 : 0,
    ]);
    $propertyId = intval($pdo->lastInsertId());

    // Handle images
    $imageUrls = [];
    if (!empty($_FILES['images'])) {
        $files = $_FILES['images'];
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $tmp = $files['tmp_name'][$i];
                $type = mime_content_type($tmp);
                $name = uniqid('img_', true) . '.' . (in_array($type, ['image/png']) ? 'png' : 'jpg');
                global $UPLOADS_DIR;
                $dest = rtrim($UPLOADS_DIR, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $name;
                compress_and_watermark($tmp, $dest);
                $imageUrls[] = uploads_public_url($name);
            }
        }
    } elseif (!empty($data['images']) && is_array($data['images'])) {
        $imageUrls = $data['images'];
    }

    foreach ($imageUrls as $idx => $url) {
        $pdo->prepare("INSERT INTO property_images (property_id, url, is_primary) VALUES (:pid, :url, :primary)")
            ->execute([':pid' => $propertyId, ':url' => $url, ':primary' => $idx === 0 ? 1 : 0]);
    }

    // Amenities
    if (!empty($data['amenities']) && is_array($data['amenities'])) {
        $ins = $pdo->prepare("INSERT INTO property_amenities (property_id, name) VALUES (:pid, :name)");
        foreach ($data['amenities'] as $name) {
            $ins->execute([':pid' => $propertyId, ':name' => $name]);
        }
    }

    json_response(['id' => $propertyId, 'slug' => $slug], 201);
}

if ($method === 'PUT' && $id) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
    $payload = verify_jwt($token);
    if (!$payload) json_response(['error' => 'Unauthorized'], 401);
    $data = get_json_body();
    $fields = [
        'title','description','price','currency','location','county','subcounty','estate',
        'type','status','bedrooms','bathrooms','sqm','lat','lng','virtual_tour_url','property_type',
        'land_category','tenure_type','plot_size','doc_ready_title','doc_allotment_letter','doc_search_conducted',
        'invest_fenced','invest_beacons','invest_borehole','invest_electricity','proximity_near_main_road',
        'proximity_distance_cbd','proximity_future_infra','topography','payment_plan','verified_listing'
    ];
    $sets = [];
    $params = [':id' => $id];
    foreach ($fields as $f) {
        if (array_key_exists($f, $data)) {
            $sets[] = "$f = :$f";
            $params[":$f"] = $data[$f];
        }
    }
    if (isset($data['title'])) {
        $sets[] = "slug = :slug";
        $params[':slug'] = slugify($data['title']);
    }
    if ($sets) {
        $sets[] = "updated_at = NOW()";
        $sql = "UPDATE properties SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Manage images: if 'images' array provided, replace existing
    if (isset($data['images']) && is_array($data['images'])) {
        // Fetch old images to delete files if they are local uploads
        $old = $pdo->prepare("SELECT url FROM property_images WHERE property_id = :id");
        $old->execute([':id' => $id]);
        $oldUrls = $old->fetchAll();
        $pdo->prepare("DELETE FROM property_images WHERE property_id = :id")->execute([':id' => $id]);
        foreach ($data['images'] as $idx => $url) {
            $pdo->prepare("INSERT INTO property_images (property_id, url, is_primary) VALUES (:pid, :url, :primary)")
                ->execute([':pid' => $id, ':url' => $url, ':primary' => $idx === 0 ? 1 : 0]);
        }
        // Delete local files that are no longer used
        foreach ($oldUrls as $row) {
            $url = $row['url'];
            if (strpos($url, '/uploads/') !== false) {
                $filename = basename($url);
                global $UPLOADS_DIR;
                $path = rtrim($UPLOADS_DIR, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;
                @unlink($path);
            }
        }
    }

    // Amenities
    if (isset($data['amenities']) && is_array($data['amenities'])) {
        $pdo->prepare("DELETE FROM property_amenities WHERE property_id = :id")->execute([':id' => $id]);
        $ins = $pdo->prepare("INSERT INTO property_amenities (property_id, name) VALUES (:pid, :name)");
        foreach ($data['amenities'] as $name) {
            $ins->execute([':pid' => $id, ':name' => $name]);
        }
    }

    json_response(['message' => 'Updated']);
}

if ($method === 'DELETE' && $id) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = '';
    if (strpos($auth, 'Bearer ') === 0) { $token = substr($auth, 7); }
    $payload = verify_jwt($token);
    if (!$payload) json_response(['error' => 'Unauthorized'], 401);
    // Delete associated images from disk
    $imgs = $pdo->prepare("SELECT url FROM property_images WHERE property_id = :id");
    $imgs->execute([':id' => $id]);
    $rows = $imgs->fetchAll();
    foreach ($rows as $row) {
        $url = $row['url'];
        if (strpos($url, '/uploads/') !== false) {
            $filename = basename($url);
            global $UPLOADS_DIR;
            $path = rtrim($UPLOADS_DIR, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $filename;
            @unlink($path);
        }
    }
    $pdo->prepare("DELETE FROM property_images WHERE property_id = :id")->execute([':id' => $id]);
    $pdo->prepare("DELETE FROM property_amenities WHERE property_id = :id")->execute([':id' => $id]);
    $pdo->prepare("DELETE FROM properties WHERE id = :id")->execute([':id' => $id]);
    json_response(['message' => 'Deleted']);
}

json_response(['error' => 'Not found'], 404);
