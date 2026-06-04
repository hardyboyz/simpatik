<template>
  <div v-if="!loading">
    <div class="grid grid-4 mb-2">
      <div class="stat-card" @click="router.push({ name: 'E-Kohort' })" style="cursor:pointer;">
        <div class="stat-value" style="color: var(--primary);">{{ stats.totalSasaran }}</div>
        <div class="stat-label">Total Sasaran Anak Tahun Ini</div>
      </div>
      <div class="stat-card" @click="router.push({ name: 'E-Kohort' })" style="cursor:pointer;">
        <div class="stat-value" style="color: var(--success);">{{ stats.imunisasiLengkap }}</div>
        <div class="stat-label">Anak Imunisasi Lengkap</div>
      </div>
      <div class="stat-card" @click="router.push({ name: 'ImunisasiKejar' })" style="cursor:pointer;">
        <div
          class="stat-value"
          :style="{ color: (stats.dropOut || 0) > 0 ? 'var(--danger)' : 'var(--success)' }"
        >{{ stats.dropOut || 0 }}</div>
        <div class="stat-label">
          <span :style="{ color: (stats.dropOut || 0) > 0 ? 'var(--danger)' : 'inherit' }">
            Drop-Out / Butuh Kejar {{ (stats.dropOut || 0) > 0 ? '⚠️' : '' }}
          </span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--info);">
          {{ stats.totalSasaran ? Math.round((stats.imunisasiLengkap / stats.totalSasaran) * 100) : 0 }}%
        </div>
        <div class="stat-label">Capaian Imunisasi</div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header flex-between">
        <span>Peta Digital Wilayah</span>
        <div class="flex gap-1">
          <select v-model="filterDistrict" class="form-select" style="width:200px;" @change="loadData">
            <option v-if="!auth.userDistrictId" value="">Semua Kecamatan</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <span style="font-size:0.75rem;color:var(--secondary);line-height:2rem;">Hijau = Aman, Merah = Drop-Out Tinggi</span>
        </div>
      </div>
      <div style="margin-bottom:0.75rem;">
        <LeafletMap :villages="stats.mapData || []" />
      </div>
      <VillageMap :villages="stats.mapData || []" />
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

    <div class="card mb-2">
      <div class="card-header flex-between">
        <span>Akumulasi Status Gizi per Desa</span>
        <div class="flex gap-1">
          <select v-model="growthDistrictFilter" class="form-select" style="width:160px;" @change="loadGrowthNutrition">
            <option v-if="!auth.userDistrictId" value="">Semua Kecamatan</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select v-model="growthMonth" class="form-select" style="width:120px;" @change="loadGrowthNutrition">
            <option value="">Bulan</option>
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model="growthYear" class="form-select" style="width:100px;" @change="loadGrowthNutrition">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Desa</th><th>Total Kids</th><th>Normal</th><th>Perhatian</th><th>Bahaya</th></tr>
          </thead>
          <tbody>
            <tr v-for="g in growthNutrition" :key="g.village_name">
              <td>{{ g.village_name }}</td>
              <td><strong>{{ g.total }}</strong></td>
              <td><span class="badge badge-success">{{ g.normal }}</span></td>
              <td><span class="badge badge-warning">{{ g.perhatian }}</span></td>
              <td><span class="badge badge-danger">{{ g.bahaya }}</span></td>
            </tr>
            <tr v-if="!growthNutrition.length">
              <td colspan="5" class="text-center" style="padding:2rem;color:var(--secondary);">Belum ada data pertumbuhan</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" v-if="(stats.recentDropOut || []).length > 0">
      <div class="card-header flex-between">
        <span style="color:var(--danger);">Anak Drop-Out Terbaru ⚠️</span>
        <router-link to="/ekohort/imunisasi-kejar" class="btn btn-sm btn-danger">Lihat Semua</router-link>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Nama Anak</th><th>Nama Ibu</th><th>Desa</th><th>Usia</th><th>Vaksin Terakhir</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            <tr v-for="k in stats.recentDropOut" :key="k.id">
              <td>{{ k.name }}</td>
              <td>{{ k.mother_name || '-' }}</td>
              <td>{{ k.village_name }}</td>
              <td>{{ k.age_months || '-' }} bln</td>
              <td>{{ k.last_vaccine_date && k.last_vaccine_date !== '-' ? formatDate(k.last_vaccine_date) : 'Belum ada' }}</td>
              <td>
                <router-link :to="`/ekohort/kms/${k.id}`" class="btn btn-sm btn-primary">Detail</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else class="loading"><div class="spinner"></div></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { eKohortApi, districtsApi, vaccinesApi } from '../../api'
import VillageMap from '../../components/eKohort/VillageMap.vue'
import LeafletMap from '../../components/eKohort/LeafletMap.vue'
import TargetRealisationChart from '../../components/charts/TargetRealisationChart.vue'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const stats = ref({})
const districts = ref([])
const vaccines = ref([])
const filterDistrict = ref(auth.userDistrictId || '')
const growthDistrictFilter = ref(auth.userDistrictId || '')
const growthNutrition = ref([])
const growthMonth = ref('')
const growthYear = ref(new Date().getFullYear())
const months = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Ags' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Okt' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Des' },
]
const years = []
for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y)
const vaksinLabels = ref([])
const targetValues = ref([])
const realisasiValues = ref([])
const filterChartVaccine = ref('')

onMounted(async () => {
  try {
    const { data } = await districtsApi.list()
    districts.value = data
  } catch {}
  try {
    const { data } = await vaccinesApi.list()
    vaccines.value = data
  } catch {}
  await Promise.all([loadData(), loadGrowthNutrition()])
  refreshChart()
})

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterDistrict.value) params.district_id = filterDistrict.value
    const { data } = await eKohortApi.dashboard(params)
    stats.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadGrowthNutrition() {
  try {
    const params = {}
    if (growthDistrictFilter.value) params.district_id = growthDistrictFilter.value
    if (growthMonth.value) params.month = growthMonth.value
    if (growthYear.value) params.year = growthYear.value
    const { data } = await eKohortApi.growthNutrition(params)
    growthNutrition.value = data
  } catch (e) { console.error(e) }
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
</script>
