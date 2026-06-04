import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { runMonthlyReminder } from '../scheduler/monthlyReminder.js'

const FONNTE_TOKEN = process.env.FONNTE_TOKEN || ''

const router = Router()

// ── 1. DASHBOARD E-KOHORT ──────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { puskesmas, district_id } = req.query
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')

    const needVillageJoin = district_id || puskesmas
    const joins = needVillageJoin ? ' JOIN villages v ON k.village_id = v.id' : ''
    const joins2 = needVillageJoin
      ? ' JOIN villages v2 ON k.village_id = v2.id'
      : ''
    let scopeSql = ''
    const scopeParams = []
    if (puskesmas) { scopeSql = ' AND v.puskesmas = ?'; scopeParams.push(puskesmas) }
    if (district_id) { scopeSql += ' AND v.district_id = ?'; scopeParams.push(district_id) }

    const [[totalSasaran]] = await pool.query(`
      SELECT COUNT(*) as total FROM kids k${joins}
      WHERE YEAR(k.birth_date) BETWEEN ? AND ? ${scopeSql}
    `, [year - 1, year, ...scopeParams])

    const [[lengkap]] = await pool.query(`
      SELECT COUNT(*) as total FROM kids k${joins}
      WHERE k.status = 'completed' ${scopeSql}
    `, [...scopeParams])

    const [[dropOut]] = await pool.query(`
      SELECT COUNT(*) as total FROM kids k${joins}
      WHERE k.status = 'pending' AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= 12 ${scopeSql}
    `, [...scopeParams])

    const [mapData] = await pool.query(`
      SELECT v.id, v.name as village_name,
        COUNT(k.id) as total_kids,
        SUM(CASE WHEN k.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN k.status = 'pending' THEN 1 ELSE 0 END) as pending,
        CASE
          WHEN SUM(CASE WHEN k.status = 'pending' THEN 1 ELSE 0 END) > 0 AND
               SUM(CASE WHEN k.status = 'pending' THEN 1 ELSE 0 END) >= COUNT(k.id) * 0.2 THEN 'merah'
          WHEN SUM(CASE WHEN k.status = 'pending' THEN 1 ELSE 0 END) > 0 THEN 'kuning'
          ELSE 'hijau'
        END as status_color
      FROM villages v
      LEFT JOIN kids k ON k.village_id = v.id
      WHERE 1=1 ${scopeSql}
      GROUP BY v.id, v.name
      ORDER BY v.name
    `, [...scopeParams])

    const [chartTargetRealisasi] = await pool.query(`
      SELECT vac.code, vac.name, vac.target_pct,
        COALESCE(SUM(CASE WHEN kv.id IS NOT NULL THEN 1 ELSE 0 END), 0) as real_count,
        COALESCE(t.target_value, 0) as target_count
      FROM vaccines vac
      LEFT JOIN kid_vaccines kv ON kv.vaccine_code = vac.code
        AND MONTH(kv.date_administered) = ? AND YEAR(kv.date_administered) = ?
      LEFT JOIN vaccine_targets t ON t.vaccine_code = vac.code AND t.year = ?
      WHERE vac.category = 'Bayi'
      GROUP BY vac.code, vac.name, vac.target_pct, t.target_value
      ORDER BY vac.id
    `, [month, String(year), String(year)])

    const [recentDropOut] = await pool.query(`
      SELECT k.id, k.name, k.nik, k.mother_name, k.village_name, k.address,
        k.phone, TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) as age_months,
        COALESCE(
          (SELECT MAX(kv.date_administered) FROM kid_vaccines kv WHERE kv.kid_id = k.id), '-'
        ) as last_vaccine_date
      FROM kids k${joins}
      WHERE k.status = 'pending'
        AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= 12
        ${scopeSql}
      ORDER BY k.updated_at DESC LIMIT 5
    `, [...scopeParams])

    const [growthNutrition] = await pool.query(`
      SELECT v.name as village_name,
        COUNT(gr.id) as total,
        SUM(CASE WHEN gr.nutritional_status IS NULL OR gr.nutritional_status = '' THEN 1 ELSE 0 END) as normal,
        SUM(CASE WHEN gr.nutritional_status IN ('gizi-kurang','stunting','overweight') THEN 1 ELSE 0 END) as perhatian,
        SUM(CASE WHEN gr.nutritional_status = 'gizi-buruk' THEN 1 ELSE 0 END) as bahaya
      FROM growth_records gr
      JOIN kids k ON gr.kid_id = k.id
      JOIN villages v ON k.village_id = v.id
      WHERE 1=1 ${scopeSql}
      GROUP BY v.id, v.name
      ORDER BY v.name
    `, [...scopeParams])

    res.json({
      totalSasaran: totalSasaran.total,
      imunisasiLengkap: lengkap.total,
      dropOut: dropOut.total,
      mapData,
      chartData: chartTargetRealisasi,
      recentDropOut,
      growthNutrition
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/dashboard/growth-nutrition', authenticate, async (req, res) => {
  try {
    const { district_id, month, year } = req.query
    const params = []
    let monthSql = ''
    if (month && year) {
      monthSql = 'WHERE MONTH(g2.date_measured) = ? AND YEAR(g2.date_measured) = ?'
      params.push(month, year)
    }
    let districtSql = ''
    if (district_id) {
      districtSql = ' WHERE v.district_id = ?'
      params.push(district_id)
    }

    const [rows] = await pool.query(`
      SELECT v.name as village_name,
        COUNT(DISTINCT lr.kid_id) as total,
        COUNT(DISTINCT CASE WHEN COALESCE(lr.nutritional_status, '') = '' THEN lr.kid_id END) as normal,
        COUNT(DISTINCT CASE WHEN lr.nutritional_status IN ('gizi-kurang','stunting','overweight') THEN lr.kid_id END) as perhatian,
        COUNT(DISTINCT CASE WHEN lr.nutritional_status = 'gizi-buruk' THEN lr.kid_id END) as bahaya
      FROM villages v
      LEFT JOIN (
        SELECT gr.kid_id, gr.nutritional_status, k.village_id
        FROM growth_records gr
        JOIN kids k ON gr.kid_id = k.id
        WHERE gr.id IN (
          SELECT MAX(g2.id)
          FROM growth_records g2
          ${monthSql}
          GROUP BY g2.kid_id
        )
      ) lr ON v.id = lr.village_id
      ${districtSql}
      GROUP BY v.id, v.name
      ORDER BY v.name
    `, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 2. KMS DIGITAL - SEARCH ──────────────────────────────────────
router.get('/kms/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])
    const [rows] = await pool.query(`
      SELECT id, nik, name, birth_date, gender, mother_name, father_name,
        village_name, address, phone, status
      FROM kids
      WHERE name LIKE ? OR mother_name LIKE ? OR nik LIKE ?
      ORDER BY name LIMIT 20
    `, [`%${q}%`, `%${q}%`, `%${q}%`])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 2b. KMS DIGITAL - DETAIL + GROWTH + STATUS ───────────────────
router.get('/kms/:id', authenticate, async (req, res) => {
  try {
    const [kidRows] = await pool.query('SELECT * FROM kids WHERE id = ?', [req.params.id])
    if (!kidRows.length) return res.status(404).json({ error: 'Not found' })
    const kid = kidRows[0]

    const [vaccineHistory] = await pool.query(`
      SELECT kv.*, vac.name as vaccine_name
      FROM kid_vaccines kv
      JOIN vaccines vac ON kv.vaccine_code = vac.code
      WHERE kv.kid_id = ?
      ORDER BY kv.date_administered
    `, [req.params.id])

    const [growthRecords] = await pool.query(`
      SELECT * FROM growth_records WHERE kid_id = ? ORDER BY date_measured
    `, [req.params.id])

    const [vaccineSchedule] = await pool.query(`
      SELECT code, name, dose_order, age_months, target_pct
      FROM vaccines WHERE category = 'Bayi' ORDER BY dose_order
    `)

    const completedCodes = new Set(vaccineHistory.map(v => v.vaccine_code))
    const scheduleWithStatus = vaccineSchedule.map(v => ({
      ...v,
      completed: completedCodes.has(v.code),
      date_administered: vaccineHistory.find(h => h.vaccine_code === v.code)?.date_administered || null
    }))

    res.json({ kid, vaccineHistory, growthRecords, vaccineSchedule: scheduleWithStatus })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 2c. KMS DIGITAL - ADD GROWTH RECORD ──────────────────────────
router.post('/kms/:id/growth', authenticate, async (req, res) => {
  try {
    const { weight, height, date_measured, head_circumference, nutritional_status, notes } = req.body
    const [result] = await pool.query(
      `INSERT INTO growth_records (kid_id, weight, height, head_circumference, date_measured, nutritional_status, notes, recorded_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.params.id, weight || null, height || null, head_circumference || null,
       date_measured || new Date(), nutritional_status || null, notes || null, req.user.id]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/kms/growth/:id', authenticate, async (req, res) => {
  try {
    const { weight, height, date_measured, head_circumference, nutritional_status, notes } = req.body
    await pool.query(
      `UPDATE growth_records SET weight=?, height=?, head_circumference=?, date_measured=?, nutritional_status=?, notes=? WHERE id=?`,
      [weight || null, height || null, head_circumference || null,
       date_measured || new Date(), nutritional_status || null, notes || null, req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/kms/growth/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM growth_records WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 3. PELAYANAN HARI INI - QUEUE ────────────────────────────────
router.get('/queue/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [rows] = await pool.query(`
      SELECT q.*, k.name as kid_name, k.nik, k.birth_date, k.mother_name, k.village_name
      FROM vaccine_queue q
      JOIN kids k ON q.kid_id = k.id
      WHERE DATE(q.created_at) = ?
      ORDER BY q.queue_number
    `, [today])

    const enriched = await Promise.all(rows.map(async (r) => {
      const [vaccines] = await pool.query(
        `SELECT DISTINCT vaccine_code FROM kid_vaccines WHERE kid_id = ?`,
        [r.kid_id]
      )
      return { ...r, given_vaccines: vaccines.map(v => v.vaccine_code) }
    }))
    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/queue', authenticate, async (req, res) => {
  try {
    const { kid_id } = req.body
    const today = new Date().toISOString().slice(0, 10)
    const [[{ maxNum }]] = await pool.query(
      'SELECT COALESCE(MAX(queue_number), 0) as maxNum FROM vaccine_queue WHERE DATE(created_at) = ?',
      [today]
    )
    const [result] = await pool.query(
      `INSERT INTO vaccine_queue (kid_id, queue_number, status, created_by)
       VALUES (?, ?, 'waiting', ?)`,
      [kid_id, Number(maxNum) + 1, req.user.id]
    )
    res.status(201).json({ id: result.insertId, queue_number: Number(maxNum) + 1 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/queue/:id', authenticate, async (req, res) => {
  try {
    const { status, officer } = req.body
    await pool.query(
      `UPDATE vaccine_queue SET status = ?, officer = ?, updated_at = NOW() WHERE id = ?`,
      [status || 'done', officer || req.user.name || '', req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/queue/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM vaccine_queue WHERE id = ?', [req.params.id])
    res.json({ message: 'Dibatalkan' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 3b. QUICK VACCINATE ──────────────────────────────────────────
router.post('/quick-vaccinate', authenticate, async (req, res) => {
  try {
    const { kid_id, vaccine_code, batch_no, officer } = req.body
    if (!kid_id || !vaccine_code) {
      return res.status(400).json({ error: 'kid_id dan vaccine_code wajib' })
    }
    const [[{ maxDose }]] = await pool.query(
      'SELECT COALESCE(MAX(dose_order), 0) as maxDose FROM kid_vaccines WHERE kid_id = ? AND vaccine_code = ?',
      [kid_id, vaccine_code]
    )
    await pool.query(
      `INSERT INTO kid_vaccines (kid_id, vaccine_code, dose_order, date_administered, batch_no, officer, notes)
       VALUES (?,?,?,CURDATE(),?,?,?)`,
      [kid_id, vaccine_code, Number(maxDose) + 1, batch_no || null, officer || req.user.name || '', 'Vaksinasi rutin']
    )
    await pool.query(
      `UPDATE kids SET status = 'in_progress', updated_at = NOW() WHERE id = ? AND status != 'completed'`,
      [kid_id]
    )
    res.json({ message: 'Vaksinasi berhasil direkam', timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 3c. ACTIVE BATCHES ───────────────────────────────────────────
router.get('/batches/active', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT s.batch_no, s.vaccine_code, v.name as vaccine_name, s.expiry_date,
        s.puskesmas, s.quantity
      FROM vaccine_stock s
      JOIN vaccines v ON s.vaccine_code = v.code
      WHERE s.batch_no IS NOT NULL AND s.batch_no != ''
        AND s.quantity > 0
        AND (s.expiry_date IS NULL OR s.expiry_date > CURDATE())
      ORDER BY v.name, s.expiry_date
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 4. DROP-OUT TRACKING ─────────────────────────────────────────
router.get('/dropout', authenticate, async (req, res) => {
  try {
    const { village, puskesmas, vaccine_code, district_id } = req.query
    let sql = `
      SELECT k.id, k.name, k.nik, k.birth_date, k.mother_name, k.father_name,
        k.village_name, k.address, k.phone, k.status,
        TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) as age_months,
        COALESCE(
          (SELECT GROUP_CONCAT(DISTINCT kv2.vaccine_code ORDER BY kv2.date_administered SEPARATOR ', ')
           FROM kid_vaccines kv2 WHERE kv2.kid_id = k.id), ''
        ) as vaccines_given,
        COALESCE(
          (SELECT MAX(kv3.date_administered) FROM kid_vaccines kv3 WHERE kv3.kid_id = k.id), NULL
        ) as last_vaccine_date
      FROM kids k
      JOIN villages v ON k.village_id = v.id
      WHERE (k.status = 'pending' OR k.status = 'in_progress')
        AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= 3
    `
    const params = []
    if (village) { sql += ' AND k.village_name = ?'; params.push(village) }
    if (puskesmas) { sql += ' AND v.puskesmas = ?'; params.push(puskesmas) }
    if (district_id) { sql += ' AND v.district_id = ?'; params.push(district_id) }
    if (vaccine_code) {
      sql += ` AND k.id NOT IN (
        SELECT kv4.kid_id FROM kid_vaccines kv4 WHERE kv4.vaccine_code = ?
      )`
      params.push(vaccine_code)
    }
    sql += ' ORDER BY k.updated_at DESC'

    const [rows] = await pool.query(sql, params)

    const allVaccines = ['HB0', 'BCG', 'POLIO1', 'POLIO2', 'POLIO3', 'POLIO4', 'DPT-HB-Hib1', 'DPT-HB-Hib2', 'DPT-HB-Hib3', 'MR']
    const enriched = rows.map(k => {
      const given = k.vaccines_given ? k.vaccines_given.split(', ') : []
      const missing = allVaccines.filter(v => !given.includes(v))
      let usiaKategori = '< 3 bulan'
      if (k.age_months >= 3 && k.age_months < 9) usiaKategori = '3-8 bulan'
      else if (k.age_months >= 9 && k.age_months < 12) usiaKategori = '9-11 bulan'
      else if (k.age_months >= 12 && k.age_months < 24) usiaKategori = '12-23 bulan'
      else if (k.age_months >= 24) usiaKategori = '>= 24 bulan'
      return { ...k, missing_vaccines: missing, usia_kategori: usiaKategori }
    })

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 5. MIKROPLANNING ─────────────────────────────────────────────
router.get('/mikroplanning', authenticate, async (req, res) => {
  try {
    const { puskesmas } = req.query
    const year = new Date().getFullYear()

    let scopeSql = ''
    const params = [String(year)]
    if (puskesmas) { scopeSql = ' AND v.puskesmas = ?'; params.push(puskesmas) }

    const [villages] = await pool.query(`
      SELECT v.id, v.name as village_name, v.puskesmas
      FROM villages v WHERE 1=1 ${scopeSql} ORDER BY v.name
    `, params.slice(1))

    const [vaccines] = await pool.query(`
      SELECT code, name as vaccine_name, age_months, dose_order,
        CASE
          WHEN code IN ('HB0','BCG','POLIO1') THEN 1
          WHEN code IN ('POLIO2','DPT-HB-Hib1') THEN 0.5
          WHEN code IN ('POLIO3','DPT-HB-Hib2','DPT-HB-Hib3') THEN 0.5
          ELSE 1
        END as dose_per_vial
      FROM vaccines WHERE category = 'Bayi' ORDER BY dose_order
    `)

    const result = []
    for (const v of villages) {
      const villageData = { village_name: v.village_name, puskesmas: v.puskesmas, vaccines: [] }

      for (const vac of vaccines) {
        const [[{ totalKids }]] = await pool.query(`
          SELECT COUNT(*) as total FROM kids k
          WHERE k.village_id = ? AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= ?
        `, [v.id, vac.age_months || 0])

        const [[{ alreadyVaccinated }]] = await pool.query(`
          SELECT COUNT(DISTINCT kv.kid_id) as total FROM kid_vaccines kv
          WHERE kv.vaccine_code = ? AND kv.kid_id IN (
            SELECT k2.id FROM kids k2 WHERE k2.village_id = ?
          )
        `, [vac.code, v.id])

        const need = Math.max(0, Number(totalKids) - Number(alreadyVaccinated))
        const vialNeed = Math.ceil(need / (vac.dose_per_vial || 1))
        const syringeNeed = need

        villageData.vaccines.push({
          vaccine_code: vac.code,
          vaccine_name: vac.vaccine_name,
          need_children: need,
          need_vials: vialNeed,
          need_syringes: syringeNeed,
          dose_per_vial: vac.dose_per_vial
        })
      }

      result.push(villageData)
    }

    res.json({ data: result, vaccines })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 5b. STOCK EXPIRING ──────────────────────────────────────────
router.get('/stock/expiring', authenticate, async (req, res) => {
  try {
    const { puskesmas } = req.query
    let sql = `
      SELECT s.*, v.name as vaccine_name,
        DATEDIFF(s.expiry_date, CURDATE()) as days_until_expiry
      FROM vaccine_stock s
      JOIN vaccines v ON s.vaccine_code = v.code
      WHERE s.expiry_date IS NOT NULL
        AND s.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND s.quantity > 0
    `
    const params = []
    if (puskesmas) { sql += ' AND s.puskesmas = ?'; params.push(puskesmas) }
    sql += ' ORDER BY s.expiry_date'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 5c. EXPORT MIKROPLANNING DATA ────────────────────────────────
router.get('/mikroplanning/export', authenticate, async (req, res) => {
  try {
    const { format } = req.query
    const year = new Date().getFullYear()

    const [data] = await pool.query(`
      SELECT v.name as village_name, v.puskesmas,
        COUNT(k.id) as total_kids,
        SUM(CASE WHEN k.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN k.status != 'completed' THEN 1 ELSE 0 END) as pending
      FROM villages v
      LEFT JOIN kids k ON k.village_id = v.id
      GROUP BY v.id, v.name, v.puskesmas
      ORDER BY v.puskesmas, v.name
    `)

    res.json({
      year,
      generated_at: new Date().toISOString(),
      data,
      format: format || 'json'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 6. WHATSAPP via FONNTE ───────────────────────────────────────
router.post('/whatsapp/send', authenticate, async (req, res) => {
  try {
    const { phone, kid_name, mother_name, missing_vaccines } = req.body
    if (!phone) return res.status(400).json({ error: 'Nomor telepon wajib' })
    if (!FONNTE_TOKEN) return res.status(400).json({ error: 'Fonnte token belum dikonfigurasi' })

    const missingStr = missing_vaccines?.length
      ? missing_vaccines.join(', ')
      : 'beberapa jenis imunisasi'

    const message = `Yth. Ibu ${mother_name || 'Orang Tua'}${kid_name ? ` dari ${kid_name}` : ''},

Kami dari Puskesmas mengingatkan bahwa putra/putri Ibu membutuhkan imunisasi kejar untuk: ${missingStr}.

Silakan datang ke Posyandu/Puskesmas terdekat pada hari dan jam kerja.

Terima kasih.

- Sistem e-Kohort Digital`

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: '62'
      })
    })

    const result = await fonnteRes.json()
    if (!fonnteRes.ok) throw new Error(result.reason || 'Gagal mengirim WA')

    res.json({ status: 'sent', phone, response: result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── 7. MANUAL REMINDER TRIGGER + LOGS ─────────────────────────────
router.post('/whatsapp/trigger-reminder', authenticate, async (req, res) => {
  try {
    await runMonthlyReminder()
    res.json({ status: 'ok', message: 'Reminder selesai dijalankan' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/whatsapp/logs', authenticate, async (req, res) => {
  try {
    const { limit } = req.query
    const [rows] = await pool.query(`
      SELECT w.*, k.name as kid_name, k.village_name
      FROM wa_logs w
      JOIN kids k ON w.kid_id = k.id
      ORDER BY w.created_at DESC
      LIMIT ?
    `, [Number(limit) || 50])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
