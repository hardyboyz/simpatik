<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterMonth" class="form-select" style="width: 180px;">
          <option value="">Semua Bulan</option>
          <option v-for="(m, i) in MONTHS" :key="i" :value="String(i + 1).padStart(2, '0')">{{ m }}</option>
        </select>
        <select v-model="filterYear" class="form-select" style="width: 120px;">
          <option value="">Semua Tahun</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
        <select v-model="filterVillage" class="form-select" style="width: 200px;">
          <option value="">Semua Desa</option>
          <option v-for="v in villages" :key="v.id" :value="v.name">{{ v.name }}</option>
        </select>
      </div>
      <router-link to="/reports/new" class="btn btn-primary">+ Buat Laporan</router-link>
    </div>
    <div class="card">
      <div class="card-header">Laporan Bulanan Imunisasi</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="table.setSort('month')">Periode{{ table.sortIndicator('month') }}</th>
              <th class="sortable" @click="table.setSort('village_name')">Desa{{ table.sortIndicator('village_name') }}</th>
              <th>Puskesmas</th>
              <th>Vaksin</th>
              <th class="sortable" @click="table.setSort('target_value')">Sasaran{{ table.sortIndicator('target_value') }}</th>
              <th class="sortable" @click="table.setSort('realization_value')">Realisasi{{ table.sortIndicator('realization_value') }}</th>
              <th>Capaian</th>
              <th>Petugas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in table.paginatedData.value" :key="r.id">
              <td>{{ MONTHS[parseInt(r.month) - 1] }} {{ r.year }}</td>
              <td>{{ r.village_name }}</td>
              <td>{{ r.puskesmas || '-' }}</td>
              <td>{{ getVaccineName(r.vaccine_code) }}</td>
              <td>{{ r.target_value || 0 }}</td>
              <td>{{ r.realization_value || 0 }}</td>
              <td>
                <span class="badge" :class="getCapaianClass(r)">
                  {{ r.target_value ? Math.round((r.realization_value / r.target_value) * 100) : 0 }}%
                </span>
              </td>
              <td>{{ r.officer || '-' }}</td>
              <td><button class="btn btn-icon" title="Hapus" @click="handleDelete(r.id)">🗑️</button></td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="9" class="text-center" style="color: var(--secondary);">Belum ada laporan</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        :currentPage="table.currentPage.value"
        :totalPages="table.totalPages.value"
        :total="table.sortedData.value.length"
        :perPage="table.perPage"
        :pageRange="table.pageRange.value"
        @go="table.goToPage"
      />
    </div>
    <div class="card">
      <div class="card-header">Ringkasan</div>
      <div class="grid grid-3">
        <div class="stat-card">
          <div class="stat-value" style="color: var(--primary);">{{ totalTarget }}</div>
          <div class="stat-label">Total Sasaran</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--success);">{{ totalRealization }}</div>
          <div class="stat-label">Total Realisasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--info);">{{ avgCapaian }}%</div>
          <div class="stat-label">Rata-rata Capaian</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useVaccinesStore } from '../../stores/vaccines'
import { vaccinesApi, villagesApi } from '../../api'
import { MONTHS } from '../../config/masterData'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const vaccinesStore = useVaccinesStore()
const scope = useUserScope()
const filterMonth = ref('')
const filterYear = ref('')
const filterVillage = ref('')
const villages = ref([])
const vaccines = ref([])

onMounted(async () => {
  const now = new Date()
  filterMonth.value = String(now.getMonth() + 1).padStart(2, '0')
  filterYear.value = String(now.getFullYear())
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    villages.value = vilRes.data
    if (!scope.isAdmin.value && scope.villageId.value) {
      villages.value = villages.value.filter(v => v.id === Number(scope.villageId.value))
      const v = villages.value[0]
      if (v) filterVillage.value = v.name
    }
  } catch {}
  await loadData()
})

async function loadData() {
  await vaccinesStore.loadRealizations({
    month: filterMonth.value || undefined,
    year: filterYear.value || undefined,
    village_id: filterVillage.value ? undefined : undefined
  })
}

watch([filterMonth, filterYear, filterVillage], loadData)

const filteredReports = computed(() => {
  let result = vaccinesStore.realizationData
  if (filterVillage.value) {
    result = result.filter(r => r.village_name === filterVillage.value)
  }
  return result
})

const table = useTable(filteredReports)

const years = computed(() => [...new Set(vaccinesStore.realizationData.map(r => r.year))].sort().reverse())

const totalTarget = computed(() => filteredReports.value.reduce((s, r) => s + (Number(r.target_value) || 0), 0))
const totalRealization = computed(() => filteredReports.value.reduce((s, r) => s + (Number(r.realization_value) || 0), 0))
const avgCapaian = computed(() => {
  const withTarget = filteredReports.value.filter(r => Number(r.target_value) > 0)
  if (!withTarget.length) return 0
  const total = withTarget.reduce((s, r) => s + (Number(r.realization_value) || 0) / (Number(r.target_value) || 1), 0)
  return Math.round((total / withTarget.length) * 100)
})

function getVaccineName(code) {
  const v = vaccines.value.find(v => v.code === code)
  return v ? v.name : code
}

function getCapaianClass(r) {
  const pct = r.target_value ? (r.realization_value / r.target_value) * 100 : 0
  if (pct >= 95) return 'badge-success'
  if (pct >= 50) return 'badge-warning'
  return 'badge-danger'
}

async function handleDelete(id) {
  Swal.fire({
    title: 'Hapus Laporan?',
    text: 'Yakin ingin menghapus laporan ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await vaccinesStore.deleteRealization(id)
      Swal.fire('Terhapus!', 'Laporan berhasil dihapus.', 'success')
    }
  })
}
</script>
