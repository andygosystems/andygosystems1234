<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle Preflight OPTIONS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method === 'GET') {
    if ($conn) {
        // Fetch all sessions and their messages
        // This is a simple implementation. For production, you might want to paginate or load messages on demand.
        try {
            $query = "SELECT * FROM chat_sessions ORDER BY last_message_time DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // For each session, get messages
            foreach ($sessions as &$session) {
                $msgQuery = "SELECT * FROM chat_messages WHERE session_id = :sid ORDER BY timestamp ASC";
                $msgStmt = $conn->prepare($msgQuery);
                $msgStmt->bindParam(':sid', $session['id']);
                $msgStmt->execute();
                $messages = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Map DB columns to Frontend interface if needed
                // Frontend expects: text, isBot (boolean), timestamp, isAction (boolean)
                $session['messages'] = array_map(function($msg) {
                    return [
                        'text' => $msg['message'],
                        'isBot' => (bool)$msg['is_bot'],
                        'timestamp' => $msg['timestamp'],
                        'isAction' => (bool)$msg['is_action']
                    ];
                }, $messages);
                
                // Frontend expects camelCase keys
                $session['startTime'] = $session['start_time'];
                $session['lastMessageTime'] = $session['last_message_time'];
            }
            
            echo json_encode($sessions);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        // DB not connected
        echo json_encode([]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$conn) {
        http_response_code(500);
        echo json_encode(["error" => "Database not connected"]);
        exit();
    }
    
    $action = $data['action'] ?? '';
    
    if ($action === 'start_session') {
        try {
            $query = "INSERT INTO chat_sessions (id, start_time, last_message_time, status) VALUES (:id, :start, :last, 'active')";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':start', $data['startTime']);
            $stmt->bindParam(':last', $data['startTime']); // Same as start initially
            
            if ($stmt->execute()) {
                echo json_encode(["message" => "Session started"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Failed to start session"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } elseif ($action === 'add_message') {
        try {
            $query = "INSERT INTO chat_messages (session_id, message, is_bot, is_action, timestamp) VALUES (:sid, :msg, :bot, :action, :ts)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':sid', $data['sessionId']);
            $stmt->bindParam(':msg', $data['text']);
            $isBot = $data['isBot'] ? 1 : 0;
            $stmt->bindParam(':bot', $isBot);
            $isAction = $data['isAction'] ? 1 : 0;
            $stmt->bindParam(':action', $isAction);
            $stmt->bindParam(':ts', $data['timestamp']);
            
            $stmt->execute();
            
            // Update session last_message_time
            $updateQuery = "UPDATE chat_sessions SET last_message_time = :ts WHERE id = :sid";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(':ts', $data['timestamp']);
            $updateStmt->bindParam(':sid', $data['sessionId']);
            $updateStmt->execute();
            
            echo json_encode(["message" => "Message added"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid action"]);
    }
}
?>