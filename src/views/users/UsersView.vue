<template>
  <div>
    <div class="flex-between mb-2">
      <select v-model="filterRole" class="form-select" style="width: 200px;">
        <option value="">Semua Role</option>
        <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <router-link to="/users/new" class="btn btn-primary">+ Tambah Pengguna</router-link>
    </div>
    <div class="card">
      <div class="card-header">Manajemen Pengguna</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('name')">Nama{{ table.sortIndicator('name') }}</th>
              <th class="sortable" @click="table.setSort('email')">Email{{ table.sortIndicator('email') }}</th>
              <th class="sortable" @click="table.setSort('role')">Role{{ table.sortIndicator('role') }}</th>
              <th>Puskesmas</th>
              <th>Kecamatan</th>
              <th>Desa</th>
              <th class="sortable" @click="table.setSort('active')">Status{{ table.sortIndicator('active') }}</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in table.paginatedData.value" :key="u.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td>{{ u.name || '-' }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge badge-info">{{ getRoleName(u.role) }}</span></td>
              <td>{{ u.puskesmas || '-' }}</td>
              <td>{{ u.district_name || '-' }}</td>
              <td>{{ u.village_name || '-' }}</td>
              <td>
                <span class="badge" :class="u.active ? 'badge-success' : 'badge-danger'">
                  {{ u.active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="action-cell">
                <router-link :to="`/users/${u.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
                <button class="btn btn-sm" :class="u.active ? 'btn-warning' : 'btn-success'" @click="toggleActive(u)" :title="u.active ? 'Nonaktifkan' : 'Aktifkan'">
                  {{ u.active ? '🔴' : '🟢' }}
                </button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="9" class="text-center" style="color: var(--secondary);">Tidak ada data</td>
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
    <div class="card">
      <div class="card-header">Role &amp; Hak Akses</div>
      <div class="table-container">
        <table>
          <thead><tr><th>Role</th><th>Hak Akses</th><th>Keterangan</th></tr></thead>
          <tbody>
            <tr><td>Administrator</td><td>Akses penuh</td><td>Mengelola seluruh modul dan pengguna</td></tr>
            <tr><td>Petugas Puskesmas</td><td>Baca, Tulis, Edit</td><td>Input data imunisasi, laporan, stok</td></tr>
            <tr><td>Bidan Desa</td><td>Baca, Tulis</td><td>Input data balita dan imunisasi</td></tr>
            <tr><td>Dinas Kesehatan</td><td>Baca</td><td>Monitoring dan evaluasi</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usersApi } from '../../api'
import { ROLES } from '../../config/masterData'
import { useTable } from '../../composables/useTable'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const users = ref([])
const filterRole = ref('')
const roles = ROLES

onMounted(async () => {
  try {
    const { data } = await usersApi.list()
    users.value = data
  } catch {}
})

const filteredUsers = computed(() => {
  let result = users.value
  if (filterRole.value) {
    result = result.filter(u => u.role === filterRole.value)
  }
  return result
})

const table = useTable(filteredUsers)

function getRoleName(roleId) {
  const r = ROLES.find(r => r.id === roleId)
  return r ? r.name : roleId
}

async function toggleActive(user) {
  const newStatus = !user.active
  const label = newStatus ? 'mengaktifkan' : 'menonaktifkan'
  Swal.fire({
    title: `${label.charAt(0).toUpperCase() + label.slice(1)} Pengguna?`,
    text: `Yakin ingin ${label} ${user.name}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: newStatus ? '#198754' : '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await usersApi.update(user.id, { active: newStatus ? 1 : 0 })
        user.active = newStatus
        Swal.fire('Berhasil!', `Pengguna ${label}`, 'success')
      } catch (e) {
        Swal.fire('Gagal!', e.response?.data?.error || e.message, 'error')
      }
    }
  })
}
</script>
