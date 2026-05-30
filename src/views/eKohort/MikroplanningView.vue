<template>
  <div>
    <div class="card mb-2" style="border-left: 4px solid var(--success);">
      <div class="card-header flex-between">
        <span>Mikroplanning & Kebutuhan Logistik</span>
        <button class="btn btn-success" @click="exportData">📥 Unduh PDF/Excel</button>
      </div>
      <div class="filter-row">
        <select v-model="filterPuskesmas" class="form-select" style="width:220px;" @change="loadAll">
          <option value="">Semua Puskesmas</option>
          <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Tabel Estimasi Kebutuhan Logistik Per Desa</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Desa</th>
              <th>Puskesmas</th>
              <th v-for="v in vaccines" :key="v.code">{{ v.vaccine_name }}</th>
              <th>Estimasi Spuit (0.5ml)</th>
              <th>Estimasi Safety Box</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in mikroData" :key="d.village_name">
              <td><strong>{{ d.village_name }}</strong></td>
              <td>{{ d.puskesmas }}</td>
              <td v-for="v in vaccines" :key="v.code">
                <div class="need-info">
                  <span>{{ getVaccineNeed(d, v.code)?.need_vials || 0 }} vial</span>
                  <span class="need-children">({{ getVaccineNeed(d, v.code)?.need_children || 0 }} anak)</span>
                </div>
              </td>
              <td>
                {{ totalSyringes(d) }} spuit
              </td>
              <td>
                {{ Math.ceil(totalSyringes(d) / 100) }} box
              </td>
            </tr>
            <tr v-if="!mikroData.length">
              <td :colspan="vaccines.length + 4" class="text-center" style="padding:2rem;color:var(--secondary);">
                {{ loading ? 'Memuat data...' : 'Pilih puskesmas untuk melihat estimasi' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-2 mb-2">
      <div class="card">
        <div class="card-header">⚠️ Peringatan Kadaluwarsa Vaksin</div>
        <div v-if="expiringStock.length" class="table-container">
          <table>
            <thead><tr><th>Vaksin</th><th>Batch</th><th>Exp.Date</th><th>Sisa</th><th>Hari Lagi</th></tr></thead>
            <tbody>
              <tr v-for="s in expiringStock" :key="s.id"
                :class="{ 'expiring-soon': s.days_until_expiry <= 30 }">
                <td>{{ s.vaccine_name }}</td>
                <td>{{ s.batch_no || '-' }}</td>
                <td>{{ formatDate(s.expiry_date) }}</td>
                <td>{{ s.quantity }}</td>
                <td>
                  <span class="badge" :class="s.days_until_expiry <= 30 ? 'badge-danger' : 'badge-warning'">
                    {{ s.days_until_expiry }} hari
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">Tidak ada vaksin mendekati kadaluwarsa</div>
      </div>

      <div class="card">
        <div class="card-header">📊 Stok Vaksin Puskesmas</div>
        <div class="stock-grid">
          <div v-for="s in stockSummary" :key="s.code" class="stock-item">
            <div class="stock-name">{{ s.name }}</div>
            <div class="stock-bar">
              <div class="stock-fill" :style="{ width: Math.min(100, (s.current_qty / (s.max_qty || 1)) * 100) + '%' }"
                :class="s.current_qty <= 10 ? 'fill-danger' : s.current_qty <= 30 ? 'fill-warning' : 'fill-success'">
              </div>
            </div>
            <div class="stock-qty">{{ s.current_qty }} vial</div>
          </div>
          <div v-if="!stockSummary.length" class="empty-state" style="grid-column:1/-1;">Data stok tidak tersedia</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { eKohortApi, villagesApi, vaccinesApi } from '../../api'
import Swal from 'sweetalert2'

const loading = ref(true)
const puskesmasList = ref([])
const filterPuskesmas = ref('')
const mikroData = ref([])
const vaccines = ref([])
const expiringStock = ref([])

const stockSummary = ref([])

onMounted(async () => {
  try {
    const [vilRes, vacRes] = await Promise.all([villagesApi.list(), vaccinesApi.list()])
    puskesmasList.value = [...new Set(vilRes.data.map(v => v.puskesmas).filter(Boolean))]
    vaccines.value = (vacRes.data || []).filter(v => v.category === 'Bayi').map(v => ({
      code: v.code, vaccine_name: v.name, age_months: v.age_months, dose_order: v.dose_order,
      dose_per_vial: ['HB0', 'BCG', 'POLIO1'].includes(v.code) ? 1 : 0.5
    }))
  } catch {}
  await loadAll()
})

async function loadAll() {
  loading.value = true
  try {
    const params = {}
    if (filterPuskesmas.value) params.puskesmas = filterPuskesmas.value

    const expParams = filterPuskesmas.value ? { puskesmas: filterPuskesmas.value } : {}
    const [mikroRes, expRes, stockRes] = await Promise.all([
      eKohortApi.mikroplanning(params),
      eKohortApi.stockExpiring(expParams),
      eKohortApi.dashboard(params)
    ])

    mikroData.value = mikroRes.data?.data || []
    expiringStock.value = expRes.data || []

    const chartData = stockRes.data?.chartData || []
    stockSummary.value = chartData.map(d => ({
      code: d.code, name: d.name,
      current_qty: Number(d.real_count) || 0,
      max_qty: Math.max(Number(d.target_count) || 1, Number(d.real_count) || 0)
    }))
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function getVaccineNeed(desa, vaccineCode) {
  return (desa.vaccines || []).find(v => v.vaccine_code === vaccineCode) || null
}

function totalSyringes(desa) {
  return (desa.vaccines || []).reduce((sum, v) => sum + (v.need_syringes || 0), 0)
}

function exportData() {
  Swal.fire({
    title: 'Ekspor Data',
    text: 'Data mikroplanning akan diunduh dalam format Excel.',
    icon: 'info',
    confirmButtonText: 'Unduh',
    showCancelButton: true,
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(mikroData.value.flatMap(d =>
          (d.vaccines || []).map(v => ({
            Desa: d.village_name,
            Puskesmas: d.puskesmas,
            Vaksin: v.vaccine_name,
            'Kebutuhan Anak': v.need_children,
            'Kebutuhan Vial': v.need_vials,
            'Kebutuhan Spuit': v.need_syringes
          }))
        ))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Mikroplanning')
        XLSX.writeFile(wb, `mikroplanning_${new Date().toISOString().slice(0, 10)}.xlsx`)
        Swal.fire('Berhasil', 'File berhasil diunduh', 'success')
      }).catch(() => {
        Swal.fire('Gagal', 'Library XLSX tidak tersedia. Data dapat dicopy manual.', 'error')
      })
    }
  })
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}
</script>

<style scoped>
.filter-row { display: flex; gap: 0.5rem; align-items: center; }
.empty-state { text-align: center; padding: 1.5rem; color: var(--secondary); font-size: 0.85rem; }
.expiring-soon { background: #fef2f2; }
.need-info { display: flex; flex-direction: column; line-height: 1.3; }
.need-children { font-size: 0.7rem; color: var(--secondary); }
.stock-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.stock-item { display: flex; align-items: center; gap: 0.5rem; }
.stock-name { width: 80px; font-size: 0.8rem; font-weight: 500; flex-shrink: 0; }
.stock-bar { flex: 1; height: 16px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.stock-fill { height: 100%; border-radius: 999px; transition: width 0.5s; }
.fill-success { background: var(--success); }
.fill-warning { background: var(--warning); }
.fill-danger { background: var(--danger); }
.stock-qty { width: 50px; text-align: right; font-size: 0.8rem; font-weight: 500; }
@media (max-width: 768px) { .filter-row { flex-wrap: wrap; } }
</style>
