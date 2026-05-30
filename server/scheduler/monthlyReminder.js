import cron from 'node-cron'
import pool from '../config/database.js'

const FONNTE_TOKEN = process.env.FONNTE_TOKEN || ''
const FONNTE_ENABLED = process.env.FONNTE_REMINDER_ENABLED !== 'false'

const ALL_VACCINES = [
  'HB0', 'BCG', 'POLIO1', 'POLIO2', 'POLIO3', 'POLIO4',
  'DPT-HB-Hib1', 'DPT-HB-Hib2', 'DPT-HB-Hib3', 'MR'
]

function getAgeCategory(months) {
  if (months < 3) return '< 3 bulan'
  if (months < 9) return '3-8 bulan'
  if (months < 12) return '9-11 bulan'
  if (months < 24) return '12-23 bulan'
  return '>= 24 bulan'
}

async function sendWa(targetPhone, message) {
  if (!FONNTE_TOKEN) return { status: 'skipped', reason: 'no token' }
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: targetPhone,
        message,
        countryCode: '62'
      })
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.reason || 'Fonnte error')
    return { status: 'sent', response: result }
  } catch (err) {
    return { status: 'failed', error: err.message }
  }
}

async function runMonthlyReminder() {
  console.log('[Scheduler] Monthly WA reminder started:', new Date().toISOString())

  if (!FONNTE_TOKEN) {
    console.log('[Scheduler] SKIPPED: FONNTE_TOKEN not configured')
    return
  }

  if (!FONNTE_ENABLED) {
    console.log('[Scheduler] SKIPPED: FONNTE_REMINDER_ENABLED=false')
    return
  }

  try {
    const [kids] = await pool.query(`
      SELECT k.id, k.name, k.nik, k.mother_name, k.father_name, k.phone,
        k.village_name, k.status,
        TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) as age_months
      FROM kids k
      WHERE (k.status = 'pending' OR k.status = 'in_progress')
        AND TIMESTAMPDIFF(MONTH, k.birth_date, CURDATE()) >= 3
        AND k.phone IS NOT NULL AND k.phone != ''
      ORDER BY k.updated_at ASC
    `)

    console.log(`[Scheduler] Found ${kids.length} kids needing reminder`)

    let sentCount = 0
    let failedCount = 0
    let skippedCount = 0

    for (const kid of kids) {
      const [vaccineRows] = await pool.query(
        `SELECT DISTINCT vaccine_code FROM kid_vaccines WHERE kid_id = ?`,
        [kid.id]
      )
      const given = vaccineRows.map(r => r.vaccine_code)
      const missing = ALL_VACCINES.filter(v => !given.includes(v))

      if (missing.length === 0) {
        skippedCount++
        continue
      }

      if (!kid.phone) {
        skippedCount++
        continue
      }

      const missingStr = missing.join(', ')
      const message = `Yth. Ibu ${kid.mother_name || 'Orang Tua'} dari ${kid.name},

Kami dari Puskesmas mengingatkan bahwa putra/putri Ibu membutuhkan imunisasi kejar untuk: ${missingStr}.

Silakan datang ke Posyandu/Puskesmas terdekat pada hari dan jam kerja.

Terima kasih.

- Sistem e-Kohort Digital (Pengingat Otomatis Bulanan)`

      const result = await sendWa(kid.phone, message)

      await pool.query(
        `INSERT INTO wa_logs (kid_id, phone, message, missing_vaccines, status, response, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [kid.id, kid.phone, message, missingStr, result.status, JSON.stringify(result)]
      )

      if (result.status === 'sent') {
        sentCount++
      } else {
        failedCount++
      }

      if (sentCount % 10 === 0) {
        console.log(`[Scheduler] Progress: ${sentCount} sent, ${failedCount} failed`)
      }
    }

    console.log(`[Scheduler] Done: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`)
  } catch (err) {
    console.error('[Scheduler] Error:', err.message)
  }
}

export function startMonthlyReminder() {
  // Run on the 1st of every month at 08:00
  cron.schedule('0 8 1 * *', () => {
    runMonthlyReminder()
  })

  // Also run once on startup (with 30s delay to let server warm up)
  setTimeout(() => {
    runMonthlyReminder()
  }, 30000)

  console.log('[Scheduler] Monthly WA reminder scheduled (1st of month at 08:00)')
}

export { runMonthlyReminder }
