import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/database.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.uid, u.name, u.email, u.role, u.puskesmas, u.district_id, u.village_id, u.phone, u.active, u.created_at,
        d.name as district_name, v.name as village_name
       FROM users u
       LEFT JOIN districts d ON u.district_id = d.id
       LEFT JOIN villages v ON u.village_id = v.id
       ORDER BY u.created_at DESC`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, puskesmas, district_id, village_id, phone } = req.body
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) return res.status(400).json({ error: 'Email sudah digunakan' })
    const hashed = await bcrypt.hash(password, 10)
    const uid = 'u_' + Date.now()
    const [result] = await pool.query(
      'INSERT INTO users (uid, name, email, password, role, puskesmas, district_id, village_id, phone) VALUES (?,?,?,?,?,?,?,?,?)',
      [uid, name, email, hashed, role, puskesmas || null, district_id || null, village_id || null, phone || null]
    )
    res.status(201).json({ id: result.insertId, uid, name, email, role, puskesmas })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, role, puskesmas, district_id, village_id, phone, active } = req.body
    const fields = []
    const values = []
    if (name !== undefined) { fields.push('name=?'); values.push(name) }
    if (role !== undefined) { fields.push('role=?'); values.push(role) }
    if (puskesmas !== undefined) { fields.push('puskesmas=?'); values.push(puskesmas || null) }
    if (district_id !== undefined) { fields.push('district_id=?'); values.push(district_id || null) }
    if (village_id !== undefined) { fields.push('village_id=?'); values.push(village_id || null) }
    if (phone !== undefined) { fields.push('phone=?'); values.push(phone || null) }
    if (active !== undefined) { fields.push('active=?'); values.push(active) }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.id)
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, values)
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
