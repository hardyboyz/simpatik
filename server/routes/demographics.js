import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { year } = req.query
    let sql = `SELECT d.*, v.name as village_name FROM demographics d JOIN villages v ON d.village_id = v.id WHERE 1=1`
    const params = []
    if (year) { sql += ' AND d.year = ?'; params.push(year) }
    sql += ' ORDER BY v.name'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { village_id, year, baby_l, baby_p, infant_l, infant_p, baduta_l, baduta_p, wus_total, wus_pregnant } = req.body
    const baby_total = (Number(baby_l) || 0) + (Number(baby_p) || 0)
    const infant_total = (Number(infant_l) || 0) + (Number(infant_p) || 0)
    const baduta_total = (Number(baduta_l) || 0) + (Number(baduta_p) || 0)
    const wus_not_pregnant = (Number(wus_total) || 0) - (Number(wus_pregnant) || 0)

    await pool.query(
      `INSERT INTO demographics (village_id, year, baby_l, baby_p, baby_total, infant_l, infant_p, infant_total, baduta_l, baduta_p, baduta_total, wus_total, wus_pregnant, wus_not_pregnant)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         baby_l=VALUES(baby_l), baby_p=VALUES(baby_p), baby_total=VALUES(baby_total),
         infant_l=VALUES(infant_l), infant_p=VALUES(infant_p), infant_total=VALUES(infant_total),
         baduta_l=VALUES(baduta_l), baduta_p=VALUES(baduta_p), baduta_total=VALUES(baduta_total),
         wus_total=VALUES(wus_total), wus_pregnant=VALUES(wus_pregnant), wus_not_pregnant=VALUES(wus_not_pregnant)`,
      [village_id, year || '2026', baby_l || 0, baby_p || 0, baby_total, infant_l || 0, infant_p || 0, infant_total, baduta_l || 0, baduta_p || 0, baduta_total, wus_total || 0, wus_pregnant || 0, wus_not_pregnant]
    )
    res.json({ message: 'Data demografi saved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
