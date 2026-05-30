import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { puskesmas } = req.query
    let sql = `SELECT s.*, v.name as vaccine_name FROM vaccine_stock s JOIN vaccines v ON s.vaccine_code = v.code WHERE 1=1`
    const params = []
    if (puskesmas) { sql += ' AND s.puskesmas = ?'; params.push(puskesmas) }
    sql += ' ORDER BY s.created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { puskesmas, vaccine_code, quantity, min_stock, batch_no, expiry_date, notes } = req.body
    const [result] = await pool.query(
      'INSERT INTO vaccine_stock (puskesmas, vaccine_code, quantity, min_stock, batch_no, expiry_date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [puskesmas, vaccine_code, quantity || 0, min_stock || 10, batch_no || null, expiry_date || null, notes || null, req.user.id]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { quantity, min_stock, batch_no, expiry_date, notes } = req.body
    await pool.query(
      'UPDATE vaccine_stock SET quantity=?, min_stock=?, batch_no=?, expiry_date=?, notes=? WHERE id=?',
      [quantity || 0, min_stock || 10, batch_no || null, expiry_date || null, notes || null, req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM vaccine_stock WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
