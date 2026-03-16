<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Handle File Upload
    if (isset($_FILES['file'])) {
        $target_dir = "../uploads/"; // Make sure this folder exists
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        
        $filename = uniqid() . '-' . basename($_FILES["file"]["name"]);
        $target_file = $target_dir . $filename;
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
        
        // Check if image file is a actual image
        $check = getimagesize($_FILES["file"]["tmp_name"]);
        if($check !== false) {
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
                // Return the public URL
                // Assuming the API is in /api and uploads are in /uploads
                $publicUrl = "/uploads/" . $filename; 
                echo json_encode(["url" => $publicUrl]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "File is not an image."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded"]);
    }
}
?>