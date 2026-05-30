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
            <option value="">Semua Kecamatan</option>
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
      <div class="card">
        <div class="card-header">Grafik Target vs Realisasi (Bulan Ini)</div>
        <div style="height: 260px;">
          <TargetRealisationChart
            :labels="chartLabels"
            :target-data="chartTarget"
            :realization-data="chartReal"
            title=""
          />
        </div>
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
import { eKohortApi, districtsApi } from '../../api'
import VillageMap from '../../components/eKohort/VillageMap.vue'
import LeafletMap from '../../components/eKohort/LeafletMap.vue'
import TargetRealisationChart from '../../components/charts/TargetRealisationChart.vue'

const router = useRouter()
const loading = ref(true)
const stats = ref({})
const districts = ref([])
const filterDistrict = ref('')

onMounted(async () => {
  try {
    const { data } = await districtsApi.list()
    districts.value = data
  } catch {}
  await loadData()
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

const chartLabels = computed(() => (stats.value.chartData || []).map(d => d.code))
const chartTarget = computed(() => (stats.value.chartData || []).map(d => Number(d.target_pct) || 80))
const chartReal = computed(() => (stats.value.chartData || []).map(d => {
  const total = d.target_count || 1
  return Math.min(100, Math.round((Number(d.real_count) / total) * 100))
}))

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}
</script>
