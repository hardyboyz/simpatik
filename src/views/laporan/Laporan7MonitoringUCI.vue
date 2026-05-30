<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="year" class="form-select" style="width: 120px;">
          <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <button class="btn btn-outline-primary" @click="print">🖨️ Cetak</button>
    </div>
    <div class="card" id="print-area">
      <div class="card-header">MONITORING DESA MENUJU UCI PER PUSKESMAS DI KABUPATEN</div>
      <div class="card-body">Tahun: {{ year }}</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Puskesmas</th>
              <th>Kecamatan</th>
              <th>Total Desa</th>
              <th>Desa UCI</th>
              <th>Desa Belum UCI</th>
              <th>% UCI</th>
              <th>Grafik</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in data" :key="i">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ r.puskesmas }}</strong></td>
              <td>{{ r.district_name || '-' }}</td>
              <td>{{ r.total_villages }}</td>
              <td class="text-success fw-bold">{{ r.uci_villages }}</td>
              <td class="text-danger fw-bold">{{ r.non_uci_villages }}</td>
              <td><span class="badge" :class="r.uci_pct >= 80 ? 'badge-success' : 'badge-warning'">{{ r.uci_pct || 0 }}%</span></td>
              <td style="min-width: 120px;">
                <div class="bar-wrapper">
                  <div class="bar-fill" :style="{ width: (r.uci_pct || 0) + '%', background: r.uci_pct >= 80 ? 'var(--success)' : 'var(--warning)' }"></div>
                </div>
              </td>
            </tr>
            <tr v-if="!data.length">
              <td colspan="8" class="text-center text-muted">Belum ada data</td>
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

const year = ref(String(new Date().getFullYear()))
const data = ref([])
const yearList = computed(() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})

async function load() {
  try {
    const res = await reportsApi.monitoringUci({ year: year.value })
    data.value = res.data.data
  } catch { data.value = [] }
}
onMounted(load)
watch(year, load)

function print() { window.print() }
</script>

<style scoped>
.bar-wrapper { height: 18px; background: #e9ecef; border-radius: 9px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 9px; transition: width 0.5s; }
</style>
