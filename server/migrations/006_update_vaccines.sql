-- Replace all vaccine data with the approved list
DELETE FROM vaccines;
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
