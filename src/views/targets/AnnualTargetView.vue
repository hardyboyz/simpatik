<template>
  <div>
    <div class="flex-between mb-2">
      <select v-model="filterYear" class="form-select" style="width: 150px;">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <div class="grid grid-2" style="align-items: start;">
      <div class="card">
        <div class="card-header">Target Tahunan per Vaksin</div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>No</th><th>Vaksin</th><th>Target (%)</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              <tr v-for="(v, i) in table.paginatedData.value" :key="v.id">
                <td>{{ (table.currentPage.value - 1) * table.perPage + i + 1 }}</td>
                <td><strong>{{ v.name }}</strong> <span class="badge badge-info">{{ v.code }}</span></td>
                <td>
                  <input type="number" class="form-input" style="width: 80px; text-align: center;"
                    v-model.number="targetPct[v.id]"
                    :class="{ 'input-changed': targetPct[v.id] !== originalPct[v.id] }"
                    min="0" max="100">
                </td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="saveTarget(v.id)"
                    :disabled="targetPct[v.id] === originalPct[v.id]">
                    Simpan
                  </button>
                </td>
              </tr>
              <tr v-if="!table.paginatedData.value.length">
                <td colspan="4" class="text-center" style="color: var(--secondary);">Tidak ada data</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          :currentPage="table.currentPage.value"
          :totalPages="table.totalPages.value"
          :total="table.sortedData.value.length"
          :perPage="table.perPage"
          :pageRange="table.pageRange.value"
          @go="table.goToPage"
        />
      </div>

      <div class="card">
        <div class="card-header">Grafik Target vs Realisasi</div>
        <div style="height: 350px;">
          <TargetRealisationChart
            :labels="chartLabels"
            :target-data="chartTargets"
            :realization-data="chartRealizations"
            :title="'Target vs Realisasi ' + filterYear"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { vaccinesApi, realizationsApi } from '../../api'
import { useTable } from '../../composables/useTable'
import Pagination from '../../components/Pagination.vue'
import TargetRealisationChart from '../../components/charts/TargetRealisationChart.vue'

const currentYear = new Date().getFullYear()
const years = computed(() => {
  const y = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) y.push(i)
  return y
})
const filterYear = ref(currentYear)
const vaccines = ref([])
const realizations = ref([])
const targetPct = reactive({})
const originalPct = reactive({})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    const [vacRes, realRes] = await Promise.all([
      vaccinesApi.list(),
      realizationsApi.list({ year: filterYear.value })
    ])
    vaccines.value = vacRes.data
    realizations.value = realRes.data

    vaccines.value.forEach(v => {
      targetPct[v.id] = v.target_pct
      originalPct[v.id] = v.target_pct
    })
  } catch {}
}

watch(filterYear, loadData)

const table = useTable(vaccines)

async function saveTarget(vaccineId) {
  try {
    await vaccinesApi.update(vaccineId, { target_pct: targetPct[vaccineId] || 0 })
    originalPct[vaccineId] = targetPct[vaccineId]
    const v = vaccines.value.find(x => x.id === vaccineId)
    if (v) v.target_pct = targetPct[vaccineId]
  } catch (e) {
    console.error('Save failed:', e)
  }
}

const chartLabels = computed(() => {
  return vaccines.value.map(v => v.code)
})

const chartTargets = computed(() => {
  return vaccines.value.map(v => Number(targetPct[v.id] || 0))
})

const chartRealizations = computed(() => {
  return vaccines.value.map(v => {
    const byCode = realizations.value.filter(r => r.vaccine_code === v.code && Number(r.target_value) > 0)
    if (!byCode.length) return 0
    const totalReal = byCode.reduce((s, r) => s + Number(r.realization_value || 0), 0)
    const totalTarget = byCode.reduce((s, r) => s + Number(r.target_value || 0), 0)
    return totalTarget ? Math.round((totalReal / totalTarget) * 100) : 0
  })
})
</script>

<style scoped>
.input-changed { border-color: var(--warning) !important; background: #fffbe6; }
</style>
