<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getInput();
    
    if (!isset($data['email']) || !isset($data['password'])) {
        echo json_encode(['error' => 'Missing credentials']);
        exit;
    }

    $query = "SELECT id, email, password_hash, role FROM users WHERE email = :email LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":email", $data['email']);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($data['password'], $row['password_hash'])) {
            // Generate a simple token (in production use JWT)
            $token = bin2hex(random_bytes(16));
            // In a real app, store this token in DB with expiry
            
            echo json_encode([
                "message" => "Login successful",
                "token" => $token,
                "user" => [
                    "id" => $row['id'],
                    "email" => $row['email'],
                    "role" => $row['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid password"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["error" => "User not found"]);
    }
}
?>