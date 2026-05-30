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
      <div class="card-header">LAPORAN HASIL IMUNISASI RUTIN BAYI PUSKESMAS (KUMULATIF)</div>
      <div class="card-body">Periode: Januari - {{ MONTHS[parseInt(month) - 1] }} {{ year }}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Puskesmas</th>
              <th>Vaksin</th>
              <th>Sasaran (Kumulatif)</th>
              <th>Realisasi (Kumulatif)</th>
              <th>Capaian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in data" :key="i">
              <td><strong>{{ r.puskesmas }}</strong></td>
              <td>{{ r.vaccine_name }}</td>
              <td>{{ r.total_target }}</td>
              <td>{{ r.total_real }}</td>
              <td><span class="badge" :class="pctClass(r.pct)">{{ r.pct || 0 }}%</span></td>
            </tr>
            <tr v-if="!data.length">
              <td colspan="5" class="text-center text-muted">Belum ada data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card" v-if="data.length">
      <div class="card-header">Ringkasan Kumulatif</div>
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--primary)">{{ totTarget }}</div>
          <div class="stat-label">Total Sasaran</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)">{{ totReal }}</div>
          <div class="stat-label">Total Realisasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--info)">{{ avg }}%</div>
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
const yearList = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

async function load() {
  try {
    const res = await reportsApi.kumulatifBayi({ month: month.value, year: year.value })
    data.value = res.data.data
  } catch { data.value = [] }
}
onMounted(load)
watch([month, year], load)

const totTarget = computed(() => data.value.reduce((s, r) => s + (Number(r.total_target) || 0), 0))
const totReal = computed(() => data.value.reduce((s, r) => s + (Number(r.total_real) || 0), 0))
const avg = computed(() => {
  const withT = data.value.filter(r => Number(r.total_target) > 0)
  return withT.length ? Math.round(withT.reduce((s, r) => s + Number(r.pct || 0), 0) / withT.length) : 0
})

function pctClass(p) {
  const v = Number(p)
  if (v >= 95) return 'badge-success'
  if (v >= 50) return 'badge-warning'
  return 'badge-danger'
}

function print() { window.print() }
</script>
