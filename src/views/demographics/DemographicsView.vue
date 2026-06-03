<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterDistrict" class="form-select" style="width: 200px;">
          <option v-if="districts.length > 1" value="">Semua Kecamatan</option>
          <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="filterYear" class="form-select" style="width: 150px;">
          <option v-for="y in [2024, 2025, 2026, 2027]" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="flex gap-1">
        <button class="btn btn-outline-success" @click="exportXlsx">📊 Export XLSX</button>
        <button class="btn btn-outline-danger" @click="exportPdf">📄 Export PDF</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Data Demografi</div>
      <div class="table-container">
        <table class="table-demografi">
          <thead>
            <tr>
              <th rowspan="2" class="th-desa">Desa / Kelurahan</th>
              <th colspan="3" class="th-baby">NEWBORN BABY</th>
              <th colspan="3" class="th-infant">SURVIVING INFANT</th>
              <th colspan="3" class="th-baduta">BADUTA</th>
              <th rowspan="2" class="th-wus">Jumlah Sasaran<br>WUS<br>(Hamil + Tidak Hamil)</th>
              <th rowspan="2" class="th-wus">Jumlah Sasaran<br>WUS<br>(Ibu Hamil)</th>
              <th rowspan="2" class="th-wus">Jumlah Sasaran<br>WUS Tidak Hamil</th>
            </tr>
            <tr>
              <th class="th-baby">L</th><th class="th-baby">P</th><th class="th-baby">Jumlah</th>
              <th class="th-infant">L</th><th class="th-infant">P</th><th class="th-infant">Jumlah</th>
              <th class="th-baduta">L</th><th class="th-baduta">P</th><th class="th-baduta">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in table.paginatedData.value" :key="row.id">
              <td class="td-desa"><strong>{{ row.name }}</strong></td>
              <td class="td-baby"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].baby_l" @change="autoSave(row.id)" min="0"></td>
              <td class="td-baby"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].baby_p" @change="autoSave(row.id)" min="0"></td>
              <td class="td-jumlah td-baby">{{ (formData[row.id].baby_l || 0) + (formData[row.id].baby_p || 0) }}</td>
              <td class="td-infant"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].infant_l" @change="autoSave(row.id)" min="0"></td>
              <td class="td-infant"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].infant_p" @change="autoSave(row.id)" min="0"></td>
              <td class="td-jumlah td-infant">{{ (formData[row.id].infant_l || 0) + (formData[row.id].infant_p || 0) }}</td>
              <td class="td-baduta"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].baduta_l" @change="autoSave(row.id)" min="0"></td>
              <td class="td-baduta"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].baduta_p" @change="autoSave(row.id)" min="0"></td>
              <td class="td-jumlah td-baduta">{{ (formData[row.id].baduta_l || 0) + (formData[row.id].baduta_p || 0) }}</td>
              <td class="td-wus"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].wus_total" @change="autoSave(row.id)" min="0"></td>
              <td class="td-wus"><input type="number" class="form-input input-demografi" v-model.number="formData[row.id].wus_pregnant" @change="autoSave(row.id)" min="0"></td>
              <td class="td-jumlah td-wus">{{ (formData[row.id].wus_total || 0) - (formData[row.id].wus_pregnant || 0) }}</td>
            </tr>
            <tr v-if="!table.paginatedData.value.length">
              <td colspan="13" class="text-center" style="padding: 2rem; color: var(--secondary);">Tidak ada data desa</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="tr-total">
              <td><strong>TOTAL</strong></td>
              <td class="td-jumlah td-baby">{{ sum('baby_l') }}</td>
              <td class="td-jumlah td-baby">{{ sum('baby_p') }}</td>
              <td class="td-jumlah td-baby">{{ sum('baby_l') + sum('baby_p') }}</td>
              <td class="td-jumlah td-infant">{{ sum('infant_l') }}</td>
              <td class="td-jumlah td-infant">{{ sum('infant_p') }}</td>
              <td class="td-jumlah td-infant">{{ sum('infant_l') + sum('infant_p') }}</td>
              <td class="td-jumlah td-baduta">{{ sum('baduta_l') }}</td>
              <td class="td-jumlah td-baduta">{{ sum('baduta_p') }}</td>
              <td class="td-jumlah td-baduta">{{ sum('baduta_l') + sum('baduta_p') }}</td>
              <td class="td-jumlah td-wus">{{ sum('wus_total') }}</td>
              <td class="td-jumlah td-wus">{{ sum('wus_pregnant') }}</td>
              <td class="td-jumlah td-wus">{{ sum('wus_total') - sum('wus_pregnant') }}</td>
            </tr>
          </tfoot>
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { demographicsApi, villagesApi, districtsApi } from '../../api'
import { useTable } from '../../composables/useTable'
import { useUserScope } from '../../composables/useUserScope'
import Pagination from '../../components/Pagination.vue'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const scope = useUserScope()
const filterYear = ref(2026)
const filterDistrict = ref('')
const villages = ref([])
const districts = ref([])
const savedData = ref([])
const formData = reactive({})
const saving = ref({})

onMounted(async () => {
  try {
    const [vilRes, disRes] = await Promise.all([villagesApi.list(), districtsApi.list()])
    villages.value = vilRes.data
    districts.value = disRes.data
    if (!scope.isAdmin.value && scope.districtId.value) {
      filterDistrict.value = String(scope.districtId.value)
    }
  } catch {}
  await loadData()
})

async function loadData() {
  try {
    const { data } = await demographicsApi.list({ year: filterYear.value })
    savedData.value = data
  } catch {}

  villages.value.forEach(v => {
    const existing = savedData.value.find(d => d.village_id === v.id)
    formData[v.id] = {
      baby_l: existing?.baby_l || 0,
      baby_p: existing?.baby_p || 0,
      infant_l: existing?.infant_l || 0,
      infant_p: existing?.infant_p || 0,
      baduta_l: existing?.baduta_l || 0,
      baduta_p: existing?.baduta_p || 0,
      wus_total: existing?.wus_total || 0,
      wus_pregnant: existing?.wus_pregnant || 0
    }
  })
}

const filteredVillages = computed(() => {
  let result = villages.value
  if (!scope.isAdmin.value) {
    if (scope.villageId.value) {
      result = result.filter(v => v.id === Number(scope.villageId.value))
    } else if (scope.districtId.value) {
      result = result.filter(v => v.district_id === Number(scope.districtId.value))
    }
  }
  if (filterDistrict.value) {
    result = result.filter(v => v.district_id === Number(filterDistrict.value))
  }
  return result
})

const table = useTable(filteredVillages)

watch(filterYear, () => {
  loadData()
})

async function autoSave(villageId) {
  const data = formData[villageId]
  try {
    await demographicsApi.save({
      village_id: villageId,
      year: filterYear.value,
      ...data
    })
  } catch (e) {
    console.error('Save failed:', e)
  }
}

function sum(field) {
  let total = 0
  table.paginatedData.value.forEach(v => {
    total += Number(formData[v.id]?.[field] || 0)
  })
  return total
}

function exportDataRows() {
  return filteredVillages.value.map(v => {
    const f = formData[v.id] || {}
    const babyL = Number(f.baby_l) || 0
    const babyP = Number(f.baby_p) || 0
    const infantL = Number(f.infant_l) || 0
    const infantP = Number(f.infant_p) || 0
    const badutaL = Number(f.baduta_l) || 0
    const badutaP = Number(f.baduta_p) || 0
    const wusTotal = Number(f.wus_total) || 0
    const wusPregnant = Number(f.wus_pregnant) || 0
    return {
      desa: v.name,
      baby_l: babyL, baby_p: babyP, baby_jml: babyL + babyP,
      infant_l: infantL, infant_p: infantP, infant_jml: infantL + infantP,
      baduta_l: badutaL, baduta_p: badutaP, baduta_jml: badutaL + badutaP,
      wus_total: wusTotal,
      wus_pregnant: wusPregnant,
      wus_tidak_hamil: wusTotal - wusPregnant
    }
  })
}

function exportXlsx() {
  const rows = exportDataRows()
  const grand = rows.reduce((a, r) => ({
    baby_l: a.baby_l + r.baby_l, baby_p: a.baby_p + r.baby_p,
    infant_l: a.infant_l + r.infant_l, infant_p: a.infant_p + r.infant_p,
    baduta_l: a.baduta_l + r.baduta_l, baduta_p: a.baduta_p + r.baduta_p,
    wus_total: a.wus_total + r.wus_total, wus_pregnant: a.wus_pregnant + r.wus_pregnant
  }), { baby_l:0, baby_p:0, infant_l:0, infant_p:0, baduta_l:0, baduta_p:0, wus_total:0, wus_pregnant:0 })

  const data = [
    ['Data Demografi - ' + filterYear.value],
    [],
    ['Desa / Kelurahan',
     'NEWBORN BABY (L)', 'NEWBORN BABY (P)', 'NEWBORN BABY (Jml)',
     'SURVIVING INFANT (L)', 'SURVIVING INFANT (P)', 'SURVIVING INFANT (Jml)',
     'BADUTA (L)', 'BADUTA (P)', 'BADUTA (Jml)',
     'WUS (Jml)', 'WUS (Hamil)', 'WUS (Tidak Hamil)'],
    ...rows.map(r => [r.desa, r.baby_l, r.baby_p, r.baby_jml, r.infant_l, r.infant_p, r.infant_jml, r.baduta_l, r.baduta_p, r.baduta_jml, r.wus_total, r.wus_pregnant, r.wus_tidak_hamil]),
    [],
    ['TOTAL', grand.baby_l, grand.baby_p, grand.baby_l + grand.baby_p,
              grand.infant_l, grand.infant_p, grand.infant_l + grand.infant_p,
              grand.baduta_l, grand.baduta_p, grand.baduta_l + grand.baduta_p,
              grand.wus_total, grand.wus_pregnant, grand.wus_total - grand.wus_pregnant]
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 15 }, { wch: 17 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Demografi')
  XLSX.writeFile(wb, `Data_Demografi_${filterYear.value}.xlsx`)
}

function exportPdf() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const rows = exportDataRows()
  const grand = rows.reduce((a, r) => ({
    baby_l: a.baby_l + r.baby_l, baby_p: a.baby_p + r.baby_p,
    infant_l: a.infant_l + r.infant_l, infant_p: a.infant_p + r.infant_p,
    baduta_l: a.baduta_l + r.baduta_l, baduta_p: a.baduta_p + r.baduta_p,
    wus_total: a.wus_total + r.wus_total, wus_pregnant: a.wus_pregnant + r.wus_pregnant
  }), { baby_l:0, baby_p:0, infant_l:0, infant_p:0, baduta_l:0, baduta_p:0, wus_total:0, wus_pregnant:0 })

  doc.setFontSize(14)
  doc.text('Data Demografi - ' + filterYear.value, 14, 15)

  const headers = [['Desa / Kelurahan',
    'NB L', 'NB P', 'NB Jml',
    'SI L', 'SI P', 'SI Jml',
    'BD L', 'BD P', 'BD Jml',
    'WUS', 'WUS Hamil', 'WUS Tidak']]
  const body = rows.map(r => [r.desa, r.baby_l, r.baby_p, r.baby_jml, r.infant_l, r.infant_p, r.infant_jml, r.baduta_l, r.baduta_p, r.baduta_jml, r.wus_total, r.wus_pregnant, r.wus_tidak_hamil])
  body.push(['TOTAL', grand.baby_l, grand.baby_p, grand.baby_l + grand.baby_p,
                     grand.infant_l, grand.infant_p, grand.infant_l + grand.infant_p,
                     grand.baduta_l, grand.baduta_p, grand.baduta_l + grand.baduta_p,
                     grand.wus_total, grand.wus_pregnant, grand.wus_total - grand.wus_pregnant])

  doc.autoTable({
    head: headers,
    body: body,
    startY: 20,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 70, 11], fontSize: 7 },
    columnStyles: { 0: { cellWidth: 50 } },
    didParseCell: function (data) {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [240, 240, 240]
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  doc.save(`Data_Demografi_${filterYear.value}.pdf`)
}
</script>

<style>
.table-demografi { min-width: 1100px; border-collapse: separate !important; border-spacing: 0; }
.table-demografi th { text-align: center; vertical-align: middle; font-size: 0.8rem; white-space: nowrap; }
.table-demografi td { text-align: center; vertical-align: middle; }
.table-demografi .td-desa { text-align: left !important; }
.table-demografi .td-jumlah { font-weight: 600; color: var(--primary); }
.table-demografi .input-demografi { width: 60px; text-align: center; padding: 0.25rem !important; }
.table-demografi .tr-total td { font-weight: 700; background: #f1f5f9; border-top: 2px solid var(--primary); }

.table-demografi th,
.table-demografi td {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 0.4rem;
}

.table-demografi .th-desa,
.table-demografi .td-desa {
  position: sticky !important;
  left: 0 !important;
  z-index: 10 !important;
  background: #fff !important;
  border-right: 2px solid #d1d5db !important;
}
.table-demografi .th-desa { z-index: 11 !important; }
.table-demografi .tr-total .td-desa { background: #f1f5f9 !important; }

.table-demografi .th-baby { background: #dbeafe; }
.table-demografi .th-infant { background: #dcfce7; }
.table-demografi .th-baduta { background: #fef3c7; }
.table-demografi .th-wus { background: #f3e8ff; }

.table-demografi .td-baby { background: #eff6ff; }
.table-demografi .td-infant { background: #f0fdf4; }
.table-demografi .td-baduta { background: #fffbeb; }
.table-demografi .td-wus { background: #faf5ff; }
</style>
