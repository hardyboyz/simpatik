<template>
  <div class="card" style="max-width: 600px;">
    <div class="card-header">{{ isEdit ? 'Edit Stok Vaksin' : 'Tambah Stok Vaksin' }}</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Puskesmas *</label>
        <select v-model="form.puskesmas" class="form-select" required>
          <option value="">Pilih Puskesmas...</option>
          <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Jenis Vaksin *</label>
        <select v-model="form.vaccine_code" class="form-select" required>
          <option value="">Pilih vaksin...</option>
          <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }}</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Jumlah (Vial) *</label>
          <input v-model.number="form.quantity" type="number" min="0" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Stok Minimal</label>
          <input v-model.number="form.min_stock" type="number" min="0" class="form-input" placeholder="10">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tanggal Kadaluarsa</label>
          <input v-model="form.expiry_date" type="date" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">No. Batch</label>
          <input v-model="form.batch_no" class="form-input" placeholder="Nomor batch">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Keterangan</label>
        <textarea v-model="form.notes" class="form-textarea" placeholder="Catatan"></textarea>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Simpan' : 'Tambah' }}</button>
        <router-link to="/inventory" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventory'
import { vaccinesApi, villagesApi } from '../../api'

const route = useRoute()
const router = useRouter()
const invStore = useInventoryStore()
const isEdit = computed(() => !!route.params.id)
const vaccines = ref([])
const puskesmasList = ref([])

const form = ref({
  puskesmas: '', vaccine_code: '', quantity: 0, min_stock: 10,
  expiry_date: '', batch_no: '', notes: ''
})

onMounted(async () => {
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    puskesmasList.value = [...new Set(vilRes.data.map(v => v.puskesmas).filter(Boolean))]
  } catch {}
  if (isEdit.value) {
    const item = invStore.stockItems.find(s => s.id === Number(route.params.id))
    if (item) {
      form.value = {
        puskesmas: item.puskesmas, vaccine_code: item.vaccine_code, quantity: item.quantity,
        min_stock: item.min_stock, expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
        batch_no: item.batch_no || '', notes: item.notes || ''
      }
    }
  }
})

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await invStore.updateStock(route.params.id, form.value)
    } else {
      await invStore.addStock(form.value)
    }
    router.push('/inventory')
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  }
}
</script>
