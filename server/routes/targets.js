import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { year, village_id } = req.query
    let sql = `SELECT vt.*, v.name as village_name FROM vaccine_targets vt JOIN villages v ON vt.village_id = v.id WHERE 1=1`
    const params = []
    if (year) { sql += ' AND vt.year = ?'; params.push(year) }
    if (village_id) { sql += ' AND vt.village_id = ?'; params.push(village_id) }
    sql += ' ORDER BY v.name, vt.vaccine_code'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { village_id, vaccine_code, year, target_value, target_bayi_l, target_bayi_p, target_bayi_total, target_surv_l, target_surv_p, target_surv_total, target_baduta_l, target_baduta_p, target_baduta_total } = req.body
    await pool.query(
      `INSERT INTO vaccine_targets (village_id, vaccine_code, year, target_value, target_bayi_l, target_bayi_p, target_bayi_total, target_surv_l, target_surv_p, target_surv_total, target_baduta_l, target_baduta_p, target_baduta_total)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE target_value=VALUES(target_value), target_bayi_l=VALUES(target_bayi_l), target_bayi_p=VALUES(target_bayi_p), target_bayi_total=VALUES(target_bayi_total), target_surv_l=VALUES(target_surv_l), target_surv_p=VALUES(target_surv_p), target_surv_total=VALUES(target_surv_total), target_baduta_l=VALUES(target_baduta_l), target_baduta_p=VALUES(target_baduta_p), target_baduta_total=VALUES(target_baduta_total)`,
      [village_id, vaccine_code, year, target_value || 0, target_bayi_l || 0, target_bayi_p || 0, target_bayi_total || 0, target_surv_l || 0, target_surv_p || 0, target_surv_total || 0, target_baduta_l || 0, target_baduta_p || 0, target_baduta_total || 0]
    )
    res.json({ message: 'Target saved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
