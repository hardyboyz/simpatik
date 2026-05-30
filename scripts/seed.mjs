import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  })

  console.log('Running schema migrations...')
  const migrations = [
    'server/migrations/001_schema.sql',
    'server/migrations/002_seed.sql',
    'server/migrations/003_puskesmas_polindes.sql',
    'server/migrations/004_seed_puskesmas_polindes.sql',
    'server/migrations/005_demographics.sql',
    'server/migrations/006_update_vaccines.sql',
    'server/migrations/007_distributions_softdelete.sql',
    'server/migrations/008_user_scope.sql'
  ]

  for (const mig of migrations) {
    const filePath = resolve(__dirname, '..', mig)
    console.log(`  ${mig}`)
    const sql = readFileSync(filePath, 'utf8')
    const statements = sql.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      try { await connection.query(stmt) } catch (e) {
        if (!e.message.includes('Duplicate') && !e.message.includes('already exists')) {
          console.error(`    Error: ${e.message}`)
        }
      }
    }
  }

  console.log('Creating default users...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const users = [
    { name: 'Administrator', email: 'admin@imunisasi.id', role: 'admin', puskesmas: null },
    { name: 'Petugas Puskesmas Manggar', email: 'puskesmas@imunisasi.id', role: 'puskesmas', puskesmas: 'Manggar' },
    { name: 'Bidan Desa Baru', email: 'bidan@imunisasi.id', role: 'bidan', puskesmas: 'Manggar' },
    { name: 'Dinkes Belitung Timur', email: 'dinkes@imunisasi.id', role: 'dinkes', puskesmas: null },
    { name: 'Admin Dinkes Belitung Timur', email: 'dinkes.admin@imunisasi.id', role: 'admin', puskesmas: null }
  ]
  for (const u of users) {
    try {
      const uid = 'u_' + Date.now() + Math.random().toString(36).slice(2, 8)
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email])
      if (existing.length) {
        console.log(`  ~ ${u.email} already exists`)
        continue
      }
      await connection.query(
        'INSERT INTO users (uid, name, email, password, role, puskesmas) VALUES (?, ?, ?, ?, ?, ?)',
        [uid, u.name, u.email, hashedPassword, u.role, u.puskesmas]
      )
      console.log(`  ✓ ${u.email} (${u.role}) / password: admin123`)
    } catch (e) {
      console.error(`  ✗ ${u.email}: ${e.message}`)
    }
  }

  await connection.end()
  console.log('\nSeed complete!')
  console.log('Users:')
  console.log('  admin@imunisasi.id       - Administrator')
  console.log('  puskesmas@imunisasi.id   - Petugas Puskesmas')
  console.log('  bidan@imunisasi.id       - Bidan Desa')
  console.log('  dinkes@imunisasi.id      - Dinas Kesehatan')
  console.log('  dinkes.admin@imunisasi.id - Admin Dinkes (NEW)')
  console.log('  Semua password: admin123')
  process.exit(0)
}

seed()
