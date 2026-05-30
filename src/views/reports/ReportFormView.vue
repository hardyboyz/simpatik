<template>
  <div class="card" style="max-width: 700px;">
    <div class="card-header">Buat Laporan Bulanan</div>
    <form @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Bulan *</label>
          <select v-model="form.month" class="form-select" required>
            <option value="">Pilih...</option>
            <option v-for="(m, i) in MONTHS" :key="i" :value="String(i + 1).padStart(2, '0')">{{ m }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tahun *</label>
          <select v-model="form.year" class="form-select" required>
            <option value="">Pilih...</option>
            <option v-for="y in [2024, 2025, 2026, 2027]" :key="y" :value="String(y)">{{ y }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Desa *</label>
          <select v-model="form.village_name" class="form-select" @change="onVillageChange" required>
            <option value="">Pilih desa...</option>
            <option v-for="v in villages" :key="v.id" :value="v.name">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Puskesmas</label>
          <input v-model="form.puskesmas" class="form-input" readonly>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Jenis Vaksin *</label>
        <select v-model="form.vaccine_code" class="form-select" required>
          <option value="">Pilih vaksin...</option>
          <option v-for="v in vaccines" :key="v.id" :value="v.code">{{ v.name }} (Target: {{ v.target_pct }}%)</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Jumlah Sasaran *</label>
          <input v-model.number="form.target_value" type="number" min="0" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Realisasi *</label>
          <input v-model.number="form.realization_value" type="number" min="0" class="form-input" required>
        </div>
      </div>
      <div v-if="form.target_value > 0" class="form-group">
        <div style="padding: 0.75rem; background: var(--bg); border-radius: 0.375rem;">
          Capaian: <strong>{{ Math.round((form.realization_value / form.target_value) * 100) }}%</strong>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Petugas</label>
          <input v-model="form.officer" class="form-input" placeholder="Nama petugas">
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan</label>
          <input v-model="form.notes" class="form-input" placeholder="Catatan">
        </div>
      </div>
      <div class="form-group">
        <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Menyimpan...' : 'Simpan Laporan' }}</button>
        <router-link to="/reports" class="btn btn-outline" style="margin-left: 0.5rem;">Batal</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVaccinesStore } from '../../stores/vaccines'
import { vaccinesApi, villagesApi } from '../../api'
import { MONTHS } from '../../config/masterData'

const router = useRouter()
const vaccinesStore = useVaccinesStore()
const submitting = ref(false)
const vaccines = ref([])
const villages = ref([])

const form = ref({
  month: '', year: '', village_name: '', village_id: null, puskesmas: '',
  vaccine_code: '', target_value: 0, realization_value: 0, officer: '', notes: ''
})

onMounted(async () => {
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    villages.value = vilRes.data
  } catch {}
})

function onVillageChange() {
  const v = villages.value.find(v => v.name === form.value.village_name)
  if (v) {
    form.value.village_id = v.id
    form.value.puskesmas = v.puskesmas || ''
  }
}

async function handleSubmit() {
  submitting.value = true
  try {
    await vaccinesStore.saveRealization(form.value)
    router.push('/reports')
  } catch (e) {
    alert('Gagal: ' + (e.response?.data?.error || e.message))
  } finally {
    submitting.value = false
  }
}
</script>
