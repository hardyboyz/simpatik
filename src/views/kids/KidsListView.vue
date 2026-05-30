<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <input v-model="searchQuery" class="form-input" placeholder="Cari nama balita..." style="width: 250px;">
        <select v-model="villageFilter" class="form-select" style="width: 200px;">
          <option value="">Semua Desa</option>
          <option v-for="v in villages" :key="v.id" :value="v.name">{{ v.name }}</option>
        </select>
      </div>
      <router-link to="/kids/new" class="btn btn-primary">+ Tambah Balita</router-link>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('nik')">NIK{{ table.sortIndicator('nik') }}</th>
              <th class="sortable" @click="table.setSort('name')">Nama Balita{{ table.sortIndicator('name') }}</th>
              <th class="sortable" @click="table.setSort('birth_date')">Tgl Lahir{{ table.sortIndicator('birth_date') }}</th>
              <th>Jenis Kelamin</th>
              <th class="sortable" @click="table.setSort('village_name')">Desa{{ table.sortIndicator('village_name') }}</th>
              <th>Nama Ibu</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(k, i) in table.paginatedData.value" :key="k.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td>{{ k.nik || '-' }}</td>
              <td>{{ k.name }}</td>
              <td>{{ formatDate(k.birth_date) }}</td>
              <td>{{ k.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</td>
              <td>{{ k.village_name }}</td>
              <td>{{ k.mother_name || '-' }}</td>
              <td>
                <span class="badge" :class="k.status === 'completed' ? 'badge-success' : k.status === 'in_progress' ? 'badge-warning' : 'badge-danger'">
                  {{ k.status === 'completed' ? 'Lengkap' : k.status === 'in_progress' ? 'Proses' : 'Baru' }}
                </span>
              </td>
              <td class="action-cell">
                <router-link :to="`/kids/${k.id}`" class="btn btn-icon" title="Detail">👁️</router-link>
                <router-link :to="`/kids/${k.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
                <button class="btn btn-icon" title="Hapus" @click="confirmDelete(k)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="9" class="text-center" style="padding: 2rem; color: var(--secondary);">
                {{ loading ? 'Memuat data...' : 'Belum ada data balita' }}
              </td>
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
import { useKidsStore } from '../../stores/kids'
import { villagesApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const kidsStore = useKidsStore()
const scope = useUserScope()
const searchQuery = ref('')
const villageFilter = ref('')
const villages = ref([])

async function load() {
  await kidsStore.loadKids()
  try {
    const { data } = await villagesApi.list()
    villages.value = data
    if (!scope.isAdmin.value && scope.villageId.value) {
      villages.value = villages.value.filter(v => v.id === Number(scope.villageId.value))
    }
  } catch {}
}

onMounted(load)

const filteredKids = computed(() => {
  let result = kidsStore.kids
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(k => k.name?.toLowerCase().includes(q) || k.nik?.includes(q))
  }
  if (villageFilter.value) {
    result = result.filter(k => k.village_name === villageFilter.value)
  }
  if (!scope.isAdmin.value) {
    if (scope.villageId.value) {
      const allowedVillage = villages.value.find(v => v.id === Number(scope.villageId.value))
      if (allowedVillage) result = result.filter(k => k.village_name === allowedVillage.name)
    }
  }
  return result
})

const table = useTable(filteredKids)

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

function confirmDelete(k) {
  Swal.fire({
    title: 'Hapus Data Balita?',
    text: `Yakin ingin menghapus ${k.name}? Data tidak dapat dikembalikan.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await kidsStore.deleteKid(k.id)
      Swal.fire('Terhapus!', 'Data balita berhasil dihapus.', 'success')
    }
  })
}
</script>
