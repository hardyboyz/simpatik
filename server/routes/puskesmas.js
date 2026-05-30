import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { district_id } = req.query
    let sql = `SELECT p.*, d.name as district_name FROM puskesmas p JOIN districts d ON p.district_id = d.id`
    const params = []
    if (district_id) { sql += ' WHERE p.district_id = ?'; params.push(district_id) }
    sql += ' ORDER BY p.name'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, d.name as district_name FROM puskesmas p JOIN districts d ON p.district_id = d.id WHERE p.id = ?`,
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
    const { name, district_id, address, phone, head_name } = req.body
    const [result] = await pool.query(
      'INSERT INTO puskesmas (name, district_id, address, phone, head_name) VALUES (?,?,?,?,?)',
      [name, district_id, address || null, phone || null, head_name || null]
    )
    res.status(201).json({ id: result.insertId, name, district_id })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Puskesmas sudah ada di kecamatan ini' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, district_id, address, phone, head_name } = req.body
    await pool.query(
      'UPDATE puskesmas SET name=?, district_id=?, address=?, phone=?, head_name=? WHERE id=?',
      [name, district_id, address || null, phone || null, head_name || null, req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [polindes] = await pool.query('SELECT COUNT(*) as total FROM polindes WHERE puskesmas_id = ?', [req.params.id])
    if (polindes[0].total > 0) {
      return res.status(400).json({ error: `Tidak dapat menghapus: ${polindes[0].total} polindes terdaftar` })
    }
    await pool.query('DELETE FROM puskesmas WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
