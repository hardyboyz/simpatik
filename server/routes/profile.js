import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, uid, name, email, role, puskesmas, phone, address, avatar FROM users WHERE id = ?',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', authenticate, async (req, res) => {
  try {
    const { name, phone, address, avatar, current_password, new_password } = req.body
    const fields = []
    const values = []

    if (name !== undefined) { fields.push('name=?'); values.push(name) }
    if (phone !== undefined) { fields.push('phone=?'); values.push(phone || null) }
    if (address !== undefined) { fields.push('address=?'); values.push(address || null) }
    if (avatar !== undefined) { fields.push('avatar=?'); values.push(avatar || null) }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Password saat ini diperlukan untuk mengganti password' })
      }
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id])
      const valid = await bcrypt.compare(current_password, rows[0].password)
      if (!valid) {
        return res.status(400).json({ error: 'Password saat ini salah' })
      }
      const hashed = await bcrypt.hash(new_password, 10)
      fields.push('password=?')
      values.push(hashed)
    }

    if (!fields.length) return res.status(400).json({ error: 'Tidak ada data yang diubah' })
    values.push(req.user.id)
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, values)

    const [updated] = await pool.query(
      'SELECT id, uid, name, email, role, puskesmas, phone, address, avatar FROM users WHERE id = ?',
      [req.user.id]
    )
    res.json(updated[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
