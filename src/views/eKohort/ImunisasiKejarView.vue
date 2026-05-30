<template>
  <div>
    <div class="card mb-2" style="border-left: 4px solid var(--danger);">
      <div class="card-header flex-between">
        <span style="color:var(--danger);">Imunisasi Kejar & Pelacakan Drop-Out</span>
        <span class="badge badge-danger">{{ dropoutList.length }} anak perlu tindak lanjut</span>
      </div>
      <div class="filter-row">
        <select v-model="filterDistrict" class="form-select" style="width:200px;" @change="onDistrictChange">
          <option value="">Semua Kecamatan</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="filterVillage" class="form-select" style="width:200px;">
          <option value="">Semua Desa</option>
          <option v-for="v in filteredVillages" :key="v" :value="v">{{ v }}</option>
        </select>
        <select v-model="filterVaccine" class="form-select" style="width:220px;">
          <option value="">Semua Vaksin</option>
          <option v-for="v in allVaccines" :key="v.code" :value="v.code">{{ v.name }}</option>
        </select>
        <button class="btn btn-danger" @click="applyFilter">🔴 Filter</button>
        <button class="btn btn-outline" @click="resetFilter">Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Anak</th>
              <th>Nama Orang Tua</th>
              <th>Alamat</th>
              <th>Usia</th>
              <th>Imunisasi Terlewat</th>
              <th>Vaksin Terakhir</th>
              <th>Kirim WA</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(k, i) in paginatedList" :key="k.id">
              <td>{{ (currentPage - 1) * perPage + i + 1 }}</td>
              <td><strong>{{ k.name }}</strong></td>
              <td>{{ k.mother_name || k.father_name || '-' }}</td>
              <td>
                {{ k.village_name }}
                <span v-if="k.address" style="font-size:0.75rem;color:var(--secondary);">, {{ k.address }}</span>
              </td>
              <td>{{ k.age_months || '-' }} bln</td>
              <td>
                <div class="missing-vaccines">
                  <span v-for="mv in (k.missing_vaccines || [])" :key="mv" class="badge badge-danger" style="margin:1px;">
                    {{ mv }}
                  </span>
                  <span v-if="!k.missing_vaccines?.length" style="color:var(--secondary);font-size:0.8rem;">-</span>
                </div>
              </td>
              <td>{{ k.last_vaccine_date ? formatDate(k.last_vaccine_date) : 'Belum pernah' }}</td>
              <td>
                <WhatsAppButton
                  :phone="k.phone"
                  :kid-name="k.name"
                  :mother-name="k.mother_name"
                  :missing-vaccines="k.missing_vaccines"
                  label="Kirim WA"
                  small
                  @sent="onWASent" @error="onWAError"
                />
              </td>
            </tr>
            <tr v-if="!paginatedList.length">
              <td colspan="8" class="text-center" style="padding:2rem;color:var(--secondary);">
                {{ loading ? 'Memuat data...' : 'Tidak ada anak drop-out' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        :currentPage="currentPage"
        :totalPages="totalPages"
        :total="dropoutList.length"
        :perPage="perPage"
        :pageRange="pageRange"
        @go="goToPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { eKohortApi, vaccinesApi, villagesApi, districtsApi } from '../../api'
import WhatsAppButton from '../../components/eKohort/WhatsAppButton.vue'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const loading = ref(true)
const dropoutList = ref([])
const districts = ref([])
const allVillages = ref([])
const allVaccines = ref([])
const filterDistrict = ref('')
const filterVillage = ref('')
const filterVaccine = ref('')

const filteredVillages = computed(() => {
  if (!filterDistrict.value) return allVillages.value
  return allVillages.value.filter(v => v.district_id === Number(filterDistrict.value))
    .map(v => v.name)
})

const currentPage = ref(1)
const perPage = 15

const filteredList = computed(() => {
  let result = dropoutList.value
  if (filterVillage.value) result = result.filter(k => k.village_name === filterVillage.value)
  if (filterVaccine.value) result = result.filter(k => (k.missing_vaccines || []).includes(filterVaccine.value))
  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / perPage)))
const pageRange = computed(() => {
  const total = totalPages.value; const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredList.value.slice(start, start + perPage)
})

function goToPage(p) { if (p >= 1 && p <= totalPages.value) currentPage.value = p }

onMounted(async () => {
  try {
    const [dRes, vRes, vacRes] = await Promise.all([districtsApi.list(), villagesApi.list(), vaccinesApi.list()])
    districts.value = dRes.data
    allVillages.value = vRes.data
    allVaccines.value = vacRes.data
  } catch {}
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterDistrict.value) params.district_id = filterDistrict.value
    if (filterVillage.value) params.village = filterVillage.value
    if (filterVaccine.value) params.vaccine_code = filterVaccine.value
    const { data } = await eKohortApi.dropOutList(params)
    dropoutList.value = data
  } catch (e) { console.error(e) }
  finally { loading.value = false; currentPage.value = 1 }
}

async function applyFilter() { await loadData() }
function onDistrictChange() {
  filterVillage.value = ''
}

function resetFilter() {
  filterDistrict.value = ''; filterVillage.value = ''; filterVaccine.value = ''
  loadData()
}

function onWASent(info) {
  Swal.fire({
    icon: 'success', title: 'Pengingat Terkirim!',
    text: `WA berhasil dikirim ke ${info.phone}`,
    timer: 2000, showConfirmButton: false
  })
}

function onWAError(info) {
  Swal.fire({
    icon: 'error', title: 'Gagal Kirim WA',
    text: info.error || 'Terjadi kesalahan',
    confirmButtonText: 'Tutup'
  })
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}
</script>

<style scoped>
.filter-row { display: flex; gap: 0.5rem; align-items: center; }
.missing-vaccines { display: flex; flex-wrap: wrap; gap: 1px; max-width: 200px; }
@media (max-width: 768px) { .filter-row { flex-wrap: wrap; } }
</style>
