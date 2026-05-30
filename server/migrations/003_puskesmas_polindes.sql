USE imunisasi;

-- Puskesmas table
CREATE TABLE IF NOT EXISTS puskesmas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  district_id INT NOT NULL,
  address TEXT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  head_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_puskesmas_name_district (name, district_id)
);

-- Polindes table (Pondok Bersalin Desa)
CREATE TABLE IF NOT EXISTS polindes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  puskesmas_id INT NOT NULL,
  village_id INT NOT NULL,
  address TEXT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  head_name VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE
);

-- Add polindes_id to users (for bidan/petugas role)
ALTER TABLE users
  ADD COLUMN polindes_id INT DEFAULT NULL AFTER puskesmas,
  ADD COLUMN puskesmas_id INT DEFAULT NULL AFTER role,
  ADD FOREIGN KEY (polindes_id) REFERENCES polindes(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE SET NULL;

-- Add polindes_id to kids
ALTER TABLE kids
  ADD COLUMN polindes_id INT DEFAULT NULL AFTER village_id,
  ADD COLUMN polindes_name VARCHAR(100) DEFAULT NULL AFTER village_name,
  ADD FOREIGN KEY (polindes_id) REFERENCES polindes(id) ON DELETE SET NULL;

-- Add polindes_id to vaccine_realizations
ALTER TABLE vaccine_realizations
  ADD COLUMN polindes_id INT DEFAULT NULL AFTER puskesmas,
  ADD COLUMN polindes_name VARCHAR(100) DEFAULT NULL AFTER village_name,
  ADD FOREIGN KEY (polindes_id) REFERENCES polindes(id) ON DELETE SET NULL;

-- Add polindes_id to vaccine_stock
ALTER TABLE vaccine_stock
  ADD COLUMN polindes_id INT DEFAULT NULL AFTER puskesmas,
  ADD COLUMN polindes_name VARCHAR(100) DEFAULT NULL,
  ADD FOREIGN KEY (polindes_id) REFERENCES polindes(id) ON DELETE SET NULL;

-- Add polindes_id to distributions
ALTER TABLE distributions
  ADD COLUMN polindes_id INT DEFAULT NULL AFTER destination,
  ADD COLUMN polindes_name VARCHAR(100) DEFAULT NULL,
  ADD FOREIGN KEY (polindes_id) REFERENCES polindes(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_puskesmas_district ON puskesmas(district_id);
CREATE INDEX idx_polindes_puskesmas ON polindes(puskesmas_id);
CREATE INDEX idx_polindes_village ON polindes(village_id);
CREATE INDEX idx_users_polindes ON users(polindes_id);
CREATE INDEX idx_kids_polindes ON kids(polindes_id);
CREATE INDEX idx_realizations_polindes ON vaccine_realizations(polindes_id);
CREATE INDEX idx_stock_polindes ON vaccine_stock(polindes_id);
