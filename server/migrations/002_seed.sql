-- Seed data for SIMPATIK

USE imunisasi;

-- Districts (7 Kecamatan)
INSERT INTO districts (id, name) VALUES
(1, 'Manggar'),
(2, 'Damar'),
(3, 'Kelapa Kampit'),
(4, 'Gantung'),
(5, 'Simpang Renggiang'),
(6, 'Simpang Pesak'),
(7, 'Dendang');

-- Villages (39 Desa)
INSERT INTO villages (id, name, district_id, puskesmas) VALUES
(1, 'Baru', 1, 'Manggar'),
(2, 'Kurnia Jaya', 1, 'Manggar'),
(3, 'P. Bukulimau', 1, 'Manggar'),
(4, 'Lalang', 1, 'Manggar'),
(5, 'Lalang Jaya', 1, 'Manggar'),
(6, 'Mekar Jaya', 1, 'Manggar'),
(7, 'Padang', 1, 'Manggar'),
(8, 'Bentaian Jaya', 1, 'Manggar'),
(9, 'Kelubi', 1, 'Manggar'),
(10, 'Mengkubang', 2, 'Damar'),
(11, 'Damar', 2, 'Damar'),
(12, 'Damar Indah', 2, 'Damar'),
(13, 'Air Kelik', 2, 'Damar'),
(14, 'Batu Penjaga', 3, 'Kelapa Kampit'),
(15, 'Kelapa Kampit', 3, 'Kelapa Kampit'),
(16, 'Senyubuk', 3, 'Kelapa Kampit'),
(17, 'Buding', 3, 'Kelapa Kampit'),
(18, 'Mayang', 4, 'Gantung'),
(19, 'Gantung', 4, 'Gantung'),
(20, 'Jangkar Asam', 4, 'Gantung'),
(21, 'Selingsing', 4, 'Gantung'),
(22, 'Lenggang', 4, 'Gantung'),
(23, 'Batu Itam', 4, 'Gantung'),
(24, 'Lilangan', 4, 'Gantung'),
(25, 'Simpang Renggiang', 5, 'Simpang Renggiang'),
(26, 'Renggiang', 5, 'Simpang Renggiang'),
(27, 'Rantau Panjang', 5, 'Simpang Renggiang'),
(28, 'Simpang Pesak', 6, 'Simpang Pesak'),
(29, 'Tanjung Batu Itam', 6, 'Simpang Pesak'),
(30, 'Simpang Pesak Kanan', 6, 'Simpang Pesak'),
(31, 'Dendang', 7, 'Dendang'),
(32, 'Batu Belubang', 7, 'Dendang'),
(33, 'Balok', 7, 'Dendang'),
(34, 'Air Merbau', 7, 'Dendang'),
(35, 'Nyuruk', 7, 'Dendang'),

-- Vaccines (20 Jenis)
INSERT INTO vaccines (id, code, name, target_pct, category, dose_order, age_months) VALUES
(1, 'HB0', 'HB0', 95, 'Bayi', 1, 0),
(2, 'BCG', 'BCG', 95, 'Bayi', 1, 1),
(3, 'POLIO1', 'POLIO1', 95, 'Bayi', 1, 1),
(4, 'DPT-HB-Hib1', 'DPT/HB/Hib (1)', 95, 'Bayi', 1, 2),
(5, 'POLIO2', 'POLIO2', 95, 'Bayi', 2, 2),
(6, 'PCV1', 'PCV (1)', 95, 'Bayi', 1, 2),
(7, 'DPT-HB-Hib2', 'DPT/HB/Hib (2)', 95, 'Bayi', 2, 3),
(8, 'POLIO3', 'POLIO3', 95, 'Bayi', 3, 3),
(9, 'PCV2', 'PCV (2)', 95, 'Bayi', 2, 4),
(10, 'DPT-HB-Hib3', 'DPT/HB/Hib (3)', 95, 'Bayi', 3, 4),
(11, 'POLIO4', 'POLIO4', 95, 'Bayi', 4, 4),
(12, 'MR', 'CAMPAK-RUBELA (MR)', 95, 'Bayi', 1, 9),
(13, 'JEV', 'JEV', 95, 'Bayi', 1, 10),
(14, 'DO_DPT123', 'DO DPT/HB/Hib (1)-(3)', 95, 'Bayi', 1, NULL),
(15, 'DO_DPT1_MR', 'DO DPT/HB/Hib (1)-CAMPAK-RUBELA (MR)', 95, 'Bayi', 1, NULL),
(16, 'TT2_BUMIL', 'TT2+ (BUMIL)', 95, 'Ibu Hamil', 1, NULL),
(17, 'PCV_BADUTA', 'PCV BADUTA', 95, 'Baduta', 3, 18),
(18, 'DPT_BADUTA', 'DPT/HB/Hib BADUTA', 95, 'Baduta', 4, 18),
(19, 'MR_BADUTA', 'CAMPAK-RUBELA (MR) BADUTA', 95, 'Baduta', 2, 24),
(20, 'IPV1', 'IPV1', 95, 'Bayi', 1, 4);
(20, 'IPV2', 'IPV2', 95, 'Bayi', 2, 24);
