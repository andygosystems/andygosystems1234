
-- Database Schema for Krugerr Brendt

CREATE TABLE IF NOT EXISTS `properties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'KES',
  `location` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'Sale',
  `status` varchar(50) DEFAULT 'available',
  `amenities` text,
  `beds` int(11) DEFAULT '0',
  `baths` int(11) DEFAULT '0',
  `sqft` int(11) DEFAULT '0',
  `coords_lat` decimal(10,8) DEFAULT NULL,
  `coords_lng` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `property_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `property_id` (`property_id`),
  CONSTRAINT `fk_property_images` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Updates for Inquiries (Run these if table already exists)
-- ALTER TABLE `inquiries` ADD COLUMN `phone` varchar(50) DEFAULT NULL AFTER `email`;
-- ALTER TABLE `inquiries` ADD COLUMN `notes` text DEFAULT NULL AFTER `status`;

-- Chat System
CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL,
  `last_message_time` datetime NOT NULL,
  `status` varchar(20) DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `is_bot` tinyint(1) DEFAULT '0',
  `is_action` tinyint(1) DEFAULT '0',
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `fk_chat_messages` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
