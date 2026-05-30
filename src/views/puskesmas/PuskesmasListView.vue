<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterDistrict" class="form-select" style="width: 200px;">
          <option value="">Semua Kecamatan</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
      <router-link to="/puskesmas/new" class="btn btn-primary">+ Tambah Puskesmas</router-link>
    </div>
    <div class="card">
      <div class="card-header">Data Puskesmas</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('name')">Nama Puskesmas{{ table.sortIndicator('name') }}</th>
              <th class="sortable" @click="table.setSort('district_name')">Kecamatan{{ table.sortIndicator('district_name') }}</th>
              <th class="sortable" @click="table.setSort('address')">Alamat{{ table.sortIndicator('address') }}</th>
              <th>Telepon</th>
              <th>Kepala</th>
              <th>Jml Polindes</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in table.paginatedData.value" :key="p.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td><strong>{{ p.name }}</strong></td>
              <td>{{ p.district_name }}</td>
              <td>{{ p.address || '-' }}</td>
              <td>{{ p.phone || '-' }}</td>
              <td>{{ p.head_name || '-' }}</td>
              <td><span class="badge badge-info">{{ polindesCount[p.id] || 0 }}</span></td>
              <td class="action-cell">
                <router-link :to="`/puskesmas/${p.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
                <button class="btn btn-icon" title="Hapus" @click="handleDelete(p)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="8" class="text-center" style="color: var(--secondary);">Belum ada data puskesmas</td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { puskesmasApi, districtsApi, polindesApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const puskesmasList = ref([])
const districts = ref([])
const polindesData = ref([])
const filterDistrict = ref('')
const scope = useUserScope()

onMounted(async () => {
  try {
    const [pusRes, disRes, polRes] = await Promise.all([
      puskesmasApi.list(), districtsApi.list(), polindesApi.list()
    ])
    puskesmasList.value = pusRes.data
    districts.value = disRes.data
    polindesData.value = polRes.data
    if (!scope.isAdmin.value && scope.districtId.value) {
      filterDistrict.value = String(scope.districtId.value)
    }
  } catch (e) {
    console.error(e)
  }
})

const filteredPuskesmas = computed(() => {
  let result = puskesmasList.value
  if (filterDistrict.value) {
    result = result.filter(p => p.district_id === Number(filterDistrict.value))
  }
  if (!scope.isAdmin.value && scope.districtId.value) {
    result = result.filter(p => p.district_id === Number(scope.districtId.value))
  }
  return result
})

const table = useTable(filteredPuskesmas)

const polindesCount = computed(() => {
  const counts = {}
  polindesData.value.forEach(pol => {
    counts[pol.puskesmas_id] = (counts[pol.puskesmas_id] || 0) + 1
  })
  return counts
})

async function handleDelete(p) {
  Swal.fire({
    title: 'Hapus Puskesmas?',
    text: `Yakin ingin menghapus ${p.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await puskesmasApi.remove(p.id)
        puskesmasList.value = puskesmasList.value.filter(item => item.id !== p.id)
        Swal.fire('Terhapus!', 'Puskesmas berhasil dihapus.', 'success')
      } catch (e) {
        Swal.fire('Gagal!', e.response?.data?.error || 'Gagal menghapus', 'error')
      }
    }
  })
}
</script>
