<template>
  <div>
    <div class="flex-between mb-2">
      <select v-model="filterPuskesmas" class="form-select" style="width: 200px;">
        <option value="">Semua Puskesmas</option>
        <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
      </select>
      <router-link to="/inventory/new" class="btn btn-primary">+ Tambah Stok</router-link>
    </div>
    <div class="grid grid-3 mb-2">
      <div class="stat-card">
        <div class="stat-value" style="color: var(--primary);">{{ totalStok }}</div>
        <div class="stat-label">Total Stok (Vial)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success);">{{ totalVaccineTypes }}</div>
        <div class="stat-label">Jenis Vaksin</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--danger);">{{ lowStockCount }}</div>
        <div class="stat-label">Stok Menipis</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Stok Vaksin per Puskesmas</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="sortable" @click="table.setSort('puskesmas')">Puskesmas{{ table.sortIndicator('puskesmas') }}</th>
              <th class="sortable" @click="table.setSort('vaccine_name')">Vaksin{{ table.sortIndicator('vaccine_name') }}</th>
              <th class="sortable" @click="table.setSort('quantity')">Stok{{ table.sortIndicator('quantity') }}</th>
              <th>Min. Stok</th>
              <th class="sortable" @click="table.setSort('expiry_date')">Exp. Date{{ table.sortIndicator('expiry_date') }}</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in table.paginatedData.value" :key="s.id">
              <td>{{ s.puskesmas || '-' }}</td>
              <td>{{ s.vaccine_name || s.vaccine_code }}</td>
              <td>{{ s.quantity }}</td>
              <td>{{ s.min_stock || 0 }}</td>
              <td>{{ formatDate(s.expiry_date) }}</td>
              <td>
                <span class="badge" :class="Number(s.quantity) <= (s.min_stock || 0) ? 'badge-danger' : 'badge-success'">
                  {{ Number(s.quantity) <= (s.min_stock || 0) ? 'Kritis' : 'Tersedia' }}
                </span>
              </td>
              <td class="action-cell">
                <router-link :to="`/inventory/${s.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
                <button class="btn btn-icon" title="Hapus" @click="handleDelete(s.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="7" class="text-center" style="color: var(--secondary);">Belum ada data stok</td>
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
import { useInventoryStore } from '../../stores/inventory'
import { villagesApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const scope = useUserScope()
const invStore = useInventoryStore()
const filterPuskesmas = ref('')
const puskesmasList = ref([])

onMounted(async () => {
  await invStore.loadStock()
  try {
    const { data } = await villagesApi.list()
    const allPuskesmas = [...new Set(data.map(v => v.puskesmas).filter(Boolean))]
    puskesmasList.value = allPuskesmas
    if (!scope.isAdmin.value && scope.puskesmas.value) {
      filterPuskesmas.value = scope.puskesmas.value
    }
  } catch {}
})

const filteredStock = computed(() => {
  let result = invStore.stockItems
  if (!scope.isAdmin.value && scope.puskesmas.value) {
    result = result.filter(s => s.puskesmas === scope.puskesmas.value)
  }
  if (filterPuskesmas.value) {
    result = result.filter(s => s.puskesmas === filterPuskesmas.value)
  }
  return result
})

const table = useTable(filteredStock)

const totalStok = computed(() => invStore.totalStock)
const totalVaccineTypes = computed(() => new Set(invStore.stockItems.map(s => s.vaccine_code)).size)
const lowStockCount = computed(() => invStore.lowStockItems.length)

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

async function handleDelete(id) {
  const item = invStore.stockItems.find(s => s.id === id)
  Swal.fire({
    title: 'Hapus Stok?',
    text: `Yakin ingin menghapus stok ${item?.vaccine_name || item?.vaccine_code}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await invStore.deleteStock(id)
      Swal.fire('Terhapus!', 'Data stok berhasil dihapus.', 'success')
    }
  })
}
</script>
