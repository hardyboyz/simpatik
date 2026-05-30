<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b 0%, #0d6efd 100%);">
    <div class="card" style="width: 400px; padding: 2rem;">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;"><img src="/logo_belitung_timur.png" height="100px"/></div>
        <h2 style="font-size: 1.5rem; margin-bottom: 0.25rem;">SIMPATIK</h2>
        <p style="color: var(--secondary); font-size: 0.875rem;">Sistem Informasi Mikroplanning & Tracking Imunisasi Kejar</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-input" placeholder="admin@imunisasi.id" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-input" placeholder="••••••••" required>
        </div>
        <div v-if="error" style="color: var(--danger); font-size: 0.875rem; margin-bottom: 0.75rem;">{{ error }}</div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.625rem;" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Email atau password salah'
  } finally {
    loading.value = false
  }
}
</script>
