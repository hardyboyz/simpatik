import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, v.name as vaccine_name FROM distributions d LEFT JOIN vaccines v ON d.vaccine_code = v.code WHERE d.deleted_at IS NULL ORDER BY d.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM distributions WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { vaccine_code, vaccine_name, source, destination, quantity, batch_no, officer, notes } = req.body
    const [result] = await pool.query(
      'INSERT INTO distributions (vaccine_code, vaccine_name, source, destination, quantity, batch_no, officer, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [vaccine_code, vaccine_name || null, source, destination, quantity || 0, batch_no || null, officer || null, notes || null, req.user.id]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { vaccine_code, vaccine_name, source, destination, quantity, batch_no, officer, notes } = req.body
    await pool.query(
      'UPDATE distributions SET vaccine_code=?, vaccine_name=?, source=?, destination=?, quantity=?, batch_no=?, officer=?, notes=? WHERE id=? AND deleted_at IS NULL',
      [vaccine_code, vaccine_name || null, source, destination, quantity || 0, batch_no || null, officer || null, notes || null, req.params.id]
    )
    res.json({ message: 'Distribution updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE distributions SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    )
    res.json({ message: 'Distribution deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
