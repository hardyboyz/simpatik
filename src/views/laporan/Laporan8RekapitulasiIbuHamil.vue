<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="year" class="form-select" style="width: 120px;">
          <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
        </select>
        <select v-model="filterPuskesmas" class="form-select" style="width: 200px;">
          <option value="">Semua Puskesmas</option>
          <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <button class="btn btn-outline-primary" @click="print">🖨️ Cetak</button>
    </div>
    <div class="card" id="print-area">
      <div class="card-header">REKAPITULASI IMUNISASI T IBU HAMIL DAN WUS DI PUSKESMAS</div>
      <div class="card-body">Tahun: {{ year }}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Puskesmas</th>
              <th>Vaksin</th>
              <th>Total Sasaran</th>
              <th>Total Realisasi</th>
              <th>Capaian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="i">
              <td><strong>{{ r.puskesmas }}</strong></td>
              <td>{{ r.vaccine_name }}</td>
              <td>{{ r.total_target }}</td>
              <td>{{ r.total_real }}</td>
              <td><span class="badge" :class="pctClass(r.pct)">{{ r.pct || 0 }}%</span></td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="5" class="text-center text-muted">Belum ada data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card" v-if="filtered.length">
      <div class="card-header">Ringkasan</div>
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--primary)">{{ sum('total_target') }}</div>
          <div class="stat-label">Total Sasaran</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)">{{ sum('total_real') }}</div>
          <div class="stat-label">Total Realisasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--info)">{{ avgPct }}%</div>
          <div class="stat-label">Rata-rata Capaian</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportsApi, puskesmasApi } from '../../api'

const year = ref(String(new Date().getFullYear()))
const filterPuskesmas = ref('')
const data = ref([])
const puskesmasList = ref([])
const yearList = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

const filtered = computed(() => {
  if (!filterPuskesmas.value) return data.value
  return data.value.filter(r => r.puskesmas === filterPuskesmas.value)
})

async function load() {
  try {
    const [res, pRes] = await Promise.all([
      reportsApi.rekapitulasiIbuHamil({ year: year.value }),
      puskesmasApi.list()
    ])
    data.value = res.data.data
    puskesmasList.value = pRes.data.map(p => p.name)
  } catch { data.value = [] }
}
onMounted(load)
watch(year, load)

function sum(key) {
  return filtered.value.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}
const avgPct = computed(() => {
  const withT = filtered.value.filter(r => Number(r.total_target) > 0)
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
