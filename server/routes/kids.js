import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const { village, search, status, district_id, puskesmas } = req.query
    let sql = `SELECT k.*, d.name as district_name FROM kids k LEFT JOIN villages v ON k.village_id = v.id LEFT JOIN districts d ON v.district_id = d.id WHERE 1=1`
    const params = []
    if (village) { sql += ' AND k.village_name = ?'; params.push(village) }
    if (status) { sql += ' AND k.status = ?'; params.push(status) }
    if (search) { sql += ' AND (k.name LIKE ? OR k.nik LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    if (district_id) { sql += ' AND v.district_id = ?'; params.push(district_id) }
    if (puskesmas) { sql += ' AND v.puskesmas = ?'; params.push(puskesmas) }
    sql += ' ORDER BY k.created_at DESC'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kids WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const kid = rows[0]
    const [vaccines] = await pool.query('SELECT * FROM kid_vaccines WHERE kid_id = ? ORDER BY date_administered', [req.params.id])
    kid.vaccines = vaccines
    res.json(kid)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { nik, name, birth_date, gender, mother_name, father_name, village_id, village_name, address, phone, notes } = req.body
    const [result] = await pool.query(
      `INSERT INTO kids (nik, name, birth_date, gender, mother_name, father_name, village_id, village_name, address, phone, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [nik || null, name, birth_date || null, gender || null, mother_name || null, father_name || null,
       village_id || null, village_name || null, address || null, phone || null, notes || null, req.user.id]
    )
    res.status(201).json({ id: result.insertId, ...req.body })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nik, name, birth_date, gender, mother_name, father_name, village_id, village_name, address, phone, notes, status } = req.body
    await pool.query(
      `UPDATE kids SET nik=?, name=?, birth_date=?, gender=?, mother_name=?, father_name=?, village_id=?, village_name=?, address=?, phone=?, notes=?, status=?, updated_at=NOW() WHERE id=?`,
      [nik || null, name, birth_date || null, gender || null, mother_name || null, father_name || null,
       village_id || null, village_name || null, address || null, phone || null, notes || null, status || 'pending', req.params.id]
    )
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM kids WHERE id = ?', [req.params.id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/vaccines', authenticate, async (req, res) => {
  try {
    const { vaccine_code, dose_order, date_administered, officer, notes } = req.body
    await pool.query(
      'INSERT INTO kid_vaccines (kid_id, vaccine_code, dose_order, date_administered, officer, notes) VALUES (?,?,?,?,?,?)',
      [req.params.id, vaccine_code, dose_order || 1, date_administered || null, officer || null, notes || null]
    )
    res.status(201).json({ message: 'Vaccine record added' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
