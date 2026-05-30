import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vaccines ORDER BY id')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { target_pct } = req.body
    await pool.query('UPDATE vaccines SET target_pct = ? WHERE id = ?', [target_pct || 0, req.params.id])
    res.json({ message: 'Vaccine updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
