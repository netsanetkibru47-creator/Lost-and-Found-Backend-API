CREATE DATABASE IF NOT EXISTS lost_and_found;
USE lost_and_found;
DROP TABLE IF EXISTS items;
CREATE TABLE items(
id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
name           VARCHAR(100) NOT NULL,
description    TEXT NULL,
category       ENUM('electronics','keys','documents','books','clothing','bags','other') NOT NULL DEFAULT 'other',
found_location VARCHAR(150) NOT NULL,
found_at       DATETIME NOT NULL,
is_claimed     BOOLEAN NOT NULL DEFAULT FALSE,
created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO items (name, category, found_location, found_at) VALUES
  ('Black iPhone 13', 'electronics', 'Library, 2nd floor', '2026-10-28 14:30:00'),
  ('Set of 3 keys', 'keys', 'Main cafeteria', '2026-10-30 12:10:00');