<template>
  <div>
    <div class="card">
      <div class="card-header">Daftar Jenis Vaksin</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width:3rem">No</th>
              <th class="sortable" @click="table1.setSort('code')">Kode{{ table1.sortIndicator('code') }}</th>
              <th class="sortable" @click="table1.setSort('name')">Nama Vaksin{{ table1.sortIndicator('name') }}</th>
              <th class="sortable" @click="table1.setSort('category')">Kategori{{ table1.sortIndicator('category') }}</th>
              <th class="sortable" @click="table1.setSort('target_pct')">Target (%){{ table1.sortIndicator('target_pct') }}</th>
              <th>Dosis Ke-</th>
              <th>Usia (Bulan)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in table1.paginatedData.value" :key="v.id">
              <td>{{ (table1.currentPage.value - 1) * table1.perPage + i + 1 }}</td>
              <td><span class="badge badge-info">{{ v.code }}</span></td>
              <td>{{ v.name }}</td>
              <td>{{ v.category }}</td>
              <td>{{ v.target_pct }}%</td>
              <td>{{ v.dose_order }}</td>
              <td>{{ v.age_months !== null ? v.age_months + ' bln' : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        :currentPage="table1.currentPage.value"
        :totalPages="table1.totalPages.value"
        :total="table1.sortedData.value.length"
        :perPage="table1.perPage"
        :pageRange="table1.pageRange.value"
        @go="table1.goToPage"
      />
    </div>
    <div class="card">
      <div class="card-header">Jadwal Pemberian Vaksin</div>
      <div class="table-container">
        <table>
          <thead><tr><th>Vaksin</th><th>Dosis Ke-</th><th>Usia Pemberian</th></tr></thead>
          <tbody>
            <tr v-for="v in vaccines" :key="v.id">
              <td>{{ v.name }}</td>
              <td>{{ v.dose_order }}</td>
              <td>{{ v.age_months !== null ? v.age_months + ' bulan' : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { vaccinesApi } from '../../api'
import { useTable } from '../../composables/useTable'
import Pagination from '../../components/Pagination.vue'

const vaccines = ref([])

const vaccinesData = computed(() => vaccines.value)
const table1 = useTable(vaccinesData)

onMounted(async () => {
  try {
    const { data } = await vaccinesApi.list()
    vaccines.value = data
  } catch {}
})
</script>
