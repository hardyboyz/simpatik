import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND active = 1', [email])
    if (!rows.length) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    const token = jwt.sign(
      { id: user.id, uid: user.uid, email: user.email, role: user.role, name: user.name, puskesmas: user.puskesmas, district_id: user.district_id, village_id: user.village_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.json({
      token,
      user: {
        id: user.id, uid: user.uid, name: user.name, email: user.email,
        role: user.role, puskesmas: user.puskesmas, district_id: user.district_id, village_id: user.village_id,
        phone: user.phone
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const [rows] = await pool.query('SELECT id, uid, name, email, role, puskesmas, district_id, village_id, phone FROM users WHERE id = ?', [decoded.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
