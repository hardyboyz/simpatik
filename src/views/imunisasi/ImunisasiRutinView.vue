<template>
  <div>
    <div class="card mb-2">
      <div class="card-header">Filter Pencarian</div>
      <div class="card-body">
        <div class="search-row">
          <div class="form-group">
            <label class="form-label">Kecamatan</label>
            <select v-model="filterDistrict" class="form-select" @change="onDistrictChange">
              <option v-if="districts.length > 1" value="">Semua Kecamatan</option>
              <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Puskesmas</label>
            <select v-model="filterPuskesmas" class="form-select">
              <option value="">Semua Puskesmas</option>
              <option v-for="p in filteredPuskesmas" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Desa</label>
            <select v-model="filterVillage" class="form-select" @change="filterPolindes = ''">
              <option value="">Semua Desa</option>
              <option v-for="v in filteredVillages" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Polindes</label>
            <select v-model="filterPolindes" class="form-select">
              <option value="">Semua Polindes</option>
              <option v-for="p in filteredPolindes" :key="p.id" :value="p.name">{{ p.name }}</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Cari</label>
            <div class="flex gap-1">
              <input v-model="searchQuery" class="form-input" placeholder="NIK atau Nama balita..." @keyup.enter="searchKids">
              <button class="btn btn-primary" @click="searchKids">Cari</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header">Data Balita ({{ kids.length }})</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:2rem">#</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Tgl Lahir</th>
              <th>JK</th>
              <th>Ibu</th>
              <th>Ayah</th>
              <th>Desa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(k, i) in kids" :key="k.id"
              class="tr-clickable"
              :class="{ 'tr-selected': selectedKid?.id === k.id }"
              @click="selectKid(k)">
              <td>{{ i + 1 }}</td>
              <td>{{ k.nik || '-' }}</td>
              <td>{{ k.name }}</td>
              <td>{{ formatDate(k.birth_date) }}</td>
              <td>{{ k.gender || '-' }}</td>
              <td>{{ k.mother_name || '-' }}</td>
              <td>{{ k.father_name || '-' }}</td>
              <td>{{ k.village_name || '-' }}</td>
            </tr>
            <tr v-if="!kids.length">
              <td colspan="8" class="text-center" style="padding:2rem; color:var(--secondary);">Cari balita terlebih dahulu</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selectedKid" class="card">
      <div class="card-header">{{ selectedKid.name }} - Riwayat Imunisasi</div>
      <div class="card-body">
        <div class="mb-2">
          <strong>NIK:</strong> {{ selectedKid.nik || '-' }} &nbsp;|&nbsp;
          <strong>Desa:</strong> {{ selectedKid.village_name || '-' }}
        </div>

        <table class="table mb-2">
          <thead>
            <tr>
              <th style="width:2rem">#</th>
              <th>Vaksin</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in vaccineHistory" :key="v.id">
              <td>{{ i + 1 }}</td>
              <td>{{ getVaccineName(v.vaccine_code) }}</td>
              <td>{{ formatDate(v.date_administered) }}</td>
              <td>{{ v.notes || '-' }}</td>
            </tr>
            <tr v-if="!vaccineHistory.length">
              <td colspan="4" class="text-center" style="padding:1rem; color:var(--secondary);">Belum ada riwayat imunisasi</td>
            </tr>
          </tbody>
        </table>

        <div class="vaccine-row">
          <div class="form-group" style="flex:2;">
            <label class="form-label">Pilih Vaksin</label>
            <select v-model="newVaccine.vaccine_code" class="form-select">
              <option value="">Pilih Vaksin...</option>
              <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Tanggal</label>
            <input v-model="newVaccine.date_administered" type="date" class="form-input">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Keterangan</label>
            <input v-model="newVaccine.notes" class="form-input" placeholder="Catatan">
          </div>
          <div class="form-group" style="align-self: flex-end;">
            <button class="btn btn-primary" :disabled="!newVaccine.vaccine_code || saving" @click="giveVaccine">
              {{ saving ? 'Menyimpan...' : 'Berikan Vaksin' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { kidsApi, villagesApi, districtsApi, vaccinesApi, polindesApi } from '../../api'
import { useAuthStore } from '../../stores/auth'
import { useUserScope } from '../../composables/useUserScope'

const auth = useAuthStore()
const scope = useUserScope()

const filterDistrict = ref('')
const filterPuskesmas = ref('')
const filterVillage = ref('')
const filterPolindes = ref('')
const searchQuery = ref('')

const districts = ref([])
const villages = ref([])
const allPolindes = ref([])
const vaccines = ref([])
const kids = ref([])
const selectedKid = ref(null)
const vaccineHistory = ref([])
const saving = ref(false)

const newVaccine = ref({
  vaccine_code: '', date_administered: new Date().toISOString().slice(0, 10), notes: ''
})

const filteredPuskesmas = computed(() => {
  if (!filterDistrict.value) return []
  return [...new Set(villages.value
    .filter(v => v.district_id === Number(filterDistrict.value))
    .map(v => v.puskesmas)
    .filter(Boolean))]
})

const filteredVillages = computed(() => {
  if (!filterDistrict.value) return villages.value
  return villages.value.filter(v => v.district_id === Number(filterDistrict.value))
})

const filteredPolindes = computed(() => {
  if (!filterVillage.value) return allPolindes.value
  return allPolindes.value.filter(p => Number(p.village_id) === Number(filterVillage.value))
})

onMounted(async () => {
  try {
    const [disRes, vilRes, vacRes, polRes] = await Promise.all([
      districtsApi.list(),
      villagesApi.list(),
      vaccinesApi.list(),
      polindesApi.list()
    ])
    districts.value = disRes.data
    villages.value = vilRes.data
    vaccines.value = vacRes.data
    allPolindes.value = polRes.data

    if (!scope.isAdmin.value) {
      if (scope.districtId.value) filterDistrict.value = String(scope.districtId.value)
      if (scope.puskesmas.value) filterPuskesmas.value = scope.puskesmas.value
    }
  } catch {}
})

function onDistrictChange() {
  filterPuskesmas.value = ''
  filterVillage.value = ''
  filterPolindes.value = ''
}

async function searchKids() {
  try {
    const params = { search: searchQuery.value || undefined }
    if (filterPuskesmas.value) params.puskesmas = filterPuskesmas.value
    if (filterDistrict.value) params.district_id = filterDistrict.value
    if (filterVillage.value) {
      const v = villages.value.find(v => v.id === Number(filterVillage.value))
      if (v) params.village = v.name
    }
    const { data } = await kidsApi.list(params)
    kids.value = data
    selectedKid.value = null
    vaccineHistory.value = []
  } catch {}
}

async function selectKid(kid) {
  selectedKid.value = kid
  try {
    const { data } = await kidsApi.get(kid.id)
    vaccineHistory.value = data.vaccines || []
  } catch {}
}

async function giveVaccine() {
  if (!selectedKid.value || !newVaccine.value.vaccine_code) return
  saving.value = true
  try {
    await kidsApi.addVaccine(selectedKid.value.id, {
      vaccine_code: newVaccine.value.vaccine_code,
      dose_order: 1,
      date_administered: newVaccine.value.date_administered || null,
      officer: auth.userName || null,
      notes: newVaccine.value.notes || null
    })
    const { data } = await kidsApi.get(selectedKid.value.id)
    vaccineHistory.value = data.vaccines || []
    newVaccine.value = {
      vaccine_code: '', date_administered: new Date().toISOString().slice(0, 10),
      notes: ''
    }
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

function getVaccineName(code) {
  const v = vaccines.value.find(v => v.code === code)
  return v ? v.name : code
}
</script>

<style scoped>
.search-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}
.search-row .form-group {
  margin-bottom: 0;
}
@media (max-width: 900px) {
  .search-row {
    flex-wrap: wrap;
  }
}
.vaccine-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}
.vaccine-row .form-group {
  margin-bottom: 0;
}
@media (max-width: 700px) {
  .vaccine-row {
    flex-wrap: wrap;
  }
}
.tr-clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.tr-clickable:hover {
  background: #f0f7ff;
}
.tr-selected {
  background: #dbeafe !important;
}
.tr-selected:hover {
  background: #bfdbfe !important;
}
</style>
