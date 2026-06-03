<template>
  <div class="card" style="max-width: 700px;">
    <div class="card-header">{{ isEdit ? 'Edit Pengguna' : 'Tambah Pengguna' }}</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">Nama Lengkap *</label>
        <input v-model="form.name" class="form-input" placeholder="Nama lengkap" required>
      </div>
      <div class="form-group">
        <label class="form-label">Email *</label>
        <input v-model="form.email" type="email" class="form-input" :readonly="isEdit" placeholder="email@contoh.com" required>
      </div>
      <div v-if="!isEdit" class="form-group">
        <label class="form-label">Password *</label>
        <input v-model="form.password" type="password" class="form-input" placeholder="Min. 6 karakter" minlength="6" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role *</label>
          <select v-model="form.role" class="form-select" required>
            <option value="">Pilih...</option>
            <option v-for="r in ROLES" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Puskesmas</label>
          <select v-model="form.puskesmas" class="form-select">
            <option value="">Pilih...</option>
            <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <select v-model="form.district_id" class="form-select" @change="form.village_id = ''">
            <option v-if="districts.length > 1" value="">Semua Kecamatan</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Desa</label>
          <select v-model="form.village_id" class="form-select">
            <option value="">Semua Desa</option>
            <option v-for="v in filteredVillages" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">No. Telepon</label>
        <input v-model="form.phone" class="form-input" placeholder="No. telepon">
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Simpan' : 'Tambah Pengguna' }}</button>
        <router-link to="/users" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usersApi, villagesApi, districtsApi } from '../../api'
import { ROLES } from '../../config/masterData'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const puskesmasList = ref([])
const districts = ref([])
const allVillages = ref([])

const form = reactive({
  name: '', email: '', password: '', role: 'bidan', puskesmas: '', district_id: '', village_id: '', phone: ''
})

const filteredVillages = computed(() => {
  if (!form.district_id) return allVillages.value
  return allVillages.value.filter(v => v.district_id === Number(form.district_id)
    || v.id === Number(form.village_id))
})

onMounted(async () => {
  try {
    const [vilRes, disRes] = await Promise.all([villagesApi.list(), districtsApi.list()])
    allVillages.value = vilRes.data
    districts.value = disRes.data
    puskesmasList.value = [...new Set(vilRes.data.map(v => v.puskesmas).filter(Boolean))]
  } catch {}
  if (isEdit.value) {
    try {
      const { data } = await usersApi.list()
      const user = data.find(u => u.id === Number(route.params.id))
      if (user) {
        form.name = user.name
        form.email = user.email
        form.role = user.role
        form.puskesmas = user.puskesmas || ''
        form.district_id = user.district_id || ''
        form.village_id = user.village_id || ''
        form.phone = user.phone || ''
      }
    } catch {}
  }
})

async function handleSubmit() {
  try {
    const payload = {
      name: form.name, role: form.role,
      puskesmas: form.puskesmas,
      district_id: form.district_id || null,
      village_id: form.village_id || null,
      phone: form.phone
    }
    if (isEdit.value) {
      await usersApi.update(route.params.id, payload)
    } else {
      await usersApi.create({ ...payload, email: form.email, password: form.password })
    }
    router.push('/users')
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  }
}
</script>
