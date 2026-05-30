import { createConnection } from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const db = await createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'imunisasi'
})

console.log('Connected to database')

const [villages] = await db.query('SELECT id, name, puskesmas, district_id FROM villages')
const villageById = {}
villages.forEach(v => { villageById[v.id] = v })

// Kids data: name, village_id, birth_date, gender
const kidsData = [
  // Puskesmas Manggar (village_id 1-9)
  { name: 'Ani',   village_id: 1, birth_date: '2026-05-15', gender: 'P' },
  { name: 'Budi',  village_id: 2, birth_date: '2026-04-10', gender: 'L' },
  { name: 'Citra', village_id: 4, birth_date: '2026-03-05', gender: 'P' },
  { name: 'Dedi',  village_id: 5, birth_date: '2026-01-20', gender: 'L' },
  { name: 'Euis',  village_id: 7, birth_date: '2025-08-10', gender: 'P' },
  // Puskesmas Damar
  { name: 'Fajar', village_id: 10, birth_date: '2026-05-01', gender: 'L' },
  { name: 'Gita',  village_id: 11, birth_date: '2026-03-15', gender: 'P' },
  { name: 'Hadi',  village_id: 12, birth_date: '2025-11-20', gender: 'L' },
  // Puskesmas Kelapa Kampit
  { name: 'Intan', village_id: 15, birth_date: '2026-04-25', gender: 'P' },
  { name: 'Joko',  village_id: 16, birth_date: '2025-09-15', gender: 'L' },
  // Puskesmas Gantung
  { name: 'Kiki',  village_id: 19, birth_date: '2026-05-10', gender: 'P' },
  { name: 'Lala',  village_id: 20, birth_date: '2026-02-01', gender: 'P' },
  // Puskesmas Dendang
  { name: 'Mimi',  village_id: 31, birth_date: '2026-03-28', gender: 'P' },
  { name: 'Nino',  village_id: 32, birth_date: '2025-07-01', gender: 'L' },
]

console.log(`Inserting ${kidsData.length} kids...`)
const kidIds = []
for (const k of kidsData) {
  const vil = villageById[k.village_id]
  const nik = 'SIM' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 100)).padStart(2, '0')
  const [res] = await db.query(
    `INSERT INTO kids (name, nik, birth_date, gender, mother_name, father_name, village_id, village_name, district, address, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, NOW())`,
    [k.name, nik, k.birth_date, k.gender,
     'Ibu ' + k.name, 'Ayah ' + k.name,
     k.village_id, vil ? vil.name : 'Unknown', vil ? (vil.district_id + '') : '0', 'Alamat ' + k.name]
  )
  kidIds.push(res.insertId)
}
console.log(`Inserted ${kidIds.length} kids`)

// kid_vaccines — last month (April 2026) + this month (May 2026)
const vaccinations = [
  // === LAST MONTH: April 2026 ===
  // Ani (idx 0, born May 15 2026) — too young in Apr, skip
  // Budi (idx 1, born Apr 10 2026) — 0-1 month in Apr
  { kid_idx: 1, vaccine_code: 'BCG',    dose: 1, date: '2026-04-25' },
  { kid_idx: 1, vaccine_code: 'POLIO1', dose: 1, date: '2026-04-25' },
  // Citra (idx 2, born Mar 5 2026) — 1-2 months in Apr
  { kid_idx: 2, vaccine_code: 'DPT-HB-Hib1', dose: 1, date: '2026-04-10' },
  { kid_idx: 2, vaccine_code: 'POLIO2',       dose: 2, date: '2026-04-10' },
  { kid_idx: 2, vaccine_code: 'PCV1',         dose: 1, date: '2026-04-10' },
  // Dedi (idx 3, born Jan 20 2026) — 2-3 months in Apr
  { kid_idx: 3, vaccine_code: 'IPV1',    dose: 1, date: '2026-04-20' },
  { kid_idx: 3, vaccine_code: 'PCV2',    dose: 2, date: '2026-04-20' },
  { kid_idx: 3, vaccine_code: 'DPT-HB-Hib3', dose: 3, date: '2026-04-20' },
  // Euis (idx 4, born Aug 10 2025) — 8 months in Apr
  { kid_idx: 4, vaccine_code: 'MR', dose: 1, date: '2026-04-25' },
  // Fajar (idx 5, born May 1 2026) — skip (born end of Apr)
  // Gita (idx 6, born Mar 15 2026) — 1 month in Apr
  { kid_idx: 6, vaccine_code: 'BCG',    dose: 1, date: '2026-04-28' },
  { kid_idx: 6, vaccine_code: 'POLIO1', dose: 1, date: '2026-04-28' },
  // Intan (idx 8, born Apr 25 2026) — skip (just born)
  // Kiki (idx 10, born May 10 2026) — skip (not born yet)
  // Lala (idx 11, born Feb 1 2026) — 2 months in Apr
  { kid_idx: 11, vaccine_code: 'DPT-HB-Hib2', dose: 2, date: '2026-04-15' },
  { kid_idx: 11, vaccine_code: 'POLIO3',       dose: 3, date: '2026-04-15' },
  // Mimi (idx 12, born Mar 28 2026) — ~1 month in Apr
  { kid_idx: 12, vaccine_code: 'BCG',    dose: 1, date: '2026-04-28' },
  // Nino (idx 13, born Jul 1 2025) — 9 months in Apr
  { kid_idx: 13, vaccine_code: 'MR', dose: 1, date: '2026-04-25' },
]

console.log(`Inserting ${vaccinations.length} vaccination records...`)
for (const v of vaccinations) {
  await db.query(
    `INSERT INTO kid_vaccines (kid_id, vaccine_code, dose_order, date_administered, officer, notes, created_at)
     VALUES (?, ?, ?, ?, 'Petugas Test', 'Data sample', NOW())`,
    [kidIds[v.kid_idx], v.vaccine_code, v.dose, v.date]
  )
}

console.log('\n=== Selesai! ===')
console.log(`${kidsData.length} kids baru ditambahkan`)
console.log(`${vaccinations.length} riwayat vaksinasi ditambahkan`)

await db.end()
