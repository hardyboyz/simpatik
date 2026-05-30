import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { month, year, village_id } = req.query
    let sql = `SELECT vr.*, v.name as village_name, d.name as district_name 
               FROM vaccine_realizations vr 
               LEFT JOIN villages v ON vr.village_id = v.id 
               LEFT JOIN districts d ON v.district_id = d.id 
               WHERE 1=1`
    const params = []
    if (month) { sql += ' AND vr.month = ?'; params.push(month) }
    if (year) { sql += ' AND vr.year = ?'; params.push(year) }
    if (village_id) { sql += ' AND vr.village_id = ?'; params.push(village_id) }
    sql += ' ORDER BY vr.created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { village_id, village_name, puskesmas, vaccine_code, month, year, target_value, realization_value, officer, notes } = req.body
    const [result] = await pool.query(
      `INSERT INTO vaccine_realizations (village_id, village_name, puskesmas, vaccine_code, month, year, target_value, realization_value, officer, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [village_id || null, village_name || null, puskesmas || null, vaccine_code, month, year,
       target_value || 0, realization_value || 0, officer || null, notes || null, req.user.id]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM vaccine_realizations WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
