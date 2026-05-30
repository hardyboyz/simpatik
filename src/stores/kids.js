import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { kidsApi } from '../api'

export const useKidsStore = defineStore('kids', () => {
  const kids = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadKids(params = {}) {
    loading.value = true
    try {
      const { data } = await kidsApi.list(params)
      kids.value = data
    } catch (e) {
      error.value = e.response?.data?.error || e.message
    } finally {
      loading.value = false
    }
  }

  async function addKid(data) {
    const { data: result } = await kidsApi.create(data)
    await loadKids()
    return result
  }

  async function updateKid(id, data) {
    await kidsApi.update(id, data)
    await loadKids()
  }

  async function deleteKid(id) {
    await kidsApi.remove(id)
    kids.value = kids.value.filter(k => k.id !== id)
  }

  async function getKidById(id) {
    try {
      const { data } = await kidsApi.get(id)
      return data
    } catch {
      return null
    }
  }

  const kidsByVillage = computed(() => {
    const grouped = {}
    kids.value.forEach(k => {
      if (!grouped[k.village_name]) grouped[k.village_name] = []
      grouped[k.village_name].push(k)
    })
    return grouped
  })

  const totalKids = computed(() => kids.value.length)
  const vaccinatedKids = computed(() => kids.value.filter(k => k.status === 'completed').length)
  const pendingKids = computed(() => kids.value.filter(k => k.status === 'pending').length)

  return { kids, loading, error, loadKids, addKid, updateKid, deleteKid, getKidById, kidsByVillage, totalKids, vaccinatedKids, pendingKids }
})
