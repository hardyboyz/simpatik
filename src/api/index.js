import axios from 'axios'
import { addToQueue, getQueueSize, processQueue } from '../utils/syncQueue'
import { cacheResponse, getCachedResponse, invalidateCache } from '../utils/requestCache'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

function cacheKey(config) {
  const params = config.params ? JSON.stringify(config.params) : ''
  return (config.baseURL || '') + config.url + params
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  async response => {
    if (response.config.method === 'get') {
      cacheResponse(cacheKey(response.config), response.data)
    }
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)) {
      invalidateCache(response.config.url)
    }
    return response
  },
  async error => {
    if (!error.response && error.request) {
      const cfg = error.config
      if (cfg && ['post', 'put', 'patch', 'delete'].includes(cfg.method)) {
        try {
          await addToQueue(
            cfg.method.toUpperCase(),
            cfg.url,
            JSON.stringify(cfg.headers || {}),
            cfg.data ? JSON.stringify(cfg.data) : null
          )
          window.dispatchEvent(new CustomEvent('sync-queue-changed'))
          return { data: { offline: true, queued: true } }
        } catch {}
      }
      if (cfg && cfg.method === 'get') {
        const cached = await getCachedResponse(cacheKey(cfg))
        if (cached) return { data: cached }
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export async function trySyncQueue() {
  if (!navigator.onLine) return { processed: 0, failed: 0 }
  const result = await processQueue(api)
  if (result.processed > 0 || result.failed > 0) {
    window.dispatchEvent(new CustomEvent('sync-queue-changed'))
  }
  return result
}

export { getQueueSize }

export default api

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

// Users
export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`)
}

// Districts
export const districtsApi = {
  list: async () => {
    const res = await api.get('/districts')
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user?.district_id) {
        return { ...res, data: res.data.filter(d => d.id === user.district_id) }
      }
    } catch {}
    return res
  }
}

// Villages
export const villagesApi = {
  list: (params) => api.get('/villages', { params }),
  create: (data) => api.post('/villages', data)
}

// Vaccines
export const vaccinesApi = {
  list: () => api.get('/vaccines'),
  update: (id, data) => api.put(`/vaccines/${id}`, data)
}

// Kids
export const kidsApi = {
  list: (params) => api.get('/kids', { params }),
  get: (id) => api.get(`/kids/${id}`),
  create: (data) => api.post('/kids', data),
  update: (id, data) => api.put(`/kids/${id}`, data),
  remove: (id) => api.delete(`/kids/${id}`),
  addVaccine: (id, data) => api.post(`/kids/${id}/vaccines`, data)
}

// Targets
export const targetsApi = {
  list: (params) => api.get('/targets', { params }),
  save: (data) => api.post('/targets', data)
}

// Realizations
export const realizationsApi = {
  list: (params) => api.get('/realizations', { params }),
  create: (data) => api.post('/realizations', data),
  remove: (id) => api.delete(`/realizations/${id}`)
}

// Stock
export const stockApi = {
  list: (params) => api.get('/stock', { params }),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  remove: (id) => api.delete(`/stock/${id}`)
}

// Distributions
export const distributionsApi = {
  list: () => api.get('/distributions'),
  get: (id) => api.get(`/distributions/${id}`),
  create: (data) => api.post('/distributions', data),
  update: (id, data) => api.put(`/distributions/${id}`, data),
  remove: (id) => api.delete(`/distributions/${id}`)
}

// Puskesmas
export const puskesmasApi = {
  list: (params) => api.get('/puskesmas', { params }),
  get: (id) => api.get(`/puskesmas/${id}`),
  create: (data) => api.post('/puskesmas', data),
  update: (id, data) => api.put(`/puskesmas/${id}`, data),
  remove: (id) => api.delete(`/puskesmas/${id}`)
}

// Polindes
export const polindesApi = {
  list: (params) => api.get('/polindes', { params }),
  get: (id) => api.get(`/polindes/${id}`),
  create: (data) => api.post('/polindes', data),
  update: (id, data) => api.put(`/polindes/${id}`, data),
  remove: (id) => api.delete(`/polindes/${id}`)
}

// Demographics
export const demographicsApi = {
  list: (params) => api.get('/demographics', { params }),
  save: (data) => api.post('/demographics', data)
}

// Profile
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data)
}

// Dashboard
export const dashboardApi = {
  stats: (params) => api.get('/dashboard/stats', { params })
}

// Reports
export const reportsApi = {
  bulananBayi: (params) => api.get('/reports/bulanan-bayi', { params }),
  luarWilayah: (params) => api.get('/reports/luar-wilayah', { params }),
  analisaPws: (params) => api.get('/reports/analisa-pws', { params }),
  kumulatifBayi: (params) => api.get('/reports/kumulatif-bayi', { params }),
  rencanaTindakLanjut: (params) => api.get('/reports/rencana-tindak-lanjut', { params }),
  pemantauanUci: (params) => api.get('/reports/pemantauan-uci', { params }),
  monitoringUci: (params) => api.get('/reports/monitoring-uci', { params }),
  rekapitulasiIbuHamil: (params) => api.get('/reports/rekapitulasi-ibu-hamil', { params }),
  bulananIbuHamil: (params) => api.get('/reports/bulanan-ibu-hamil', { params }),
  kumulatifIbuHamil: (params) => api.get('/reports/kumulatif-ibu-hamil', { params }),
  kebutuhanVaksin: (params) => api.get('/reports/kebutuhan-vaksin', { params })
}

// ── E-KOHORT API ──────────────────────────────────────────────────
export const eKohortApi = {
  dashboard: (params) => api.get('/ekohort/dashboard', { params }),
  kmsSearch: (q) => api.get('/ekohort/kms/search', { params: { q } }),
  kmsDetail: (id) => api.get(`/ekohort/kms/${id}`),
  kmsAddGrowth: (id, data) => api.post(`/ekohort/kms/${id}/growth`, data),
  kmsUpdateGrowth: (id, data) => api.put(`/ekohort/kms/growth/${id}`, data),
  kmsDeleteGrowth: (id) => api.delete(`/ekohort/kms/growth/${id}`),
  queueToday: () => api.get('/ekohort/queue/today'),
  queueAdd: (data) => api.post('/ekohort/queue', data),
  queueUpdate: (id, data) => api.put(`/ekohort/queue/${id}`, data),
  queueRemove: (id) => api.delete(`/ekohort/queue/${id}`),
  quickVaccinate: (data) => api.post('/ekohort/quick-vaccinate', data),
  batchesActive: () => api.get('/ekohort/batches/active'),
  dropOutList: (params) => api.get('/ekohort/dropout', { params }),
  mikroplanning: (params) => api.get('/ekohort/mikroplanning', { params }),
  stockExpiring: () => api.get('/ekohort/stock/expiring'),
  mikroplanningExport: (params) => api.get('/ekohort/mikroplanning/export', { params }),
  whatsappSend: (data) => api.post('/ekohort/whatsapp/send', data),
  whatsappTriggerReminder: () => api.post('/ekohort/whatsapp/trigger-reminder'),
  whatsappLogs: (params) => api.get('/ekohort/whatsapp/logs', { params }),
  growthNutrition: (params) => api.get('/ekohort/dashboard/growth-nutrition', { params })
}
