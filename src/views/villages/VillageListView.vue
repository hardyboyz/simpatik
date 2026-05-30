<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterDistrict" class="form-select" style="width: 200px;">
          <option value="">Semua Kecamatan</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <input v-model="searchQuery" class="form-input" placeholder="Cari desa..." style="width: 250px;">
      </div>
    </div>
    <div class="card">
      <div class="card-header">Daftar Desa / Kelurahan ({{ filteredVillages.length }})</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('name')">Desa / Kelurahan{{ table.sortIndicator('name') }}</th>
              <th class="sortable" @click="table.setSort('district_name')">Kecamatan{{ table.sortIndicator('district_name') }}</th>
              <th>Puskesmas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in table.paginatedData.value" :key="v.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td>{{ v.name }}</td>
              <td>{{ v.district_name }}</td>
              <td><span class="badge badge-info">{{ v.puskesmas }}</span></td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="4" class="text-center" style="color: var(--secondary);">Tidak ada data</td>
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
      <div v-for="d in districts" :key="d.id" class="card">
        <div style="font-weight: 600;">{{ d.name }}</div>
        <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">{{ villagesByDistrict[d.id]?.length || 0 }}</div>
        <div style="font-size: 0.85rem; color: var(--secondary);">Desa</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { districtsApi, villagesApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'

const scope = useUserScope()
const districts = ref([])
const villages = ref([])
const filterDistrict = ref('')
const searchQuery = ref('')

onMounted(async () => {
  try {
    const [disRes, vilRes] = await Promise.all([districtsApi.list(), villagesApi.list()])
    districts.value = disRes.data
    villages.value = vilRes.data
    if (!scope.isAdmin.value && scope.districtId.value) {
      filterDistrict.value = String(scope.districtId.value)
    }
  } catch {}
})

const filteredVillages = computed(() => {
  let result = villages.value
  if (!scope.isAdmin.value && scope.districtId.value) {
    result = result.filter(v => v.district_id === Number(scope.districtId.value))
  }
  if (filterDistrict.value) {
    result = result.filter(v => v.district_id === Number(filterDistrict.value))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(v => v.name.toLowerCase().includes(q))
  }
  return result
})

const table = useTable(filteredVillages)

const villagesByDistrict = computed(() => {
  const grouped = {}
  villages.value.forEach(v => {
    if (!grouped[v.district_id]) grouped[v.district_id] = []
    grouped[v.district_id].push(v)
  })
  return grouped
})
</script>
