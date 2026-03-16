<?php
include_once 'config.php';
include_once 'class.smtp.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle Preflight OPTIONS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method === 'GET') {
    if ($conn) {
        // Updated query to join with properties and get title + one image
        $query = "SELECT i.*, p.title as property_title, 
                  (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1) as property_image 
                  FROM inquiries i 
                  LEFT JOIN properties p ON i.property_id = p.id 
                  ORDER BY i.created_at DESC";
                  
        $stmt = $conn->prepare($query);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        echo json_encode([]);
    }
}

if ($method === 'POST') {
    $data = getInput();
    $db_saved = false;
    $email_sent = false;
    
    // Handle specific actions
    if (isset($data['action']) && $data['action'] === 'update_notes' && $conn) {
        $query = "UPDATE inquiries SET notes = :notes WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":notes", $data['notes']);
        $stmt->bindParam(":id", $data['id']);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Notes updated"]);
        } else {
            echo json_encode(["error" => "Failed to update notes"]);
        }
        exit();
    }

    // Update Status (Only if DB connected)
    if (isset($data['id']) && isset($data['status']) && !isset($data['action']) && $conn) {
        $query = "UPDATE inquiries SET status = :status WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":status", $data['status']);
        $stmt->bindParam(":id", $data['id']);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Status updated"]);
        } else {
            echo json_encode(["error" => "Failed to update"]);
        }
        exit();
    } 
    
    // New Inquiry
    // 1. Try to save to DB
    if ($conn) {
        try {
            $query = "INSERT INTO inquiries (customer_name, email, phone, message, property_id) VALUES (:name, :email, :phone, :message, :pid)";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(":name", $data['customer_name']);
            $stmt->bindParam(":email", $data['email']);
            $stmt->bindParam(":phone", $data['phone']); // Add phone
            $stmt->bindParam(":message", $data['message']);
            
            // Handle nullable property_id
            $pid = isset($data['property_id']) ? $data['property_id'] : null;
            $stmt->bindParam(":pid", $pid);
            
            if ($stmt->execute()) {
                $db_saved = true;
            } else {
                error_log("DB Insert Failed: " . print_r($stmt->errorInfo(), true));
            }
        } catch (Exception $e) {
            error_log("DB Save Error: " . $e->getMessage());
        }
    }

    // 2. Send Email via SMTP (Always try, regardless of DB)
    try {
        $mailer = new SMTPMailer(
            'mail.krugerrbrendt.com', 
            465, 
            'info@krugerrbrendt.com', 
            'Ox-Mu#T5j3g47V'
        );

        $subject = "New Inquiry: " . ($data['subject'] ?? 'Website Inquiry');
        $body = "
            <h2>New Inquiry Received</h2>
            <p><strong>Name:</strong> {$data['customer_name']}</p>
            <p><strong>Email:</strong> {$data['email']}</p>
            <p><strong>Message:</strong><br>{$data['message']}</p>
            <hr>
            <p><strong>System Note:</strong> Notification logic for +254 733 323 273 executed.</p>
        ";

        // Send to Admin
        $sent = $mailer->send('info@krugerrbrendt.com', $subject, $body);
        if ($sent === true) {
            $email_sent = true;
        } else {
            error_log("SMTP Error: " . $sent);
        }

        // 3. Send WhatsApp Notification (via UltraMsg or similar gateway)
        // To use this: Sign up at ultramsg.com (or any WhatsApp Gateway) to get an Instance ID and Token.
        $wa_instance_id = 'YOUR_INSTANCE_ID'; // e.g., instance12345
        $wa_token       = 'YOUR_TOKEN';       // e.g., abc123xyz
        
        if ($wa_instance_id !== 'YOUR_INSTANCE_ID') {
            $admin_phone = "254733323273"; // The admin's WhatsApp number
            $wa_message = "🔔 *New Lead Received*\n\n" . 
                          "👤 *Name:* " . $data['customer_name'] . "\n" .
                          "📧 *Email:* " . $data['email'] . "\n" .
                          "💬 *Msg:* " . substr($data['message'], 0, 100) . "...";
            
            $curl = curl_init();
            $params = [
                'token' => $wa_token,
                'to' => $admin_phone,
                'body' => $wa_message
            ];
            
            // Example using UltraMsg API structure
            curl_setopt_array($curl, array(
              CURLOPT_URL => "https://api.ultramsg.com/$wa_instance_id/messages/chat",
              CURLOPT_RETURNTRANSFER => true,
              CURLOPT_ENCODING => "",
              CURLOPT_MAXREDIRS => 10,
              CURLOPT_TIMEOUT => 30,
              CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
              CURLOPT_CUSTOMREQUEST => "POST",
              CURLOPT_POSTFIELDS => http_build_query($params),
              CURLOPT_HTTPHEADER => array(
                "content-type: application/x-www-form-urlencoded"
              ),
            ));
            
            $response = curl_exec($curl);
            $err = curl_error($curl);
            curl_close($curl);
            
            if ($err) {
                error_log("WhatsApp Error: " . $err);
            }
        }

    } catch (Exception $e) {
        error_log("Mail/SMS Exception: " . $e->getMessage());
    }

    // Final Response
    if ($db_saved || $email_sent) {
        echo json_encode([
            "message" => "Inquiry processed", 
            "db_saved" => $db_saved, 
            "email_sent" => $email_sent
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save or send inquiry"]);
    }
}
?>