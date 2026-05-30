<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterDistrict" class="form-select" style="width: 200px;" @change="onDistrictChange">
          <option value="">Semua Kecamatan</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="filterPuskesmas" class="form-select" style="width: 200px;">
          <option value="">Semua Puskesmas</option>
          <option v-for="p in filteredPuskesmasOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <router-link to="/polindes/new" class="btn btn-primary">+ Tambah Polindes</router-link>
    </div>
    <div class="card">
      <div class="card-header">Data Polindes (Pondok Bersalin Desa)</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('name')">Nama Polindes{{ table.sortIndicator('name') }}</th>
              <th class="sortable" @click="table.setSort('puskesmas_name')">Puskesmas{{ table.sortIndicator('puskesmas_name') }}</th>
              <th class="sortable" @click="table.setSort('village_name')">Desa{{ table.sortIndicator('village_name') }}</th>
              <th class="sortable" @click="table.setSort('district_name')">Kecamatan{{ table.sortIndicator('district_name') }}</th>
              <th>Kepala</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pol, i) in table.paginatedData.value" :key="pol.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td><strong>{{ pol.name }}</strong></td>
              <td>{{ pol.puskesmas_name }}</td>
              <td>{{ pol.village_name }}</td>
              <td>{{ pol.district_name }}</td>
              <td>{{ pol.head_name || '-' }}</td>
              <td>
                <span class="badge" :class="pol.is_active ? 'badge-success' : 'badge-danger'">
                  {{ pol.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="action-cell">
                <router-link :to="`/polindes/${pol.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
                <button class="btn btn-icon" title="Hapus" @click="handleDelete(pol)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="8" class="text-center" style="color: var(--secondary);">Belum ada data polindes</td>
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
    <div class="grid grid-4 mt-1">
      <div v-for="p in puskesmasList" :key="p.id" class="card">
        <div style="font-weight: 600;">{{ p.name }}</div>
        <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">{{ polindesByPuskesmas[p.id]?.length || 0 }}</div>
        <div style="font-size: 0.85rem; color: var(--secondary);">Polindes</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { polindesApi, puskesmasApi, districtsApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const polindesList = ref([])
const puskesmasList = ref([])
const districts = ref([])
const filterDistrict = ref('')
const filterPuskesmas = ref('')
const scope = useUserScope()

onMounted(async () => {
  try {
    const [polRes, pusRes, disRes] = await Promise.all([
      polindesApi.list(), puskesmasApi.list(), districtsApi.list()
    ])
    polindesList.value = polRes.data
    puskesmasList.value = pusRes.data
    districts.value = disRes.data
    if (!scope.isAdmin.value && scope.districtId.value) {
      filterDistrict.value = String(scope.districtId.value)
    }
  } catch {}
})

const filteredPuskesmasOptions = computed(() => {
  if (!filterDistrict.value) return puskesmasList.value
  return puskesmasList.value.filter(p => p.district_id === Number(filterDistrict.value))
})

const filteredPolindes = computed(() => {
  let result = polindesList.value
  if (filterPuskesmas.value) {
    result = result.filter(pol => pol.puskesmas_id === Number(filterPuskesmas.value))
  }
  if (filterDistrict.value) {
    result = result.filter(pol => {
      const pus = puskesmasList.value.find(p => p.id === pol.puskesmas_id)
      return pus && pus.district_id === Number(filterDistrict.value)
    })
  }
  if (!scope.isAdmin.value && scope.districtId.value) {
    result = result.filter(pol => {
      const pus = puskesmasList.value.find(p => p.id === pol.puskesmas_id)
      return pus && pus.district_id === Number(scope.districtId.value)
    })
  }
  return result
})

const table = useTable(filteredPolindes)

const polindesByPuskesmas = computed(() => {
  const grouped = {}
  polindesList.value.forEach(pol => {
    if (!grouped[pol.puskesmas_id]) grouped[pol.puskesmas_id] = []
    grouped[pol.puskesmas_id].push(pol)
  })
  return grouped
})

function onDistrictChange() {
  filterPuskesmas.value = ''
}

async function handleDelete(pol) {
  Swal.fire({
    title: 'Hapus Polindes?',
    text: `Yakin ingin menghapus ${pol.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await polindesApi.remove(pol.id)
        polindesList.value = polindesList.value.filter(item => item.id !== pol.id)
        Swal.fire('Terhapus!', 'Polindes berhasil dihapus.', 'success')
      } catch (e) {
        Swal.fire('Gagal!', e.response?.data?.error || 'Gagal menghapus', 'error')
      }
    }
  })
}
</script>
