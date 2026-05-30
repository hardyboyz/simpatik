<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="month" class="form-select" style="width: 180px;">
          <option v-for="(m, i) in MONTHS" :key="i" :value="String(i + 1).padStart(2, '0')">{{ m }}</option>
        </select>
        <select v-model="year" class="form-select" style="width: 120px;">
          <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <button class="btn btn-outline-primary" @click="print">🖨️ Cetak</button>
    </div>

    <div class="card" id="print-area">
      <div class="card-header">LAPORAN BULANAN HASIL IMUNISASI RUTIN BAYI PUSKESMAS</div>
      <div class="card-body">
        <div style="font-size:0.9rem;line-height:1.6">
          <div>Periode: <strong>{{ MONTHS[parseInt(month) - 1] }} {{ year }}</strong></div>
          <div>Sumber target: Data Demografi (bayi) per desa</div>
          <div>Sumber realisasi: Data Imunisasi Rutin (kid_vaccines → kids → demographics → villages)</div>
        </div>
      </div>

      <template v-for="p in puskesmasList" :key="p.nama">
        <div class="card-subheader" style="padding:0.75rem 1.25rem;background:#f8f9fa;border-bottom:2px solid var(--primary);font-weight:700;font-size:0.95rem">
          Puskesmas {{ p.nama }} — {{ p.village_count }} Desa ({{ p.village_names }})
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Vaksin</th>
                <th>Sasaran (Bayi)</th>
                <th>Realisasi</th>
                <th>Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in rowsByPuskesmas(p.nama)" :key="r.vaccine_code">
                <td>{{ i + 1 }}</td>
                <td>{{ r.vaccine_name }}</td>
                <td>{{ r.total_target }}</td>
                <td>{{ r.total_real }}</td>
                <td>
                  <span class="badge" :class="pctClass(r.pct)">{{ r.pct }}%</span>
                </td>
              </tr>
              <tr v-if="!rowsByPuskesmas(p.nama).length">
                <td colspan="5" class="text-center text-muted">Tidak ada data vaksin</td>
              </tr>
            </tbody>
            <tfoot v-if="rowsByPuskesmas(p.nama).length">
              <tr style="font-weight:700;background:#e9ecef">
                <td colspan="2">TOTAL {{ p.nama }}</td>
                <td>{{ sumTarget(p.nama) }}</td>
                <td>{{ sumReal(p.nama) }}</td>
                <td><span class="badge" :class="pctClass(avgPct(p.nama))">{{ avgPct(p.nama) }}%</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>

      <div v-if="!puskesmasList.length" class="card-body text-center text-muted py-4">Belum ada data</div>
    </div>

    <div class="card" v-if="data.length">
      <div class="card-header">Ringkasan Kabupaten</div>
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--primary)">{{ grandTarget }}</div>
          <div class="stat-label">Total Sasaran Bayi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)">{{ grandReal }}</div>
          <div class="stat-label">Total Realisasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--info)">{{ grandAvg }}%</div>
          <div class="stat-label">Rata-rata Capaian</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportsApi } from '../../api'
import { MONTHS } from '../../config/masterData'

const month = ref(String(new Date().getMonth() + 1).padStart(2, '0'))
const year = ref(String(new Date().getFullYear()))
const data = ref([])
const demografi = ref([])
const yearList = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const puskesmasList = computed(() => demografi.value)

function rowsByPuskesmas(nama) {
  return data.value.filter(r => r.puskesmas === nama)
}
function sumTarget(nama) {
  return rowsByPuskesmas(nama).reduce((s, r) => s + Number(r.total_target), 0)
}
function sumReal(nama) {
  return rowsByPuskesmas(nama).reduce((s, r) => s + Number(r.total_real), 0)
}
function avgPct(nama) {
  const rows = rowsByPuskesmas(nama).filter(r => Number(r.total_target) > 0)
  return rows.length ? Math.round(rows.reduce((s, r) => s + Number(r.pct), 0) / rows.length) : 0
}

const grandTarget = computed(() => data.value.reduce((s, r) => s + Number(r.total_target), 0))
const grandReal = computed(() => data.value.reduce((s, r) => s + Number(r.total_real), 0))
const grandAvg = computed(() => {
  const withT = data.value.filter(r => Number(r.total_target) > 0)
  return withT.length ? Math.round(withT.reduce((s, r) => s + Number(r.pct), 0) / withT.length) : 0
})

async function load() {
  try {
    const res = await reportsApi.bulananBayi({ month: month.value, year: year.value })
    data.value = res.data.data
    demografi.value = res.data.demografi || []
  } catch { data.value = []; demografi.value = [] }
}
onMounted(load)
watch([month, year], load)

function pctClass(p) {
  const v = Number(p)
  if (v >= 95) return 'badge-success'
  if (v >= 50) return 'badge-warning'
  return 'badge-danger'
}

function print() { window.print() }
</script>
