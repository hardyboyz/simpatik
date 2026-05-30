import { Router } from 'express'
import pool from '../config/database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/stats', authenticate, async (req, res) => {
  try {
    const { vaccine, puskesmas } = req.query

    const [totalKids] = await pool.query('SELECT COUNT(*) as total FROM kids')
    const [vaccinated] = await pool.query("SELECT COUNT(*) as total FROM kids WHERE status='completed'")
    const [pending] = await pool.query("SELECT COUNT(*) as total FROM kids WHERE status='pending'")
    const [totalStock] = await pool.query('SELECT SUM(quantity) as total FROM vaccine_stock')
    const [lowStock] = await pool.query('SELECT COUNT(*) as total FROM vaccine_stock WHERE quantity <= min_stock')
    const [totalDist] = await pool.query('SELECT COUNT(*) as total FROM distributions')
    const [recentDist] = await pool.query(
      `SELECT d.*, v.name as vaccine_name FROM distributions d LEFT JOIN vaccines v ON d.vaccine_code = v.code ORDER BY d.created_at DESC LIMIT 5`
    )

    let stockSql = `SELECT vs.vaccine_code, v.name, SUM(vs.quantity) as total_qty FROM vaccine_stock vs JOIN vaccines v ON vs.vaccine_code = v.code`
    const stockParams = []
    if (vaccine) { stockSql += ' WHERE vs.vaccine_code = ?'; stockParams.push(vaccine) }
    stockSql += ' GROUP BY vs.vaccine_code, v.name'
    const [vaccineSummary] = await pool.query(stockSql, stockParams)

    const [villageAchievement] = await pool.query(
      `SELECT vr.village_name, SUM(vr.realization_value) as total_real, SUM(vr.target_value) as total_target
       FROM vaccine_realizations vr GROUP BY vr.village_name ORDER BY total_real DESC LIMIT 10`
    )

    let puskesmasSql = `SELECT v.puskesmas, SUM(vr.realization_value) as total_real, SUM(vr.target_value) as total_target
       FROM vaccine_realizations vr JOIN villages v ON vr.village_name = v.name`
    const puskesmasParams = []
    if (puskesmas) { puskesmasSql += ' WHERE v.puskesmas = ?'; puskesmasParams.push(puskesmas) }
    puskesmasSql += ' GROUP BY v.puskesmas ORDER BY total_real DESC'
    const [puskesmasAchievement] = await pool.query(puskesmasSql, puskesmasParams)

    res.json({
      totalKids: totalKids[0].total,
      vaccinatedKids: vaccinated[0].total,
      pendingKids: pending[0].total,
      totalStock: totalStock[0].total || 0,
      lowStockItems: lowStock[0].total,
      totalDistributions: totalDist[0].total,
      recentDistributions: recentDist,
      vaccineSummary,
      villageAchievement,
      puskesmasAchievement
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
