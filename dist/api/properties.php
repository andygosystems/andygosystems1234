<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch all properties with their images
    $query = "SELECT p.*, GROUP_CONCAT(pi.image_url) as images 
              FROM properties p 
              LEFT JOIN property_images pi ON p.id = pi.property_id 
              GROUP BY p.id 
              ORDER BY p.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format output
    foreach ($properties as &$prop) {
        $prop['amenities'] = json_decode($prop['amenities']);
        $prop['image_urls'] = $prop['images'] ? explode(',', $prop['images']) : [];
        $prop['coords'] = [$prop['coords_lat'], $prop['coords_lng']];
        unset($prop['images']);
    }

    echo json_encode($properties);
}

if ($method === 'POST') {
    $data = getInput();
    
    try {
        // Insert Property
        $query = "INSERT INTO properties 
                  (title, description, price, currency, location, type, status, amenities, beds, baths, sqft, coords_lat, coords_lng) 
                  VALUES 
                  (:title, :description, :price, :currency, :location, :type, :status, :amenities, :beds, :baths, :sqft, :lat, :lng)";
        
        $stmt = $conn->prepare($query);
        
        // Bind params
        $amenities = json_encode($data['amenities']);
        $stmt->bindParam(":title", $data['title']);
        $stmt->bindParam(":description", $data['description']);
        $stmt->bindParam(":price", $data['price']);
        $stmt->bindParam(":currency", $data['currency']);
        $stmt->bindParam(":location", $data['location']);
        $stmt->bindParam(":type", $data['type']);
        $stmt->bindParam(":status", $data['status']);
        $stmt->bindParam(":amenities", $amenities);
        $stmt->bindParam(":beds", $data['beds']);
        $stmt->bindParam(":baths", $data['baths']);
        $stmt->bindParam(":sqft", $data['sqft']);
        $stmt->bindParam(":lat", $data['coords'][0]);
        $stmt->bindParam(":lng", $data['coords'][1]);
        
        if ($stmt->execute()) {
            $property_id = $conn->lastInsertId();
            
            // Insert Images
            if (isset($data['image_urls']) && is_array($data['image_urls'])) {
                $imgQuery = "INSERT INTO property_images (property_id, image_url) VALUES (:pid, :url)";
                $imgStmt = $conn->prepare($imgQuery);
                foreach ($data['image_urls'] as $url) {
                    $imgStmt->bindParam(":pid", $property_id);
                    $imgStmt->bindParam(":url", $url);
                    $imgStmt->execute();
                }
            }
            
            echo json_encode(["message" => "Property created", "id" => $property_id]);
        } else {
            // Return specific SQL error
            echo json_encode(["error" => "Failed to create property", "details" => $stmt->errorInfo()]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => "Database Exception", "details" => $e->getMessage()]);
    }
}
?>