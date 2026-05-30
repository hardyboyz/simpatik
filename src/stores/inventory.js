import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stockApi, distributionsApi } from '../api'

export const useInventoryStore = defineStore('inventory', () => {
  const stockItems = ref([])
  const distributions = ref([])
  const loading = ref(false)

  async function loadStock(params = {}) {
    loading.value = true
    try {
      const { data } = await stockApi.list(params)
      stockItems.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function loadDistributions() {
    loading.value = true
    try {
      const { data } = await distributionsApi.list()
      distributions.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function addStock(data) {
    const result = await stockApi.create(data)
    await loadStock()
    return result
  }

  async function updateStock(id, data) {
    await stockApi.update(id, data)
    await loadStock()
  }

  async function deleteStock(id) {
    await stockApi.remove(id)
    stockItems.value = stockItems.value.filter(s => s.id !== id)
  }

  async function addDistribution(data) {
    const result = await distributionsApi.create(data)
    await loadDistributions()
    return result
  }

  const stockByVaccine = computed(() => {
    const grouped = {}
    stockItems.value.forEach(s => {
      if (!grouped[s.vaccine_code]) grouped[s.vaccine_code] = 0
      grouped[s.vaccine_code] += Number(s.quantity) || 0
    })
    return grouped
  })

  const totalStock = computed(() => stockItems.value.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0))
  const lowStockItems = computed(() => stockItems.value.filter(s => Number(s.quantity) <= (s.min_stock || 0)))

  return { stockItems, distributions, loading, loadStock, loadDistributions, addStock, updateStock, deleteStock, addDistribution, stockByVaccine, totalStock, lowStockItems }
})
