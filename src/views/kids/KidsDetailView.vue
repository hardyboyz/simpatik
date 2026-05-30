<template>
  <div v-if="kid" style="max-width: 800px;">
    <div class="card">
      <div class="flex-between">
        <div class="card-header" style="border: none; margin-bottom: 0; padding-bottom: 0;">Detail Balita</div>
        <div class="action-cell">
          <router-link :to="`/kids/${kid.id}/edit`" class="btn btn-icon" title="Edit">✏️</router-link>
          <button class="btn btn-icon" title="Hapus" @click="handleDelete">🗑️</button>
        </div>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-header">Data Pribadi</div>
        <table style="width: 100%;">
          <tr><td style="font-weight: 500; width: 140px; padding: 0.4rem 0;">NIK</td><td style="padding: 0.4rem 0;">: {{ kid.nik || '-' }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Nama</td><td style="padding: 0.4rem 0;">: {{ kid.name }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Tgl Lahir</td><td style="padding: 0.4rem 0;">: {{ formatDate(kid.birth_date) }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">JK</td><td style="padding: 0.4rem 0;">: {{ kid.gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Status</td><td style="padding: 0.4rem 0;">:
            <span class="badge" :class="kid.status === 'completed' ? 'badge-success' : 'badge-warning'">
              {{ kid.status === 'completed' ? 'Lengkap' : kid.status === 'in_progress' ? 'Proses' : 'Baru' }}
            </span>
          </td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-header">Data Orang Tua</div>
        <table style="width: 100%;">
          <tr><td style="font-weight: 500; width: 140px; padding: 0.4rem 0;">Ibu</td><td style="padding: 0.4rem 0;">: {{ kid.mother_name || '-' }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Ayah</td><td style="padding: 0.4rem 0;">: {{ kid.father_name || '-' }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Desa</td><td style="padding: 0.4rem 0;">: {{ kid.village_name }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Alamat</td><td style="padding: 0.4rem 0;">: {{ kid.address || '-' }}</td></tr>
          <tr><td style="font-weight: 500; padding: 0.4rem 0;">Telepon</td><td style="padding: 0.4rem 0;">: {{ kid.phone || '-' }}</td></tr>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Riwayat Imunisasi</div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Vaksin</th><th>Dosis</th><th>Tanggal</th><th>Petugas</th><th>Keterangan</th></tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in (kid.vaccines || [])" :key="i">
              <td>{{ v.vaccine_code }}</td>
              <td>{{ v.dose_order }}</td>
              <td>{{ formatDate(v.date_administered) }}</td>
              <td>{{ v.officer || '-' }}</td>
              <td>{{ v.notes || '-' }}</td>
            </tr>
            <tr v-if="!kid.vaccines?.length">
              <td colspan="5" class="text-center" style="color: var(--secondary);">Belum ada riwayat imunisasi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-else class="loading"><div class="spinner"></div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { kidsApi } from '../../api'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const kid = ref(null)

onMounted(async () => {
  kid.value = await kidsApi.get(route.params.id).then(r => r.data).catch(() => null)
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

async function handleDelete() {
  Swal.fire({
    title: 'Hapus Data Balita?',
    text: `Yakin ingin menghapus ${kid.value?.name}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await kidsApi.remove(route.params.id)
      Swal.fire('Terhapus!', 'Data balita berhasil dihapus.', 'success')
      router.push('/kids')
    }
  })
}
</script>
