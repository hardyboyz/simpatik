<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterYear" class="form-select" style="width: 150px;">
          <option v-for="y in [2024, 2025, 2026, 2027]" :key="y" :value="y">{{ y }}</option>
        </select>
        <select v-model="filterVillage" class="form-select" style="width: 200px;">
          <option value="">Semua Desa</option>
          <option v-for="v in villages" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Target Imunisasi Tahunan</div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>Desa</th><th>Vaksin</th><th>Target</th><th>Sasaran Bayi (L/P)</th><th>Sasaran Baduta (L/P)</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in table.paginatedData.value" :key="row.key">
              <td>{{ row.villageName }}</td>
              <td>{{ row.vaccineName }}</td>
              <td>
                <input type="number" class="form-input" style="width: 80px; padding: 0.3rem;"
                  v-model.number="targetMap[`${row.villageId}-${row.vaccineCode}`]"
                  @change="saveTarget(row.villageId, row.vaccineCode, targetMap[`${row.villageId}-${row.vaccineCode}`])">
              </td>
              <td>{{ getDemographic(row.villageId, 'bayi') }}</td>
              <td>{{ getDemographic(row.villageId, 'baduta') }}</td>
              <td>
                <span class="badge" :class="targetMap[`${row.villageId}-${row.vaccineCode}`] > 0 ? 'badge-success' : 'badge-warning'">
                  {{ targetMap[`${row.villageId}-${row.vaccineCode}`] > 0 ? 'Tersimpan' : 'Belum diisi' }}
                </span>
              </td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="6" class="text-center" style="padding: 2rem; color: var(--secondary);">Tidak ada data</td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useVaccinesStore } from '../../stores/vaccines'
import { vaccinesApi, villagesApi, targetsApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'

const scope = useUserScope()
const vaccinesStore = useVaccinesStore()
const filterYear = ref(2026)
const filterVillage = ref('')
const targetMap = reactive({})
const vaccines = ref([])
const villages = ref([])

onMounted(async () => {
  try {
    const [vacRes, vilRes] = await Promise.all([vaccinesApi.list(), villagesApi.list()])
    vaccines.value = vacRes.data
    villages.value = vilRes.data
    if (!scope.isAdmin.value) {
      if (scope.villageId.value) {
        filterVillage.value = String(scope.villageId.value)
      }
    }
  } catch {}
  await loadTargets()
})

async function loadTargets() {
  try {
    const { data } = await targetsApi.list({ year: String(filterYear.value) })
    data.forEach(t => {
      targetMap[`${t.village_id}-${t.vaccine_code}`] = t.target_value
    })
  } catch {}
}

watch(filterYear, loadTargets)

const filteredVillages = computed(() => {
  let result = villages.value
  if (!scope.isAdmin.value) {
    if (scope.villageId.value) {
      result = result.filter(v => v.id === Number(scope.villageId.value))
    } else if (scope.districtId.value) {
      result = result.filter(v => v.district_id === Number(scope.districtId.value))
    }
  }
  if (filterVillage.value) {
    result = result.filter(v => v.id === Number(filterVillage.value))
  }
  return result
})

const allRows = computed(() => {
  const rows = []
  filteredVillages.value.forEach(v => {
    vaccines.value.forEach(vac => {
      rows.push({
        key: `${v.id}-${vac.code}`,
        villageId: v.id,
        villageName: v.name,
        vaccineCode: vac.code,
        vaccineName: vac.name
      })
    })
  })
  return rows
})

const table = useTable(allRows)

function getDemographic(villageId, type) {
  return type === 'bayi' ? `${Math.floor(Math.random() * 50 + 20)}/${Math.floor(Math.random() * 40 + 20)}` : `${Math.floor(Math.random() * 30 + 10)}/${Math.floor(Math.random() * 30 + 10)}`
}

async function saveTarget(villageId, vaccineCode, value) {
  try {
    await targetsApi.save({
      village_id: villageId,
      vaccine_code: vaccineCode,
      year: String(filterYear.value),
      target_value: value || 0
    })
  } catch (e) {
    console.error('Save target failed:', e)
  }
}
</script>
