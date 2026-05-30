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
        <div class="card-header flex-between">
          <span>Riwayat Pertumbuhan (BB/TB)</span>
          <button class="btn btn-sm btn-outline" @click="showGrowthForm = !showGrowthForm">
            + Input Baru
          </button>
        </div>
        <GrowthChart :records="growthRecords" :birth-date="kidDetail.birth_date" :gender="kidDetail.gender" />
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
              <select v-model="newGrowth.nutritional_status" class="form-select">
                <option value="">Normal</option>
                <option value="stunting">Stunting</option>
                <option value="gizi-kurang">Gizi Kurang</option>
                <option value="gizi-buruk">Gizi Buruk</option>
                <option value="overweight">Overweight</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" @click="saveGrowth" :disabled="savingGrowth">
            {{ savingGrowth ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
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
    </div>

    <div v-if="kidDetail" class="card mb-2" style="max-width:50%;">
      <div class="card-header flex-between">
        <span @click="showImmunization = !showImmunization" style="cursor:pointer;user-select:none;">
          {{ showImmunization ? '👁' : '👁‍🗨' }} Daftar Riwayat Imunisasi
        </span>
        <router-link :to="`/ekohort/pelayanan`" class="btn btn-sm btn-primary">Input Vaksin</router-link>
      </div>
      <VaccineChecklist v-show="showImmunization" :schedule="vaccineSchedule" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { eKohortApi } from '../../api'
import GrowthChart from '../../components/eKohort/GrowthChart.vue'
import VaccineChecklist from '../../components/eKohort/VaccineChecklist.vue'

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
    await eKohortApi.kmsAddGrowth(kidDetail.value.id, newGrowth.value)
    const { data } = await eKohortApi.kmsDetail(kidDetail.value.id)
    growthRecords.value = data.growthRecords || []
    showGrowthForm.value = false
    newGrowth.value = {
      weight: null, height: null, date_measured: new Date().toISOString().slice(0, 10),
      nutritional_status: '', notes: ''
    }
  } catch (e) { alert('Gagal: ' + (e.response?.data?.error || e.message)) }
  finally { savingGrowth.value = false }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
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
