import * as XLSX from 'xlsx'
import { VILLAGES } from '../config/masterData'

export function parseDataDasar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

        const targets = []
        let currentVaccine = null

        for (let i = 10; i < data.length; i++) {
          const row = data[i]
          if (!row) continue

          const no = row[0]
          const villageName = row[1]
          const vaccineName = row[15]
          const targetPct = row[16]

          if (vaccineName && targetPct) {
            currentVaccine = { name: vaccineName, pct: targetPct }
          }

          if (no && villageName) {
            const village = VILLAGES.find(v => v.name.toLowerCase() === String(villageName).toLowerCase())
            if (village && currentVaccine) {
              targets.push({
                villageId: village.id,
                villageName: village.name,
                vaccineName: currentVaccine.name,
                targetPct: currentVaccine.pct,
                bayiL: row[2] || 0,
                bayiP: row[3] || 0,
                bayiTotal: row[4] || 0,
                survL: row[5] || 0,
                survP: row[6] || 0,
                survTotal: row[7] || 0,
                badutaL: row[8] || 0,
                badutaP: row[9] || 0,
                badutaTotal: row[10] || 0
              })
            }
          }
        }
        resolve(targets)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function parseSampleData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

        const realizations = []
        const vaccineCols = [
          { col: 9, code: 'HB0', label: 'HB0 (<24 JAM)' },
          { col: 21, code: 'HB0_1_7', label: 'HB0 (1-7 HARI)' },
          { col: 33, code: 'HB0_TOTAL', label: 'HB0 (TOTAL)' },
          { col: 45, code: 'BCG', label: 'BCG' },
          { col: 57, code: 'POLIO1', label: 'POLIO1' },
          { col: 69, code: 'DPT1', label: 'DPT/HB-Hib (1)' }
        ]

        for (let i = 9; i < data.length; i++) {
          const row = data[i]
          if (!row) continue

          const no = row[0]
          const villageName = row[1]
          if (!no && !villageName) continue

          const village = VILLAGES.find(v =>
            v.name.toLowerCase() === String(villageName || '').toLowerCase()
          )

          vaccineCols.forEach(vc => {
            const value = row[vc.col]
            if (value !== undefined && value !== null && value !== '') {
              realizations.push({
                villageName: villageName,
                villageId: village?.id || null,
                vaccineCode: vc.code,
                vaccineLabel: vc.label,
                value: Number(value) || 0,
                month: '05',
                year: '2026'
              })
            }
          })
        }
        resolve(realizations)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
