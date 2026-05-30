import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { district_id } = req.query
    let sql = `SELECT v.*, d.name as district_name FROM villages v JOIN districts d ON v.district_id = d.id`
    const params = []
    if (district_id) {
      sql += ' WHERE v.district_id = ?'
      params.push(district_id)
    }
    sql += ' ORDER BY v.name'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, district_id, puskesmas } = req.body
    const [result] = await pool.query(
      'INSERT INTO villages (name, district_id, puskesmas) VALUES (?,?,?)',
      [name, district_id, puskesmas || null]
    )
    res.status(201).json({ id: result.insertId, name, district_id, puskesmas })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
