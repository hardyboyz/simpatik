<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="navbar-toggler" @click="toggleSidebar()">☰</button>
      <h1 class="page-title">{{ routeName }}</h1>
    </div>
    <div class="navbar-right">
      <div class="user-badge" @click="router.push('/profile')" style="cursor:pointer;">
        <div class="user-avatar">{{ initials }}</div>
        <div>
          <div style="font-weight: 500;">{{ auth.userName }}</div>
          <div style="font-size: 0.75rem; color: var(--secondary);">{{ roleLabel }}</div>
        </div>
      </div>
      <button class="btn-logout" @click="handleLogout">Logout</button>
    </div>
  </header>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toggleSidebar = inject('toggleSidebar')

const routeName = computed(() => {
  const names = {
    'Dashboard': 'Dashboard',
    'Kids': 'Data Balita', 'KidsCreate': 'Tambah Balita', 'KidsDetail': 'Detail Balita', 'KidsEdit': 'Edit Balita',
    'Vaccines': 'Jenis Vaksin',
    'Inventory': 'Stok Vaksin', 'InventoryCreate': 'Tambah Stok', 'InventoryEdit': 'Edit Stok',
    'Distribution': 'Distribusi Vaksin',
    'Villages': 'Desa / Kelurahan',
    'Demographics': 'Data Demografi',
    'Reports': 'Laporan Bulanan', 'ReportCreate': 'Buat Laporan',
    'Targets': 'Target Per Desa',
    'AnnualTarget': 'Target Tahunan',
    'Users': 'Pengguna', 'UsersCreate': 'Tambah Pengguna', 'UsersEdit': 'Edit Pengguna',
    'Login': 'Login',
    'E-Kohort': 'Beranda & Ringkasan (e-Kohort)',
    'KmsDigital': 'KMS Digital', 'KmsDetail': 'KMS Digital',
    'PelayananHariIni': 'Pelayanan Hari Ini',
    'ImunisasiKejar': 'Imunisasi Kejar',
    'Mikroplanning': 'Mikroplanning & Logistik'
  }
  return names[route.name] || route.name
})

const initials = computed(() => {
  return auth.userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const roleLabel = computed(() => {
  const roles = { admin: 'Administrator', puskesmas: 'Petugas Puskesmas', bidan: 'Bidan Desa', dinkes: 'Dinas Kesehatan' }
  return roles[auth.userRole] || auth.userRole || 'Pengguna'
})

function handleLogout() {
  Swal.fire({
    title: 'Yakin ingin logout?',
    text: 'Anda akan keluar dari sistem.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await auth.logout()
      router.push('/login')
    }
  })
}
</script>
