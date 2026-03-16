CREATE TABLE IF NOT EXISTS inquiries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NULL,
  customer_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  message TEXT,
  source ENUM('whatsapp','facebook','website','referral','other') DEFAULT 'website',
  stage ENUM('inquiry','viewing','negotiation','closed') DEFAULT 'inquiry',
  status ENUM('new','read','contacted','archived') DEFAULT 'new',
  budget DECIMAL(15,2) DEFAULT NULL,
  speed_to_lead_seconds INT DEFAULT NULL,
  interactions_count INT DEFAULT 0,
  assigned_agent VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
