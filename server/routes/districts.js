import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user?.district_id) {
      const [rows] = await pool.query('SELECT * FROM districts WHERE id = ? ORDER BY name', [req.user.district_id])
      return res.json(rows)
    }
    const [rows] = await pool.query('SELECT * FROM districts ORDER BY name')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
