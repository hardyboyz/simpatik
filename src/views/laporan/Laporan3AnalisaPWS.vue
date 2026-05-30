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
        <select v-model="filterPuskesmas" class="form-select" style="width: 200px;">
          <option value="">Semua Puskesmas</option>
          <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <button class="btn btn-outline-primary" @click="print">🖨️ Cetak</button>
    </div>
    <div class="card" id="print-area">
      <div class="card-header">TABEL ANALISA BULANAN PEMANTAUAN WILAYAH SETEMPAT (PWS)</div>
      <div class="card-body">Periode: {{ MONTHS[parseInt(month) - 1] }} {{ year }}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Puskesmas</th>
              <th>Desa</th>
              <th>Tot. Vaksin Lengkap</th>
              <th>Tot. Sasaran</th>
              <th>Rata-rata Capaian</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="i">
              <td>{{ r.puskesmas }}</td>
              <td>{{ r.village_name }}</td>
              <td>{{ r.complete_vaccinated }}</td>
              <td>{{ r.complete_target }}</td>
              <td>{{ r.avg_pct || 0 }}%</td>
              <td><span class="badge" :class="r.avg_pct >= 80 ? 'badge-success' : 'badge-danger'">{{ r.avg_pct >= 80 ? 'UCI' : 'Belum UCI' }}</span></td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-center text-muted">Belum ada data</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card" v-if="filtered.length">
      <div class="card-header">Ringkasan PWS</div>
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--success)">{{ uciCount }}</div>
          <div class="stat-label">Desa UCI</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--danger)">{{ filtered.length - uciCount }}</div>
          <div class="stat-label">Desa Belum UCI</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--info)">{{ avgAll }}%</div>
          <div class="stat-label">Rata-rata Capaian</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportsApi, puskesmasApi } from '../../api'
import { MONTHS } from '../../config/masterData'

const month = ref(String(new Date().getMonth() + 1).padStart(2, '0'))
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
      reportsApi.analisaPws({ month: month.value, year: year.value }),
      puskesmasApi.list()
    ])
    data.value = res.data.data
    puskesmasList.value = pRes.data.map(p => p.name)
  } catch { data.value = [] }
}
onMounted(load)
watch([month, year], load)

const uciCount = computed(() => filtered.value.filter(r => Number(r.avg_pct) >= 80).length)
const avgAll = computed(() => {
  return filtered.value.length ? Math.round(filtered.value.reduce((s, r) => s + Number(r.avg_pct || 0), 0) / filtered.value.length) : 0
})

function print() { window.print() }
</script>
