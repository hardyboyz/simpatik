import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Report 1: LAPORAN BULANAN HASIL IMUNISASI RUTIN BAYI PUSKESMAS
// Chain: kid_vaccines → kids → demographics → villages → puskesmas
router.get('/bulanan-bayi', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()

    const [[vaccineList], [realisasi], [demografi]] = await Promise.all([
      // Daftar vaksin bayi
      pool.query(`
        SELECT code, name as vaccine_name, dose_order, age_months
        FROM vaccines WHERE category = 'Bayi'
        ORDER BY dose_order
      `),

      // Realisasi per puskesmas per vaksin dari kid_vaccines
      // Chain: kid_vaccines.kid_id → kids.id → kids.village_id → demographics.village_id → villages.id → villages.puskesmas
      pool.query(`
        SELECT COALESCE(v.puskesmas, '-') as puskesmas, kv.vaccine_code,
               COUNT(DISTINCT kv.kid_id) as total_real
        FROM kid_vaccines kv
        JOIN kids k ON kv.kid_id = k.id
        JOIN demographics d ON k.village_id = d.village_id AND d.year = ?
        JOIN villages v ON d.village_id = v.id
        WHERE MONTH(kv.date_administered) = ? AND YEAR(kv.date_administered) = ?
        GROUP BY v.puskesmas, kv.vaccine_code
      `, [String(y), m, String(y)]),

      // Demografi per puskesmas (target)
      pool.query(`
        SELECT COALESCE(v.puskesmas, '-') as puskesmas,
               COUNT(DISTINCT v.id) as village_count,
               GROUP_CONCAT(DISTINCT v.name ORDER BY v.name SEPARATOR ', ') as village_names,
               COALESCE(SUM(d.baby_l), 0) as baby_l,
               COALESCE(SUM(d.baby_p), 0) as baby_p,
               COALESCE(SUM(d.baby_total), 0) as baby_total,
               COALESCE(SUM(d.infant_total), 0) as infant_total,
               COALESCE(SUM(d.baduta_total), 0) as baduta_total
        FROM villages v
        LEFT JOIN demographics d ON d.village_id = v.id AND d.year = ?
        GROUP BY v.puskesmas
        ORDER BY v.puskesmas
      `, [String(y)])
    ])

    const realMap = {}
    realisasi.forEach(r => {
      realMap[r.puskesmas + '|' + r.vaccine_code] = Number(r.total_real)
    })

    const rows = []
    demografi.forEach(p => {
      const bTarget = Number(p.baby_total)
      vaccineList.forEach(v => {
        const real = realMap[p.puskesmas + '|' + v.code] || 0
        rows.push({
          puskesmas: p.puskesmas,
          village_count: Number(p.village_count),
          village_names: p.village_names || '',
          baby_l: Number(p.baby_l),
          baby_p: Number(p.baby_p),
          baby_total: bTarget,
          infant_total: Number(p.infant_total),
          baduta_total: Number(p.baduta_total),
          vaccine_code: v.code,
          vaccine_name: v.vaccine_name,
          dose_order: v.dose_order,
          total_target: bTarget,
          total_real: real,
          pct: bTarget > 0 ? Math.round((real / bTarget) * 100 * 10) / 10 : 0
        })
      })
    })

    res.json({ month: m, year: y, data: rows, demografi })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 2: LAPORAN HASIL IMUNISASI RUTIN BAYI UNTUK LUAR WILAYAH PUSKESMAS
router.get('/luar-wilayah', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    const [rows] = await pool.query(`
      SELECT vr.*, vac.name as vaccine_name, v.name as village_name,
             v.puskesmas as village_puskesmas,
             d.name as district_name
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      LEFT JOIN districts d ON v.district_id = d.id
      WHERE vr.month = ? AND vr.year = ? AND vac.category = 'Bayi'
        AND vr.puskesmas != COALESCE(v.puskesmas, '')
        AND vr.puskesmas IS NOT NULL
      ORDER BY vr.puskesmas, v.name
    `, [m, String(y)])
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 3: TABEL ANALISA BULANAN PEMANTAUAN WILAYAH SETEMPAT (PWS)
router.get('/analisa-pws', authenticate, async (req, res) => {
  try {
    const { month, year, puskesmas } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    let sql = `
      SELECT vr.village_name, v.puskesmas,
             SUM(CASE WHEN vac.code IN ('HB0','BCG','POLIO1','POLIO2','POLIO3','POLIO4','DPT-HB-Hib1','DPT-HB-Hib2','DPT-HB-Hib3','MR') THEN vr.realization_value ELSE 0 END) as complete_vaccinated,
             SUM(CASE WHEN vac.code IN ('HB0','BCG','POLIO1','POLIO2','POLIO3','POLIO4','DPT-HB-Hib1','DPT-HB-Hib2','DPT-HB-Hib3','MR') THEN vr.target_value ELSE 0 END) as complete_target,
             COUNT(DISTINCT vr.vaccine_code) as vaccine_count,
             ROUND(AVG(vr.realization_value / NULLIF(vr.target_value, 0) * 100), 1) as avg_pct
      FROM vaccine_realizations vr
      LEFT JOIN villages v ON vr.village_id = v.id
      LEFT JOIN vaccines vac ON vr.vaccine_code = vac.code
      WHERE vr.month = ? AND vr.year = ? AND vac.category = 'Bayi'
    `
    const params = [m, String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    sql += ` GROUP BY vr.village_name, v.puskesmas ORDER BY v.puskesmas, vr.village_name`
    const [rows] = await pool.query(sql, params)
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 4: LAPORAN HASIL IMUNISASI RUTIN BAYI PUSKESMAS (KUMULATIF)
router.get('/kumulatif-bayi', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    const [rows] = await pool.query(`
      SELECT p.id as puskesmas_id, p.name as puskesmas,
             vr.vaccine_code, vac.name as vaccine_name, vac.dose_order,
             SUM(vr.target_value) as total_target,
             SUM(vr.realization_value) as total_real,
             ROUND(SUM(vr.realization_value) / NULLIF(SUM(vr.target_value), 0) * 100, 1) as pct
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      LEFT JOIN puskesmas p ON v.puskesmas = p.name
      WHERE CAST(vr.month AS UNSIGNED) <= CAST(? AS UNSIGNED) AND vr.year = ? AND vac.category = 'Bayi'
      GROUP BY p.id, p.name, vr.vaccine_code, vac.name, vac.dose_order
      ORDER BY p.name, vac.dose_order
    `, [m, String(y)])
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 5: LAPORAN RENCANA TINDAK LANJUT PWS
router.get('/rencana-tindak-lanjut', authenticate, async (req, res) => {
  try {
    const { month, year, puskesmas } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    let sql = `
      SELECT vr.village_name, v.puskesmas, vr.vaccine_code, vac.name as vaccine_name,
             vr.target_value, vr.realization_value,
             ROUND(vr.realization_value / NULLIF(vr.target_value, 0) * 100, 1) as pct,
             (vr.target_value - vr.realization_value) as gap,
             CASE WHEN vr.realization_value >= vr.target_value THEN 'Tercapai'
                  WHEN vr.realization_value >= vr.target_value * 0.8 THEN 'Kurang'
                  ELSE 'Tidak Tercapai' END as status,
             d.name as district_name
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      LEFT JOIN districts d ON v.district_id = d.id
      WHERE vr.month = ? AND vr.year = ? AND vac.category = 'Bayi'
        AND vr.realization_value < vr.target_value
    `
    const params = [m, String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    sql += ` ORDER BY gap DESC`
    const [rows] = await pool.query(sql, params)
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 6: LAPORAN TABEL PEMATAUAN DESA MENUJU UCI DI PUSKESMAS
router.get('/pemantauan-uci', authenticate, async (req, res) => {
  try {
    const { year, puskesmas } = req.query
    const y = year || new Date().getFullYear()
    const latestMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    let sql = `
      SELECT vr.village_id, vr.village_name, v.puskesmas, d.name as district_name,
             SUM(vr.target_value) as total_target,
             SUM(vr.realization_value) as total_real,
             ROUND(SUM(vr.realization_value) / NULLIF(SUM(vr.target_value), 0) * 100, 1) as pct,
             COUNT(DISTINCT CASE WHEN vr.realization_value >= vr.target_value THEN vr.vaccine_code END) as vaccines_achieved,
             COUNT(DISTINCT vr.vaccine_code) as total_vaccines
      FROM vaccine_realizations vr
      LEFT JOIN villages v ON vr.village_id = v.id
      LEFT JOIN districts d ON v.district_id = d.id
      LEFT JOIN vaccines vac ON vr.vaccine_code = vac.code
      WHERE vr.year = ? AND vac.category = 'Bayi'
    `
    const params = [String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    sql += ` GROUP BY vr.village_id, vr.village_name, v.puskesmas, d.name ORDER BY v.puskesmas, vr.village_name`
    const [rows] = await pool.query(sql, params)
    res.json({ year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 7: MONITORING DESA MENUJU UCI PER PUSKESMAS DI KABUPATEN
router.get('/monitoring-uci', authenticate, async (req, res) => {
  try {
    const { year } = req.query
    const y = year || new Date().getFullYear()
    const [rows] = await pool.query(`
      SELECT p.id as puskesmas_id, p.name as puskesmas, d.name as district_name,
             COUNT(DISTINCT v.id) as total_villages,
             COUNT(DISTINCT CASE WHEN vw.uci_status = 'UCI' THEN vw.village_id END) as uci_villages,
             COUNT(DISTINCT CASE WHEN vw.uci_status IS NOT NULL AND vw.uci_status != 'UCI' THEN vw.village_id END) as non_uci_villages,
             ROUND(COUNT(DISTINCT CASE WHEN vw.uci_status = 'UCI' THEN vw.village_id END) / NULLIF(COUNT(DISTINCT v.id), 0) * 100, 1) as uci_pct
      FROM puskesmas p
      JOIN districts d ON p.district_id = d.id
      LEFT JOIN villages v ON v.puskesmas = p.name
      LEFT JOIN (
        SELECT vr.village_id,
               CASE WHEN SUM(CASE WHEN vr.realization_value >= vr.target_value THEN 1 ELSE 0 END) >= COUNT(DISTINCT vr.vaccine_code) * 0.8 THEN 'UCI' ELSE 'Belum UCI' END as uci_status
        FROM vaccine_realizations vr
        JOIN vaccines vac ON vr.vaccine_code = vac.code
        WHERE vr.year = ? AND vac.category = 'Bayi'
        GROUP BY vr.village_id
      ) vw ON v.id = vw.village_id
      GROUP BY p.id, p.name, d.name
      ORDER BY p.name
    `, [String(y)])
    res.json({ year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 8: REKAPITULASI IMUNISASI T IBU HAMIL DAN WUS DI PUSKESMAS
router.get('/rekapitulasi-ibu-hamil', authenticate, async (req, res) => {
  try {
    const { year, puskesmas } = req.query
    const y = year || new Date().getFullYear()
    let sql = `
      SELECT v.puskesmas, vr.vaccine_code, vac.name as vaccine_name,
             SUM(vr.target_value) as total_target,
             SUM(vr.realization_value) as total_real,
             ROUND(SUM(vr.realization_value) / NULLIF(SUM(vr.target_value), 0) * 100, 1) as pct
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      WHERE vr.year = ? AND vac.category IN ('Ibu Hamil')
      GROUP BY v.puskesmas, vr.vaccine_code, vac.name
      ORDER BY v.puskesmas, vac.name
    `
    const params = [String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    const [rows] = await pool.query(sql, params)
    res.json({ year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 9: LAPORAN BULANAN HASIL IMUNISASI T IBU HAMIL DAN WUS PUSKESMAS
router.get('/bulanan-ibu-hamil', authenticate, async (req, res) => {
  try {
    const { month, year, puskesmas } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    let sql = `
      SELECT vr.village_name, v.puskesmas, vr.vaccine_code, vac.name as vaccine_name,
             vr.target_value, vr.realization_value,
             ROUND(vr.realization_value / NULLIF(vr.target_value, 0) * 100, 1) as pct
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      WHERE vr.month = ? AND vr.year = ? AND vac.category IN ('Ibu Hamil')
    `
    const params = [m, String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    sql += ` ORDER BY v.puskesmas, vr.village_name, vac.name`
    const [rows] = await pool.query(sql, params)
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 10: LAPORAN KUMULATIF HASIL IMUNISASI T IBU HAMIL DAN WUS PUSKESMAS
router.get('/kumulatif-ibu-hamil', authenticate, async (req, res) => {
  try {
    const { month, year, puskesmas } = req.query
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0')
    const y = year || new Date().getFullYear()
    let sql = `
      SELECT v.puskesmas, vr.vaccine_code, vac.name as vaccine_name,
             SUM(vr.target_value) as total_target,
             SUM(vr.realization_value) as total_real,
             ROUND(SUM(vr.realization_value) / NULLIF(SUM(vr.target_value), 0) * 100, 1) as pct
      FROM vaccine_realizations vr
      JOIN vaccines vac ON vr.vaccine_code = vac.code
      LEFT JOIN villages v ON vr.village_id = v.id
      WHERE CAST(vr.month AS UNSIGNED) <= CAST(? AS UNSIGNED) AND vr.year = ? AND vac.category IN ('Ibu Hamil')
    `
    const params = [m, String(y)]
    if (puskesmas) {
      sql += ` AND v.puskesmas = ?`
      params.push(puskesmas)
    }
    sql += ` GROUP BY v.puskesmas, vr.vaccine_code, vac.name ORDER BY v.puskesmas, vac.name`
    const [rows] = await pool.query(sql, params)
    res.json({ month: m, year: y, data: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Report 11: KEBUTUHAN VAKSIN PER PUSKESMAS
// Menampilkan per puskesmas & per vaksin:
//   - last_month_real  = realisasi bulan lalu (dari kid_vaccines)
//   - this_month_need   = anak yang perlu vaksin bulan ini (age >= age_months minus sudah divaksin)
//   - total_kids        = semua anak di puskesmas
//   - already_received  = total yang sudah pernah divaksin (akumulasi)
router.get('/kebutuhan-vaksin', authenticate, async (req, res) => {
  try {
    const now = new Date()
    const thisMonth = String(now.getMonth() + 1).padStart(2, '0')
    const thisYear = String(now.getFullYear())
    const lastMonth = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')
    const lastYear = String(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())

    const [ps] = await pool.query(`SELECT DISTINCT v.puskesmas FROM villages v WHERE v.puskesmas IS NOT NULL AND v.puskesmas != '' ORDER BY v.puskesmas`)
    const puskesmasList = ps.map(p => p.puskesmas)

    const [vaccines] = await pool.query(`
      SELECT code, name as vaccine_name, age_months, dose_order
      FROM vaccines WHERE category = 'Bayi' AND age_months IS NOT NULL
      ORDER BY dose_order
    `)

    // For each puskesmas, run aggregate queries
    const data = []
    for (const puskesmas of puskesmasList) {
      // Total kids in this puskesmas
      const [[{ totalKids }]] = await pool.query(`
        SELECT COUNT(DISTINCT k.id) as totalKids
        FROM kids k
        JOIN villages v ON k.village_id = v.id
        WHERE v.puskesmas = ? AND k.birth_date <= CURDATE()
      `, [puskesmas])

      for (const vac of vaccines) {
        // Last month's realisasi for this puskesmas + vaccine
        const [[{ lastMonthReal }]] = await pool.query(`
          SELECT COUNT(DISTINCT kv.kid_id) as lastMonthReal
          FROM kid_vaccines kv
          JOIN kids k ON kv.kid_id = k.id
          JOIN villages v ON k.village_id = v.id
          WHERE v.puskesmas = ?
            AND kv.vaccine_code = ?
            AND MONTH(kv.date_administered) = ?
            AND YEAR(kv.date_administered) = ?
        `, [puskesmas, vac.code, lastMonth, lastYear])

        // Total already received (all time) for this puskesmas + vaccine
        const [[{ alreadyReceived }]] = await pool.query(`
          SELECT COUNT(DISTINCT kv.kid_id) as alreadyReceived
          FROM kid_vaccines kv
          JOIN kids k ON kv.kid_id = k.id
          JOIN villages v ON k.village_id = v.id
          WHERE v.puskesmas = ? AND kv.vaccine_code = ?
        `, [puskesmas, vac.code])

        // Kids who are eligible NOW (age >= age_months) for this puskesmas
        const [[{ eligibleNow }]] = await pool.query(`
          SELECT COUNT(DISTINCT k.id) as eligibleNow
          FROM kids k
          JOIN villages v ON k.village_id = v.id
          WHERE v.puskesmas = ?
            AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= ?
            AND k.birth_date <= CURDATE()
        `, [puskesmas, vac.age_months])

        const needNow = Math.max(0, Number(eligibleNow) - Number(alreadyReceived))

        data.push({
          puskesmas,
          vaccine_code: vac.code,
          vaccine_name: vac.vaccine_name,
          age_months: vac.age_months,
          dose_order: vac.dose_order,
          total_kids: Number(totalKids),
          last_month_real: Number(lastMonthReal),
          already_received: Number(alreadyReceived),
          this_month_need: needNow,
          need_upcoming: Math.max(0, Number(totalKids) - Number(alreadyReceived) - needNow),
          need_total: Math.max(0, Number(totalKids) - Number(alreadyReceived))
        })
      }
    }

    res.json({ puskesmas: puskesmasList, vaccines, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
