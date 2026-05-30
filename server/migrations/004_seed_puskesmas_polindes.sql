USE imunisasi;

-- Seed Puskesmas (one per district, matching existing data)
INSERT IGNORE INTO puskesmas (id, name, district_id, address) VALUES
(1, 'Puskesmas Manggar', 1, 'Manggar, Belitung Timur'),
(2, 'Puskesmas Damar', 2, 'Damar, Belitung Timur'),
(3, 'Puskesmas Kelapa Kampit', 3, 'Kelapa Kampit, Belitung Timur'),
(4, 'Puskesmas Gantung', 4, 'Gantung, Belitung Timur'),
(5, 'Puskesmas Simpang Renggiang', 5, 'Simpang Renggiang, Belitung Timur'),
(6, 'Puskesmas Simpang Pesak', 6, 'Simpang Pesak, Belitung Timur'),
(7, 'Puskesmas Dendang', 7, 'Dendang, Belitung Timur');

-- Seed Polindes (at least 1 per village, some villages have 2)
INSERT IGNORE INTO polindes (id, name, puskesmas_id, village_id) VALUES
-- Manggar district (puskesmas_id=1)
(1, 'Polindes Baru', 1, 1),
(2, 'Polindes Kurnia Jaya', 1, 2),
(3, 'Polindes P. Bukulimau', 1, 3),
(4, 'Polindes Lalang', 1, 4),
(5, 'Polindes Lalang Jaya', 1, 5),
(6, 'Polindes Mekar Jaya', 1, 6),
(7, 'Polindes Padang', 1, 7),
(8, 'Polindes Bentaian Jaya', 1, 8),
(9, 'Polindes Kelubi', 1, 9),
(10, 'Polindes Membalong', 1, 36),
(11, 'Polindes Manggar', 1, 37),
(12, 'Polindes Kota Manggar', 1, 38),
(13, 'Polindes Padang Kandis', 1, 39),
-- Damar district (puskesmas_id=2)
(14, 'Polindes Mengkubang', 2, 10),
(15, 'Polindes Damar', 2, 11),
(16, 'Polindes Damar Indah', 2, 12),
(17, 'Polindes Air Kelik', 2, 13),
-- Kelapa Kampit district (puskesmas_id=3)
(18, 'Polindes Batu Penjaga', 3, 14),
(19, 'Polindes Kelapa Kampit', 3, 15),
(20, 'Polindes Senyubuk', 3, 16),
(21, 'Polindes Buding', 3, 17),
-- Gantung district (puskesmas_id=4)
(22, 'Polindes Mayang', 4, 18),
(23, 'Polindes Gantung', 4, 19),
(24, 'Polindes Jangkar Asam', 4, 20),
(25, 'Polindes Selingsing', 4, 21),
(26, 'Polindes Lenggang', 4, 22),
(27, 'Polindes Batu Itam', 4, 23),
(28, 'Polindes Lilangan', 4, 24),
-- Simpang Renggiang district (puskesmas_id=5)
(29, 'Polindes Simpang Renggiang', 5, 25),
(30, 'Polindes Renggiang', 5, 26),
(31, 'Polindes Rantau Panjang', 5, 27),
-- Simpang Pesak district (puskesmas_id=6)
(32, 'Polindes Simpang Pesak', 6, 28),
(33, 'Polindes Tanjung Batu Itam', 6, 29),
(34, 'Polindes Simpang Pesak Kanan', 6, 30),
-- Dendang district (puskesmas_id=7)
(35, 'Polindes Dendang', 7, 31),
(36, 'Polindes Batu Belubang', 7, 32),
(37, 'Polindes Balok', 7, 33),
(38, 'Polindes Air Merbau', 7, 34),
(39, 'Polindes Nyuruk', 7, 35),

-- Additional polindes in larger villages
(40, 'Polindes Lalang 2', 1, 4),
(41, 'Polindes Padang 2', 1, 7),
(42, 'Polindes Gantung 2', 4, 19),
(43, 'Polindes Manggar 2', 1, 37);
