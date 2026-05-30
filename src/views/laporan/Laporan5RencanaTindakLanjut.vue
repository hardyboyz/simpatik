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
      <div class="card-header">LAPORAN RENCANA TINDAK LANJUT PWS</div>
      <div class="card-body">Periode: {{ MONTHS[parseInt(month) - 1] }} {{ year }} — Menampilkan desa dengan capaian belum tercapai</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Puskesmas</th>
              <th>Desa</th>
              <th>Kecamatan</th>
              <th>Vaksin</th>
              <th>Sasaran</th>
              <th>Realisasi</th>
              <th>Capaian</th>
              <th>Kekurangan</th>
              <th>Status</th>
              <th>Rekomendasi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="i">
              <td>{{ r.puskesmas }}</td>
              <td>{{ r.village_name }}</td>
              <td>{{ r.district_name || '-' }}</td>
              <td>{{ r.vaccine_name }}</td>
              <td>{{ r.target_value }}</td>
              <td>{{ r.realization_value }}</td>
              <td><span class="badge" :class="pctClass(r.pct)">{{ r.pct || 0 }}%</span></td>
              <td class="text-danger fw-bold">{{ r.gap }}</td>
              <td><span class="badge" :class="statusClass(r.status)">{{ r.status }}</span></td>
              <td>{{ rekomendasi(r) }}</td>
            </tr>
            <tr v-if="!filtered.length">
              <td colspan="10" class="text-center text-success">Semua target tercapai ✅</td>
            </tr>
          </tbody>
        </table>
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
      reportsApi.rencanaTindakLanjut({ month: month.value, year: year.value }),
      puskesmasApi.list()
    ])
    data.value = res.data.data
    puskesmasList.value = pRes.data.map(p => p.name)
  } catch { data.value = [] }
}
onMounted(load)
watch([month, year], load)

function pctClass(p) {
  const v = Number(p)
  if (v >= 95) return 'badge-success'
  if (v >= 50) return 'badge-warning'
  return 'badge-danger'
}
function statusClass(s) {
  if (s === 'Tercapai') return 'badge-success'
  if (s === 'Kurang') return 'badge-warning'
  return 'badge-danger'
}
function rekomendasi(r) {
  if (r.pct >= 80) return 'Intensifkan sweeping'
  if (r.pct >= 50) return 'Kunjungan rumah + sweeping'
  return 'Sweeping segera + koordinasi lintas sektor'
}
function print() { window.print() }
</script>
