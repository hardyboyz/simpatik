<template>
  <div class="card" style="max-width: 800px;">
    <div class="card-header">{{ isEdit ? 'Edit Data Balita' : 'Tambah Data Balita' }}</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">NIK</label>
          <input v-model="form.nik" class="form-input" placeholder="NIK" maxlength="16">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Balita *</label>
          <input v-model="form.name" class="form-input" placeholder="Nama lengkap" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tanggal Lahir *</label>
          <input v-model="form.birth_date" type="date" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jenis Kelamin *</label>
          <select v-model="form.gender" class="form-select" required>
            <option value="">Pilih...</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Ibu</label>
          <input v-model="form.mother_name" class="form-input" placeholder="Nama ibu">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Ayah</label>
          <input v-model="form.father_name" class="form-input" placeholder="Nama ayah">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Desa / Kelurahan *</label>
          <select v-model="form.village_name" class="form-select" @change="onVillageChange" required>
            <option value="">Pilih desa...</option>
            <option v-for="v in villages" :key="v.id" :value="v.name">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kecamatan</label>
          <input v-model="form.district" class="form-input" readonly>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Alamat</label>
          <input v-model="form.address" class="form-input" placeholder="Alamat lengkap">
        </div>
        <div class="form-group">
          <label class="form-label">No. Telepon</label>
          <input v-model="form.phone" class="form-input" placeholder="No. telepon">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Catatan</label>
        <textarea v-model="form.notes" class="form-textarea" placeholder="Catatan medis"></textarea>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Simpan Perubahan' : 'Simpan' }}</button>
        <router-link to="/kids" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useKidsStore } from '../../stores/kids'
import { villagesApi } from '../../api'

const route = useRoute()
const router = useRouter()
const kidsStore = useKidsStore()
const isEdit = computed(() => !!route.params.id)
const villages = ref([])

const form = ref({
  nik: '', name: '', birth_date: '', gender: '', mother_name: '', father_name: '',
  village_name: '', village_id: null, address: '', phone: '', notes: '', status: 'pending', district: ''
})

onMounted(async () => {
  try {
    const { data } = await villagesApi.list()
    villages.value = data
  } catch {}
  if (isEdit.value) {
    const kid = await kidsStore.getKidById(route.params.id)
    if (kid) {
      form.value = {
        nik: kid.nik || '', name: kid.name, birth_date: kid.birth_date ? kid.birth_date.split('T')[0] : '',
        gender: kid.gender || '', mother_name: kid.mother_name || '', father_name: kid.father_name || '',
        village_name: kid.village_name || '', village_id: kid.village_id,
        address: kid.address || '', phone: kid.phone || '', notes: kid.notes || '',
        status: kid.status || 'pending', district: kid.district || kid.district_name || ''
      }
    }
  }
})

function onVillageChange() {
  const v = villages.value.find(v => v.name === form.value.village_name)
  if (v) {
    form.value.village_id = v.id
    form.value.district = v.district_name || ''
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await kidsStore.updateKid(route.params.id, form.value)
    } else {
      await kidsStore.addKid(form.value)
    }
    router.push('/kids')
  } catch (e) {
    alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message))
  }
}
</script>
