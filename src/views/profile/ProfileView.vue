<template>
  <div class="profile-page">
    <div class="card profile-card">
      <div class="card-header">Profil Saya</div>
      <div class="card-body">
        <div class="profile-avatar-section">
          <div class="avatar-wrapper">
            <div class="avatar-circle" @click="triggerFileInput">
              <span v-if="!previewUrl && !form.avatar" class="avatar-placeholder">{{ initials }}</span>
              <img v-if="previewUrl" :src="previewUrl" class="avatar-img">
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="onFileSelect">
            <button class="btn btn-sm btn-outline mt-1" @click="triggerFileInput">Ganti Foto</button>
          </div>
          <div class="profile-info">
            <div class="info-row"><span class="info-label">Nama</span><span class="info-value">{{ user?.name }}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">{{ user?.email }}</span></div>
            <div class="info-row"><span class="info-label">Role</span><span class="info-value">{{ getRoleName(user?.role) }}</span></div>
            <div class="info-row"><span class="info-label">Puskesmas</span><span class="info-value">{{ user?.puskesmas || '-' }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Edit Profil</div>
      <div class="card-body">
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input v-model="form.name" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">No. Telepon</label>
            <input v-model="form.phone" class="form-input" placeholder="No. telepon">
          </div>
          <div class="form-group">
            <label class="form-label">Alamat</label>
            <textarea v-model="form.address" class="form-textarea" rows="3" placeholder="Alamat lengkap"></textarea>
          </div>

          <hr class="form-divider">

          <div class="form-group">
            <label class="form-label">Password Saat Ini</label>
            <input v-model="form.current_password" type="password" class="form-input" placeholder="Diisi jika ingin mengganti password">
          </div>
          <div class="form-group">
            <label class="form-label">Password Baru</label>
            <input v-model="form.new_password" type="password" class="form-input" placeholder="Min. 6 karakter" minlength="6">
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { profileApi } from '../../api'
import { useAuthStore } from '../../stores/auth'
import { ROLES } from '../../config/masterData'

const auth = useAuthStore()
const fileInput = ref(null)
const saving = ref(false)
const previewUrl = ref('')
const user = ref(null)

const form = reactive({
  name: '', phone: '', address: '', current_password: '', new_password: '', avatar: ''
})

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

onMounted(async () => {
  try {
    const { data } = await profileApi.get()
    user.value = data
    form.name = data.name || ''
    form.phone = data.phone || ''
    form.address = data.address || ''
    form.avatar = data.avatar || ''
    if (data.avatar) previewUrl.value = data.avatar
  } catch {}
})

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    previewUrl.value = ev.target.result
    form.avatar = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function handleSave() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      avatar: form.avatar || undefined
    }
    if (form.new_password) {
      payload.current_password = form.current_password
      payload.new_password = form.new_password
    }
    const { data } = await profileApi.update(payload)
    user.value = data
    form.current_password = ''
    form.new_password = ''
    alert('Profil berhasil diperbarui')
  } catch (e) {
    alert(e.response?.data?.error || 'Gagal menyimpan profil')
  } finally {
    saving.value = false
  }
}

function getRoleName(roleId) {
  const r = ROLES.find(r => r.id === roleId)
  return r ? r.name : roleId
}
</script>

<style scoped>
.profile-page {
  max-width: 700px;
}
.profile-avatar-section {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.avatar-placeholder {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hidden-input { display: none; }
.mt-1 { margin-top: 0.5rem; }
.profile-info {
  flex: 1;
}
.info-row {
  display: flex;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-label {
  width: 120px;
  font-weight: 600;
  color: var(--secondary);
  font-size: 0.9rem;
}
.info-value {
  flex: 1;
}
.form-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.25rem 0;
}
</style>
