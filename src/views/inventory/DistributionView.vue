<template>
  <div>
    <div class="flex-between mb-2">
      <h2 style="font-size: 1.25rem; font-weight: 600;">Distribusi Vaksin</h2>
      <button class="btn btn-primary" @click="openAdd">+ Tambah Distribusi</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table.setSort('created_at')">Tanggal{{ table.sortIndicator('created_at') }}</th>
              <th>Vaksin</th>
              <th>Dari</th>
              <th>Tujuan</th>
              <th class="sortable" @click="table.setSort('quantity')">Jumlah{{ table.sortIndicator('quantity') }}</th>
              <th>Batch</th>
              <th>Petugas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d, i) in table.paginatedData.value" :key="d.id">
              <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
              <td>{{ formatDate(d.created_at) }}</td>
              <td>{{ d.vaccine_name || d.vaccine_code }}</td>
              <td>{{ d.source || '-' }}</td>
              <td>{{ d.destination }}</td>
              <td>{{ d.quantity }} vial</td>
              <td>{{ d.batch_no || '-' }}</td>
              <td>{{ d.officer || '-' }}</td>
              <td class="action-cell">
                <button class="btn btn-icon" title="Edit" @click="openEdit(d)">✏️</button>
                <button class="btn btn-icon" title="Hapus" @click="handleDelete(d)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="9" class="text-center" style="color: var(--secondary);">Belum ada data</td>
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

    <div v-if="showForm" class="modal-overlay" @click="showForm = false">
      <div class="modal-content" @click.stop style="min-width: 500px;">
        <div class="modal-header">{{ editingId ? 'Edit Distribusi Vaksin' : 'Tambah Distribusi Vaksin' }}</div>
        <form @submit.prevent="editingId ? handleUpdate() : handleAdd()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Vaksin *</label>
              <select v-model="form.vaccine_code" class="form-select" required>
                <option value="">Pilih...</option>
                <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jumlah (Vial) *</label>
              <input v-model.number="form.quantity" type="number" min="1" class="form-input" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sumber (Dari) *</label>
              <select v-model="form.source" class="form-select" required>
                <option value="">Pilih...</option>
                <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
                <option value="Dinkes Kabupaten">Dinkes Kabupaten</option>
                <option value="Dinkes Provinsi">Dinkes Provinsi</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tujuan *</label>
              <select v-model="form.destination" class="form-select" required>
                <option value="">Pilih...</option>
                <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
                <option v-for="v in villages" :key="v.id" :value="v.name">{{ v.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">No. Batch</label>
              <input v-model="form.batch_no" class="form-input" placeholder="Nomor batch">
            </div>
            <div class="form-group">
              <label class="form-label">Petugas</label>
              <input v-model="form.officer" class="form-input" placeholder="Nama petugas">
            </div>
          </div>
          <div class="form-group">
            <textarea v-model="form.notes" class="form-textarea" placeholder="Catatan distribusi"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showForm = false">Batal</button>
            <button type="submit" class="btn btn-primary">{{ editingId ? 'Update' : 'Simpan' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../../stores/inventory'
import { vaccinesApi, villagesApi, distributionsApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import Swal from 'sweetalert2'

const scope = useUserScope()
const invStore = useInventoryStore()
const showForm = ref(false)
const editingId = ref(null)
const vaccines = ref([])
const villages = ref([])
const puskesmasList = ref([])
const form = ref({ vaccine_code: '', quantity: 1, source: '', destination: '', batch_no: '', officer: '', notes: '' })

onMounted(async () => {
  await invStore.loadDistributions()
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    villages.value = vilRes.data
    puskesmasList.value = [...new Set(vilRes.data.map(v => v.puskesmas).filter(Boolean))]
  } catch {}
})

const filteredDistributions = computed(() => {
  let result = invStore.distributions
  if (!scope.isAdmin.value && scope.puskesmas.value) {
    result = result.filter(d => d.source === scope.puskesmas.value || d.destination === scope.puskesmas.value)
  }
  return result
})
const table = useTable(filteredDistributions)

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}

function resetForm() {
  form.value = { vaccine_code: '', quantity: 1, source: '', destination: '', batch_no: '', officer: '', notes: '' }
  editingId.value = null
}

function openAdd() {
  resetForm()
  showForm.value = true
}

async function openEdit(d) {
  editingId.value = d.id
  form.value = {
    vaccine_code: d.vaccine_code,
    quantity: d.quantity,
    source: d.source,
    destination: d.destination,
    batch_no: d.batch_no || '',
    officer: d.officer || '',
    notes: d.notes || ''
  }
  showForm.value = true
}

async function handleAdd() {
  try {
    const vaksin = vaccines.value.find(v => v.code === form.value.vaccine_code)
    await invStore.addDistribution({
      ...form.value,
      vaccine_name: vaksin?.name || form.value.vaccine_code
    })
    showForm.value = false
    resetForm()
  } catch (e) {
    Swal.fire('Gagal!', e.response?.data?.error || e.message, 'error')
  }
}

async function handleUpdate() {
  try {
    const vaksin = vaccines.value.find(v => v.code === form.value.vaccine_code)
    await distributionsApi.update(editingId.value, {
      ...form.value,
      vaccine_name: vaksin?.name || form.value.vaccine_code
    })
    await invStore.loadDistributions()
    showForm.value = false
    resetForm()
    Swal.fire('Berhasil!', 'Data distribusi berhasil diperbarui.', 'success')
  } catch (e) {
    Swal.fire('Gagal!', e.response?.data?.error || e.message, 'error')
  }
}

function handleDelete(d) {
  Swal.fire({
    title: 'Hapus Distribusi?',
    text: `Yakin ingin menghapus distribusi ${d.vaccine_name || d.vaccine_code} ke ${d.destination}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await distributionsApi.remove(d.id)
        await invStore.loadDistributions()
        Swal.fire('Terhapus!', 'Distribusi berhasil dihapus.', 'success')
      } catch (e) {
        Swal.fire('Gagal!', e.response?.data?.error || e.message, 'error')
      }
    }
  })
}
</script>
