import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import districtsRoutes from './routes/districts.js'
import villagesRoutes from './routes/villages.js'
import vaccinesRoutes from './routes/vaccines.js'
import kidsRoutes from './routes/kids.js'
import targetsRoutes from './routes/targets.js'
import realizationsRoutes from './routes/realizations.js'
import stockRoutes from './routes/stock.js'
import distributionsRoutes from './routes/distributions.js'
import dashboardRoutes from './routes/dashboard.js'
import puskesmasRoutes from './routes/puskesmas.js'
import polindesRoutes from './routes/polindes.js'
import demographicsRoutes from './routes/demographics.js'
import profileRoutes from './routes/profile.js'
import reportsRoutes from './routes/reports.js'
import eKohortRoutes from './routes/eKohort.js'
import { startMonthlyReminder } from './scheduler/monthlyReminder.js'

const app = express()
const PORT = process.env.API_PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/districts', districtsRoutes)
app.use('/api/villages', villagesRoutes)
app.use('/api/vaccines', vaccinesRoutes)
app.use('/api/kids', kidsRoutes)
app.use('/api/targets', targetsRoutes)
app.use('/api/realizations', realizationsRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/distributions', distributionsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/puskesmas', puskesmasRoutes)
app.use('/api/polindes', polindesRoutes)
app.use('/api/demographics', demographicsRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/ekohort', eKohortRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`SIMPATIK API running on port ${PORT}`)
})

// Start monthly WA reminder scheduler
startMonthlyReminder()
