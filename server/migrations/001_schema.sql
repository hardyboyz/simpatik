-- SIMPATIK Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS imunisasi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE imunisasi;

-- Users / Auth
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','puskesmas','bidan','dinkes') NOT NULL DEFAULT 'bidan',
  puskesmas VARCHAR(100) DEFAULT NULL,
  district_id INT DEFAULT NULL,
  village_id INT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Districts (Kecamatan)
CREATE TABLE IF NOT EXISTS districts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Villages (Desa/Kelurahan)
CREATE TABLE IF NOT EXISTS villages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  district_id INT NOT NULL,
  puskesmas VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
);

-- Vaccine master data
CREATE TABLE IF NOT EXISTS vaccines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  target_pct DECIMAL(5,2) DEFAULT 95.00,
  category VARCHAR(50) DEFAULT 'Bayi',
  dose_order INT DEFAULT 1,
  age_months INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kids / Balita
CREATE TABLE IF NOT EXISTS kids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(20) DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  birth_date DATE DEFAULT NULL,
  gender ENUM('L','P') DEFAULT NULL,
  mother_name VARCHAR(100) DEFAULT NULL,
  father_name VARCHAR(100) DEFAULT NULL,
  village_id INT DEFAULT NULL,
  village_name VARCHAR(100) DEFAULT NULL,
  district VARCHAR(100) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE SET NULL
);

-- Vaccine targets per village per year
CREATE TABLE IF NOT EXISTS vaccine_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  village_id INT NOT NULL,
  vaccine_code VARCHAR(50) NOT NULL,
  year YEAR NOT NULL,
  target_value INT DEFAULT 0,
  target_bayi_l INT DEFAULT 0,
  target_bayi_p INT DEFAULT 0,
  target_bayi_total INT DEFAULT 0,
  target_surv_l INT DEFAULT 0,
  target_surv_p INT DEFAULT 0,
  target_surv_total INT DEFAULT 0,
  target_baduta_l INT DEFAULT 0,
  target_baduta_p INT DEFAULT 0,
  target_baduta_total INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_village_vaccine_year (village_id, vaccine_code, year),
  FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE
);

-- Monthly realizations
CREATE TABLE IF NOT EXISTS vaccine_realizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  village_id INT DEFAULT NULL,
  village_name VARCHAR(100) DEFAULT NULL,
  puskesmas VARCHAR(100) DEFAULT NULL,
  vaccine_code VARCHAR(50) NOT NULL,
  month VARCHAR(2) NOT NULL,
  year YEAR NOT NULL,
  target_value INT DEFAULT 0,
  realization_value INT DEFAULT 0,
  officer VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE SET NULL
);

-- Vaccine stock / inventory
CREATE TABLE IF NOT EXISTS vaccine_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  puskesmas VARCHAR(100) NOT NULL,
  vaccine_code VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 0,
  min_stock INT DEFAULT 10,
  batch_no VARCHAR(100) DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vaccine distributions
CREATE TABLE IF NOT EXISTS distributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vaccine_code VARCHAR(50) NOT NULL,
  vaccine_name VARCHAR(150) DEFAULT NULL,
  source VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 0,
  batch_no VARCHAR(100) DEFAULT NULL,
  officer VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Kid vaccine records
CREATE TABLE IF NOT EXISTS kid_vaccines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kid_id INT NOT NULL,
  vaccine_code VARCHAR(50) NOT NULL,
  dose_order INT DEFAULT 1,
  date_administered DATE DEFAULT NULL,
  officer VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_kids_village ON kids(village_id);
CREATE INDEX idx_kids_status ON kids(status);
CREATE INDEX idx_targets_village_year ON vaccine_targets(village_id, year);
CREATE INDEX idx_realizations_month_year ON vaccine_realizations(month, year);
CREATE INDEX idx_realizations_village ON vaccine_realizations(village_id);
CREATE INDEX idx_stock_puskesmas ON vaccine_stock(puskesmas);
CREATE INDEX idx_distributions_source ON distributions(source);
CREATE INDEX idx_kid_vaccines_kid ON kid_vaccines(kid_id);
