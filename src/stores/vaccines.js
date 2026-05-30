import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { vaccinesApi, targetsApi, realizationsApi } from '../api'

export const useVaccinesStore = defineStore('vaccines', () => {
  const vaccineList = ref([])
  const targetData = ref([])
  const realizationData = ref([])
  const loading = ref(false)

  async function loadVaccines() {
    try {
      const { data } = await vaccinesApi.list()
      vaccineList.value = data
    } catch (e) {
      console.error(e)
    }
  }

  async function loadTargets(year = new Date().getFullYear().toString()) {
    loading.value = true
    try {
      const { data } = await targetsApi.list({ year })
      targetData.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function loadRealizations(params = {}) {
    loading.value = true
    try {
      const { data } = await realizationsApi.list(params)
      realizationData.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function saveTarget(data) {
    return await targetsApi.save(data)
  }

  async function saveRealization(data) {
    const result = await realizationsApi.create(data)
    await loadRealizations({ month: data.month, year: data.year })
    return result
  }

  async function deleteRealization(id) {
    await realizationsApi.remove(id)
    realizationData.value = realizationData.value.filter(r => r.id !== id)
  }

  return { vaccineList, targetData, realizationData, loading, loadVaccines, loadTargets, loadRealizations, saveTarget, saveRealization, deleteRealization }
})
