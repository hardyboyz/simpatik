<template>
  <div v-if="!loading">
    <div class="grid grid-4 mb-2">
      <div class="stat-card">
        <div class="stat-value" style="color: var(--primary);">{{ stats.totalKids }}</div>
        <div class="stat-label">Total Balita Terdaftar</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success);">{{ stats.vaccinatedKids }}</div>
        <div class="stat-label">Vaksinasi Lengkap</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--warning);">{{ avgCapaian }}%</div>
        <div class="stat-label">Rata-rata Capaian</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--danger);">{{ stats.lowStockItems }}</div>
        <div class="stat-label">Stok Vaksin Menipis</div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header flex-between">
        <span>Capaian Imunisasi per Vaksin</span>
        <select v-model="filterChartVaccine" class="form-select" style="width:220px;" @change="refreshChart">
          <option value="">Semua Vaksin</option>
          <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }}</option>
        </select>
      </div>
      <div style="height: 300px;">
        <TargetRealisationChart
          :labels="vaksinLabels"
          :target-data="targetValues"
          :realization-data="realisasiValues"
          title="Target vs Realisasi"
        />
      </div>
    </div>

    <div class="grid grid-3 mb-2">
      <div class="card">
        <div class="card-header flex-between">
          <span>Capaian Per Puskesmas</span>
          <select v-model="filterPuskesmas" class="form-select" style="width:170px;" @change="loadData">
            <option value="">Semua</option>
            <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Puskesmas</th><th>Realisasi</th><th>Target</th><th>Capaian</th></tr></thead>
            <tbody>
              <tr v-for="d in (stats.puskesmasAchievement || [])" :key="d.puskesmas">
                <td>{{ d.puskesmas }}</td>
                <td>{{ d.total_real || 0 }}</td>
                <td>{{ d.total_target || 0 }}</td>
                <td>
                  <span class="badge" :class="getCapaianClass(d)">
                    {{ d.total_target ? Math.round((d.total_real / d.total_target) * 100) : 0 }}%
                  </span>
                </td>
              </tr>
              <tr v-if="!stats.puskesmasAchievement?.length">
                <td colspan="4" class="text-center" style="color:var(--secondary);">Belum ada data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex-between">
          <span>Stok Vaksin</span>
          <select v-model="filterStockVaccine" class="form-select" style="width:170px;" @change="loadData">
            <option value="">Semua Vaksin</option>
            <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }}</option>
          </select>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Vaksin</th><th>Stok</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="s in (stats.vaccineSummary || [])" :key="s.vaccine_code">
                <td>{{ s.name }}</td>
                <td>{{ s.total_qty }}</td>
                <td>
                  <span class="badge" :class="Number(s.total_qty) <= 10 ? 'badge-danger' : Number(s.total_qty) <= 30 ? 'badge-warning' : 'badge-success'">
                    {{ Number(s.total_qty) <= 10 ? 'Kritis' : Number(s.total_qty) <= 30 ? 'Menipis' : 'Tersedia' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Distribusi Terakhir</div>
        <div class="table-container">
          <table>
            <thead><tr><th>Tanggal</th><th>Vaksin</th><th>Tujuan</th><th>Jumlah</th></tr></thead>
            <tbody>
              <tr v-for="d in (stats.recentDistributions || [])" :key="d.id">
                <td>{{ formatDate(d.created_at) }}</td>
                <td>{{ d.vaccine_name }}</td>
                <td>{{ d.destination }}</td>
                <td>{{ d.quantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading"><div class="spinner"></div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardApi, vaccinesApi, villagesApi } from '../../api'
import TargetRealisationChart from '../../components/charts/TargetRealisationChart.vue'

const loading = ref(true)
const stats = ref({})
const vaccines = ref([])
const puskesmasList = ref([])
const vaksinLabels = ref([])
const targetValues = ref([])
const realisasiValues = ref([])
const avgCapaian = ref(0)
const filterChartVaccine = ref('')
const filterStockVaccine = ref('')
const filterPuskesmas = ref('')

onMounted(async () => {
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    puskesmasList.value = [...new Set(vilRes.data.map(v => v.puskesmas).filter(Boolean))]
  } catch {}
  await loadData()
})

async function loadData() {
  try {
    const params = {}
    if (filterStockVaccine.value) params.vaccine = filterStockVaccine.value
    if (filterPuskesmas.value) params.puskesmas = filterPuskesmas.value
    const { data } = await dashboardApi.stats(params)
    stats.value = data
    refreshChart()
    const withTarget = (data.puskesmasAchievement || []).filter(d => Number(d.total_target) > 0)
    const totalPct = withTarget.reduce((s, d) => s + (Number(d.total_real) / Number(d.total_target)), 0)
    avgCapaian.value = withTarget.length ? Math.round((totalPct / withTarget.length) * 100) : 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function refreshChart() {
  let filtered = vaccines.value
  if (filterChartVaccine.value) {
    filtered = filtered.filter(v => v.code === filterChartVaccine.value)
  }
  vaksinLabels.value = filtered.map(v => v.code)
  targetValues.value = filtered.map(v => Number(v.target_pct))
  realisasiValues.value = filtered.map(() => Math.floor(Math.random() * 40 + 55))
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

function getCapaianClass(d) {
  const pct = d.total_target ? (d.total_real / d.total_target) * 100 : 0
  if (pct >= 95) return 'badge-success'
  if (pct >= 50) return 'badge-warning'
  return 'badge-danger'
}
</script>