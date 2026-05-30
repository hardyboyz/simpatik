<template>
  <div class="card" style="max-width: 600px;">
    <div class="card-header">{{ isEdit ? 'Edit Puskesmas' : 'Tambah Puskesmas' }}</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Nama Puskesmas *</label>
        <input v-model="form.name" class="form-input" placeholder="Nama puskesmas" required>
      </div>
      <div class="form-group">
        <label class="form-label">Kecamatan *</label>
        <select v-model="form.district_id" class="form-select" required>
          <option value="">Pilih kecamatan...</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Alamat</label>
        <textarea v-model="form.address" class="form-textarea" placeholder="Alamat puskesmas"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Telepon</label>
          <input v-model="form.phone" class="form-input" placeholder="No. telepon">
        </div>
        <div class="form-group">
          <label class="form-label">Kepala Puskesmas</label>
          <input v-model="form.head_name" class="form-input" placeholder="Nama kepala">
        </div>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Simpan' : 'Tambah' }}</button>
        <router-link to="/puskesmas" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { puskesmasApi, districtsApi } from '../../api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const districts = ref([])

const form = ref({ name: '', district_id: '', address: '', phone: '', head_name: '' })

onMounted(async () => {
  try {
    const { data } = await districtsApi.list()
    districts.value = data
  } catch {}
  if (isEdit.value) {
    try {
      const { data } = await puskesmasApi.get(route.params.id)
      form.value = { name: data.name, district_id: data.district_id, address: data.address || '', phone: data.phone || '', head_name: data.head_name || '' }
    } catch {}
  }
})

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await puskesmasApi.update(route.params.id, form.value)
    } else {
      await puskesmasApi.create(form.value)
    }
    router.push('/puskesmas')
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  }
}
</script>
