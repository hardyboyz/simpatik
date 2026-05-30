import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { puskesmas_id, village_id } = req.query
    let sql = `SELECT pol.*, p.name as puskesmas_name, v.name as village_name, d.name as district_name
               FROM polindes pol
               JOIN puskesmas p ON pol.puskesmas_id = p.id
               JOIN villages v ON pol.village_id = v.id
               JOIN districts d ON v.district_id = d.id
               WHERE 1=1`
    const params = []
    if (puskesmas_id) { sql += ' AND pol.puskesmas_id = ?'; params.push(puskesmas_id) }
    if (village_id) { sql += ' AND pol.village_id = ?'; params.push(village_id) }
    sql += ' ORDER BY p.name, v.name, pol.name'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pol.*, p.name as puskesmas_name, v.name as village_name, d.name as district_name
       FROM polindes pol
       JOIN puskesmas p ON pol.puskesmas_id = p.id
       JOIN villages v ON pol.village_id = v.id
       JOIN districts d ON v.district_id = d.id
       WHERE pol.id = ?`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, puskesmas_id, village_id, address, phone, head_name } = req.body
    const [result] = await pool.query(
      'INSERT INTO polindes (name, puskesmas_id, village_id, address, phone, head_name) VALUES (?,?,?,?,?,?)',
      [name, puskesmas_id, village_id, address || null, phone || null, head_name || null]
    )
    res.status(201).json({ id: result.insertId, name, puskesmas_id, village_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, puskesmas_id, village_id, address, phone, head_name, is_active } = req.body
    await pool.query(
      'UPDATE polindes SET name=?, puskesmas_id=?, village_id=?, address=?, phone=?, head_name=?, is_active=? WHERE id=?',
      [name, puskesmas_id, village_id, address || null, phone || null, head_name || null, is_active !== undefined ? is_active : 1, req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM polindes WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
