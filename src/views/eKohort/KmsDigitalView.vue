<template>
  <div>
    <div v-if="!kidDetail" class="card mb-2">
      <div class="card-header flex-between">
        <span>Cari Data Anak (KMS Digital)</span>
        <span style="font-size:0.75rem;color:var(--secondary);">Ketik nama anak, nama ibu, atau scan NIK</span>
      </div>
      <div class="search-row">
        <input v-model="searchQuery" class="form-input" placeholder="Cari nama anak / ibu / NIK..."
          @keyup.enter="searchKids" style="flex:1;">
        <button class="btn btn-primary" @click="searchKids" :disabled="!searchQuery">Cari</button>
      </div>
      <div v-if="searchResults.length > 0" class="search-results mt-1">
        <div
          v-for="k in searchResults" :key="k.id"
          class="search-item"
          :class="{ active: selectedKid?.id === k.id }"
          @click="selectKid(k)"
        >
          <div class="search-name">{{ k.name }}</div>
          <div class="search-meta">{{ k.mother_name || '-' }} | {{ k.village_name }} | {{ k.nik || '-' }}</div>
          <span class="badge" :class="k.status === 'completed' ? 'badge-success' : 'badge-warning'">
            {{ k.status === 'completed' ? 'Lengkap' : 'Belum' }}
          </span>
        </div>
      </div>
      <div v-if="searched && !searchResults.length" class="empty-search mt-1">
        Tidak ditemukan data anak dengan kata kunci "{{ searchQuery }}"
      </div>
    </div>

    <div v-if="kidDetail" class="grid grid-2 mb-2">
      <div class="card">
        <div class="card-header flex-between">
          <span>Cari Data Anak (KMS Digital)</span>
          <span style="font-size:0.75rem;color:var(--secondary);">Ketik nama anak, nama ibu, atau scan NIK</span>
        </div>
        <div class="search-row">
          <input v-model="searchQuery" class="form-input" placeholder="Cari nama anak / ibu / NIK..."
            @keyup.enter="searchKids" style="flex:1;">
          <button class="btn btn-primary" @click="searchKids" :disabled="!searchQuery">Cari</button>
        </div>
        <div v-if="searchResults.length > 0" class="search-results mt-1">
          <div
            v-for="k in searchResults" :key="k.id"
            class="search-item"
            :class="{ active: selectedKid?.id === k.id }"
            @click="selectKid(k)"
          >
            <div class="search-name">{{ k.name }}</div>
            <div class="search-meta">{{ k.mother_name || '-' }} | {{ k.village_name }} | {{ k.nik || '-' }}</div>
            <span class="badge" :class="k.status === 'completed' ? 'badge-success' : 'badge-warning'">
              {{ k.status === 'completed' ? 'Lengkap' : 'Belum' }}
            </span>
          </div>
        </div>
        <div v-if="searched && !searchResults.length" class="empty-search mt-1">
          Tidak ditemukan data anak dengan kata kunci "{{ searchQuery }}"
        </div>
      </div>
      <div class="card">
        <div class="card-header">Biodata Anak</div>
        <table class="info-table">
          <tr><td>Nama</td><td>: <strong>{{ kidDetail.name }}</strong></td></tr>
          <tr><td>NIK</td><td>: {{ kidDetail.nik || '-' }}</td></tr>
          <tr><td>Tgl Lahir</td><td>: {{ formatDate(kidDetail.birth_date) }}</td></tr>
          <tr><td>JK</td><td>: {{ kidDetail.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</td></tr>
          <tr><td>Ibu</td><td>: {{ kidDetail.mother_name || '-' }}</td></tr>
          <tr><td>Ayah</td><td>: {{ kidDetail.father_name || '-' }}</td></tr>
          <tr><td>Desa</td><td>: {{ kidDetail.village_name }}</td></tr>
          <tr><td>Alamat</td><td>: {{ kidDetail.address || '-' }}</td></tr>
          <tr><td>Telepon</td><td>: {{ kidDetail.phone || '-' }}</td></tr>
        </table>
      </div>
    </div>

    <div v-if="kidDetail" class="grid grid-2 mb-2">
      <div class="card">
        <div class="card-header">Riwayat Pertumbuhan (BB/TB)</div>
        <GrowthChart :records="growthRecords" :birth-date="kidDetail.birth_date" :gender="kidDetail.gender" />
      </div>
      <div class="card">
        <div class="card-header flex-between">
          <span>Riwayat Ukur (BB/TB)</span>
          <button class="btn btn-sm btn-outline" @click="showGrowthForm = !showGrowthForm">
            {{ showGrowthForm ? 'Tutup' : '+ Input Baru' }}
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Tanggal</th><th>Usia</th><th>BB (kg)</th><th>TB (cm)</th><th>Status Gizi</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="r in growthRecords" :key="r.id">
                <td>{{ formatDate(r.date_measured) }}</td>
                <td>{{ formatAge(r.date_measured) }}</td>
                <td>{{ r.weight }}</td>
                <td>{{ r.height || '-' }}</td>
                <td>
                  <span class="badge" :class="statusBadgeClass(r)">{{ statusLabel(r) }}</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem;font-size:0.7rem;" @click="editGrowth(r)">✏️</button>
                  <button class="btn btn-sm btn-outline" style="padding:0.2rem 0.4rem;font-size:0.7rem;border-color:#dc3545;color:#dc3545;" @click="confirmDeleteGrowth(r)">🗑️</button>
                </td>
              </tr>
              <tr v-if="!growthRecords.length">
                <td colspan="6" class="text-center" style="padding:1.5rem;color:var(--secondary);">Belum ada riwayat ukur</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="showGrowthForm" class="growth-form mt-1">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Berat Badan (kg)</label>
              <input v-model.number="newGrowth.weight" type="number" step="0.1" class="form-input" placeholder="Contoh: 8.5">
            </div>
            <div class="form-group">
              <label class="form-label">Tinggi Badan (cm)</label>
              <input v-model.number="newGrowth.height" type="number" step="0.1" class="form-input" placeholder="Contoh: 72">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tanggal Ukur</label>
              <input v-model="newGrowth.date_measured" type="date" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">Status Gizi</label>
              <input :value="autoCalcStatus(newGrowth.weight, newGrowth.date_measured)" class="form-input" readonly style="background:#f1f5f9;">
            </div>
          </div>
          <p v-if="newGrowth.weight && newGrowth.date_measured" style="font-size:0.75rem;color:var(--secondary);margin:0.25rem 0 0;">
            Status gizi dihitung otomatis berdasarkan grafik KMS WHO (BB/U)
          </p>
          <button class="btn btn-primary btn-sm mt-1" @click="saveGrowth" :disabled="savingGrowth">
            {{ savingGrowth ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="kidDetail" class="grid grid-2 mb-2">
      <div v-if="vaccineHistory.length > 0" class="card">
        <div class="card-header">Riwayat Lengkap Vaksinasi</div>
        <div class="table-container">
          <table>
            <thead><tr><th>Vaksin</th><th>Tanggal</th><th>Petugas</th><th>Batch</th><th>Keterangan</th></tr></thead>
            <tbody>
              <tr v-for="v in vaccineHistory" :key="v.id">
                <td>{{ v.vaccine_name || v.vaccine_code }}</td>
                <td>{{ formatDate(v.date_administered) }}</td>
                <td>{{ v.officer || '-' }}</td>
                <td>{{ v.batch_no || '-' }}</td>
                <td>{{ v.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card mb-2" style="max-width:100%;">
        <div class="card-header flex-between">
          <span @click="showImmunization = !showImmunization" style="cursor:pointer;user-select:none;">
            {{ showImmunization ? '👁' : '👁‍🗨' }} Daftar Riwayat Imunisasi
          </span>
          <router-link :to="`/ekohort/pelayanan`" class="btn btn-sm btn-primary">Input Vaksin</router-link>
        </div>
        <VaccineChecklist v-show="showImmunization" :schedule="vaccineSchedule" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { eKohortApi } from '../../api'
import { getWHOZScore } from '../../data/whoGrowthStandards'
import GrowthChart from '../../components/eKohort/GrowthChart.vue'
import VaccineChecklist from '../../components/eKohort/VaccineChecklist.vue'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const searched = ref(false)
const searchResults = ref([])
const selectedKid = ref(null)
const kidDetail = ref(null)
const vaccineHistory = ref([])
const growthRecords = ref([])
const vaccineSchedule = ref([])
const showGrowthForm = ref(false)
const savingGrowth = ref(false)
const showImmunization = ref(true)

const newGrowth = ref({
  weight: null, height: null, date_measured: new Date().toISOString().slice(0, 10),
  nutritional_status: '', notes: ''
})

function calcAgeMonths(birthDate, dateMeasured) {
  if (!birthDate || !dateMeasured) return null
  const birth = new Date(birthDate)
  const measured = new Date(dateMeasured)
  return (measured - birth) / (30.4375 * 24 * 60 * 60 * 1000)
}

function autoCalcStatus(weight, dateMeasured) {
  if (!weight || !dateMeasured || !kidDetail.value) return ''
  const ageMonths = calcAgeMonths(kidDetail.value.birth_date, dateMeasured)
  if (ageMonths === null || ageMonths < 0 || ageMonths > 60) return ''
  const z3 = getWHOZScore(kidDetail.value.gender, ageMonths, -3)
  const z2 = getWHOZScore(kidDetail.value.gender, ageMonths, -2)
  const z1 = getWHOZScore(kidDetail.value.gender, ageMonths, 2)
  if (z3 === null || z2 === null || z1 === null) return ''
  if (weight < z3) return 'gizi-buruk'
  if (weight < z2) return 'gizi-kurang'
  if (weight > z1) return 'overweight'
  return ''
}

function statusLabel(r) {
  const s = r.nutritional_status || autoCalcStatus(r.weight, r.date_measured)
  if (!s) return 'Normal'
  if (s === 'gizi-kurang' || s === 'stunting') return 'Warning'
  return 'Danger'
}

function statusBadgeClass(r) {
  const s = r.nutritional_status || autoCalcStatus(r.weight, r.date_measured)
  if (!s) return 'badge-success'
  if (s === 'gizi-kurang' || s === 'stunting') return 'badge-warning'
  return 'badge-danger'
}

onMounted(async () => {
  if (route.params.id) {
    searchQuery.value = ''
    await loadKidDetail(route.params.id)
  }
})

async function searchKids() {
  if (!searchQuery.value) return
  searched.value = true
  try {
    const { data } = await eKohortApi.kmsSearch(searchQuery.value)
    searchResults.value = data
    if (data.length === 1) await selectKid(data[0])
  } catch { searchResults.value = [] }
}

async function selectKid(kid) {
  selectedKid.value = kid
  await loadKidDetail(kid.id)
}

async function loadKidDetail(id) {
  try {
    const { data } = await eKohortApi.kmsDetail(id)
    kidDetail.value = data.kid
    vaccineHistory.value = data.vaccineHistory || []
    growthRecords.value = data.growthRecords || []
    vaccineSchedule.value = data.vaccineSchedule || []
  } catch { kidDetail.value = null }
}

async function saveGrowth() {
  if (!kidDetail.value?.id) return
  savingGrowth.value = true
  try {
    const payload = { ...newGrowth.value }
    payload.nutritional_status = autoCalcStatus(payload.weight, payload.date_measured)
    if (newGrowth.value.editingId) {
      await eKohortApi.kmsUpdateGrowth(newGrowth.value.editingId, payload)
    } else {
      await eKohortApi.kmsAddGrowth(kidDetail.value.id, payload)
    }
    const { data } = await eKohortApi.kmsDetail(kidDetail.value.id)
    growthRecords.value = data.growthRecords || []
    showGrowthForm.value = false
    newGrowth.value = {
      weight: null, height: null, date_measured: new Date().toISOString().slice(0, 10),
      nutritional_status: '', notes: ''
    }
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data pertumbuhan disimpan', timer: 1200, showConfirmButton: false })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
  }
  finally { savingGrowth.value = false }
}

function editGrowth(r) {
  newGrowth.value = {
    weight: r.weight,
    height: r.height,
    date_measured: r.date_measured ? r.date_measured.slice(0, 10) : new Date().toISOString().slice(0, 10),
    nutritional_status: r.nutritional_status || '',
    notes: r.notes || '',
    editingId: r.id
  }
  showGrowthForm.value = true
}

function confirmDeleteGrowth(r) {
  Swal.fire({
    title: 'Hapus Riwayat Ukur?',
    text: `Tanggal ${formatDate(r.date_measured)} — BB ${r.weight} kg akan dihapus`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal'
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        await eKohortApi.kmsDeleteGrowth(r.id)
        const { data } = await eKohortApi.kmsDetail(kidDetail.value.id)
        growthRecords.value = data.growthRecords || []
        Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1200, showConfirmButton: false })
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
      }
    }
  })
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

function formatAge(dateMeasured) {
  if (!dateMeasured || !kidDetail.value?.birth_date) return '-'
  const m = calcAgeMonths(kidDetail.value.birth_date, dateMeasured)
  if (m === null || m < 0) return '-'
  const months = Math.floor(m)
  if (months < 24) return `${months} bln`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem ? `${years} thn ${rem} bln` : `${years} thn`
}
</script>

<style scoped>
.search-row { display: flex; gap: 0.5rem; }
.search-results { max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.375rem; }
.search-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.75rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.search-item:hover { background: #f8fafc; }
.search-item.active { background: #dbeafe; }
.search-item:last-child { border-bottom: none; }
.search-name { font-weight: 500; flex: 1; }
.search-meta { font-size: 0.75rem; color: var(--secondary); flex: 1; }
.empty-search { text-align: center; padding: 1rem; color: var(--secondary); font-size: 0.85rem; }
.info-table { width: 100%; }
.info-table td { padding: 0.3rem 0.5rem; font-size: 0.85rem; }
.info-table td:first-child { width: 100px; color: var(--secondary); white-space: nowrap; }
.growth-form { background: #f8fafc; padding: 0.75rem; border-radius: 0.375rem; border: 1px solid #e2e8f0; }
</style>
