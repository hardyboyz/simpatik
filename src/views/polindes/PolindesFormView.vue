<template>
  <div class="card" style="max-width: 600px;">
    <div class="card-header">{{ isEdit ? 'Edit Polindes' : 'Tambah Polindes' }}</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Nama Polindes *</label>
        <input v-model="form.name" class="form-input" placeholder="Nama polindes" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Kecamatan *</label>
          <select v-model="form.district_id" class="form-select" @change="onDistrictChange" required>
            <option value="">Pilih kecamatan...</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Puskesmas *</label>
          <select v-model="form.puskesmas_id" class="form-select" @change="onPuskesmasChange" required>
            <option value="">Pilih puskesmas...</option>
            <option v-for="p in filteredPuskesmas" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Desa / Kelurahan *</label>
        <select v-model="form.village_id" class="form-select" required>
          <option value="">Pilih desa...</option>
          <option v-for="v in filteredVillages" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Alamat</label>
        <textarea v-model="form.address" class="form-textarea" placeholder="Alamat polindes"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Telepon</label>
          <input v-model="form.phone" class="form-input" placeholder="No. telepon">
        </div>
        <div class="form-group">
          <label class="form-label">Kepala Polindes</label>
          <input v-model="form.head_name" class="form-input" placeholder="Nama kepala">
        </div>
      </div>
      <div v-if="isEdit" class="form-group">
        <label class="form-label">Status</label>
        <select v-model="form.is_active" class="form-select">
          <option :value="1">Aktif</option>
          <option :value="0">Nonaktif</option>
        </select>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Simpan' : 'Tambah' }}</button>
        <router-link to="/polindes" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { polindesApi, puskesmasApi, districtsApi, villagesApi } from '../../api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const districts = ref([])
const puskesmasList = ref([])
const villages = ref([])

const form = ref({
  name: '', puskesmas_id: '', village_id: '', district_id: '',
  address: '', phone: '', head_name: '', is_active: 1
})

onMounted(async () => {
  try {
    const [disRes, pusRes, vilRes] = await Promise.all([
      districtsApi.list(), puskesmasApi.list(), villagesApi.list()
    ])
    districts.value = disRes.data
    puskesmasList.value = pusRes.data
    villages.value = vilRes.data
  } catch {}
  if (isEdit.value) {
    try {
      const { data } = await polindesApi.get(route.params.id)
      form.value = {
        name: data.name, puskesmas_id: data.puskesmas_id, village_id: data.village_id,
        district_id: data.district_id, address: data.address || '', phone: data.phone || '',
        head_name: data.head_name || '', is_active: data.is_active
      }
    } catch {}
  }
})

const filteredPuskesmas = computed(() => {
  if (!form.value.district_id) return []
  return puskesmasList.value.filter(p => p.district_id === Number(form.value.district_id))
})

const filteredVillages = computed(() => {
  if (!form.value.district_id) return []
  return villages.value.filter(v => v.district_id === Number(form.value.district_id))
})

function onDistrictChange() {
  form.value.puskesmas_id = ''
  form.value.village_id = ''
}

function onPuskesmasChange() {
  const pus = puskesmasList.value.find(p => p.id === Number(form.value.puskesmas_id))
  if (pus) {
    form.value.district_id = pus.district_id
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await polindesApi.update(route.params.id, form.value)
    } else {
      await polindesApi.create(form.value)
    }
    router.push('/polindes')
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  }
}
</script>
