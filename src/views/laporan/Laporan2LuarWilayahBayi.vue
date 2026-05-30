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
      <div class="card-header">LAPORAN HASIL IMUNISASI RUTIN BAYI UNTUK LUAR WILAYAH PUSKESMAS</div>
      <div class="card-body">Periode: {{ MONTHS[parseInt(month) - 1] }} {{ year }}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Puskesmas Pelapor</th>
              <th>Desa</th>
              <th>Kecamatan</th>
              <th>Puskesmas Asal Desa</th>
              <th>Vaksin</th>
              <th>Sasaran</th>
              <th>Realisasi</th>
              <th>Capaian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in data" :key="i">
              <td>{{ i + 1 }}</td>
              <td>{{ r.puskesmas }}</td>
              <td>{{ r.village_name }}</td>
              <td>{{ r.district_name || '-' }}</td>
              <td>{{ r.village_puskesmas || '-' }}</td>
              <td>{{ r.vaccine_name }}</td>
              <td>{{ r.target_value }}</td>
              <td>{{ r.realization_value }}</td>
              <td><span class="badge" :class="pctClass(pct(r))">{{ pct(r) }}%</span></td>
            </tr>
            <tr v-if="!data.length">
              <td colspan="9" class="text-center text-muted">Tidak ada data luar wilayah</td>
            </tr>
          </tbody>
        </table>
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
    const res = await reportsApi.luarWilayah({ month: month.value, year: year.value })
    data.value = res.data.data
  } catch { data.value = [] }
}
onMounted(load)
watch([month, year], load)

function pct(r) {
  return r.target_value ? Math.round((r.realization_value / r.target_value) * 100) : 0
}
function pctClass(p) {
  if (p >= 95) return 'badge-success'
  if (p >= 50) return 'badge-warning'
  return 'badge-danger'
}
function print() { window.print() }
</script>
