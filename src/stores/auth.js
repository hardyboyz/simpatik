import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  let initialUser = null
  try { initialUser = JSON.parse(localStorage.getItem('user')) } catch {}
  const user = ref(initialUser)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || user.value?.email || '')
  const userPuskesmas = computed(() => user.value?.puskesmas || '')
  const userDistrictId = computed(() => user.value?.district_id || null)
  const userVillageId = computed(() => user.value?.village_id || null)

  const permissions = computed(() => {
    const role = user.value?.role
    if (!role) return []
    const roleMap = {
      admin: ['all'],
      puskesmas: ['read', 'write', 'edit', 'view_reports'],
      bidan: ['read', 'write'],
      dinkes: ['read']
    }
    return roleMap[role] || []
  })

  function can(permission) {
    if (permissions.value.includes('all')) return true
    return permissions.value.includes(permission)
  }

  async function login(email, password) {
    loading.value = true
    try {
      const { data } = await authApi.login({ email, password })
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function checkAuth() {
    if (!token.value) return false
    try {
      const { data } = await authApi.me()
      user.value = data
      if (data) localStorage.setItem('user', JSON.stringify(data))
      return true
    } catch {
      await logout()
      return false
    }
  }

  return { user, token, loading, isAuthenticated, userRole, userName, userPuskesmas, userDistrictId, userVillageId, permissions, can, login, logout, checkAuth }
})
