<template>
  <div>
    <div class="flex-between mb-2">
      <div class="flex gap-1">
        <select v-model="filterPuskesmas" class="form-select" style="width: 240px;">
          <option value="">Semua Puskesmas</option>
          <option v-for="p in puskesmasList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <button class="btn btn-outline-primary" @click="print">🖨️ Cetak</button>
    </div>

    <div id="print-area">
      <template v-for="(p, idx) in filteredPuskesmas" :key="p">
        <div class="card mb-2" :class="{ 'print-page': idx < filteredPuskesmas.length - 1 }">
          <div class="card-subheader" style="padding:0.75rem 1.25rem;background:#f8f9fa;border-bottom:2px solid var(--primary);font-weight:700;font-size:0.95rem">
            Puskesmas {{ p }}
            <span style="font-weight:400;font-size:0.8rem;margin-left:0.75rem">Total Anak: {{ totalKids(p) }}</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th rowspan="2">Vaksin</th>
                  <th rowspan="2">Usia (bln)</th>
                  <th style="background:#dbeafe">Realisasi Bulan Lalu</th>
                  <th style="background:#fef3c7" colspan="2">Kebutuhan Bulan Ini</th>
                  <th rowspan="2">Sudah Divaksin (Total)</th>
                </tr>
                <tr>
                  <th style="background:#dbeafe">{{ lastMonthLabel }}</th>
                  <th style="background:#fef3c7">Perlu Skrg</th>
                  <th style="background:#fef3c7">Proyeksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rowsByPuskesmas(p)" :key="r.vaccine_code">
                  <td><strong>{{ r.vaccine_name }}</strong></td>
                  <td>{{ r.age_months }}</td>
                  <td style="background:#eff6ff;font-weight:600">{{ r.last_month_real }}</td>
                  <td style="background:#fffbeb;font-weight:700" :class="r.this_month_need > 0 ? 'text-danger' : ''">{{ r.this_month_need }}</td>
                  <td style="background:#fffbeb">{{ r.need_upcoming }}</td>
                  <td>{{ r.already_received }}</td>
                </tr>
                <tr v-if="!rowsByPuskesmas(p).length">
                  <td colspan="6" class="text-center text-muted">Tidak ada data</td>
                </tr>
              </tbody>
              <tfoot v-if="rowsByPuskesmas(p).length">
                <tr style="font-weight:700;background:#e9ecef">
                  <td>TOTAL {{ p }}</td>
                  <td></td>
                  <td style="background:#dbeafe">{{ sumPuskesmas(p, 'last_month_real') }}</td>
                  <td style="background:#fef3c7" :class="sumPuskesmas(p, 'this_month_need') > 0 ? 'text-danger' : ''">{{ sumPuskesmas(p, 'this_month_need') }}</td>
                  <td style="background:#fef3c7">{{ sumPuskesmas(p, 'need_upcoming') }}</td>
                  <td>{{ sumPuskesmas(p, 'already_received') }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>

      <div class="card" v-if="data.length">
        <div class="card-header">Ringkasan {{ filterPuskesmas || 'Kabupaten' }}</div>
        <div class="grid grid-4">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--info)">{{ grand('total_kids') }}</div>
            <div class="stat-label">Total Anak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--success)">{{ grand('last_month_real') }}</div>
            <div class="stat-label">Realisasi Bulan Lalu</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--danger)">{{ grand('this_month_need') }}</div>
            <div class="stat-label">Perlu Bulan Ini</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--warning)">{{ grand('need_total') }}</div>
            <div class="stat-label">Total Kebutuhan</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { reportsApi } from '../../api'

const data = ref([])
const puskesmasList = ref([])
const filterPuskesmas = ref('')

const filteredPuskesmas = computed(() => {
  if (!filterPuskesmas.value) return puskesmasList.value
  return [filterPuskesmas.value]
})

const lastMonthLabel = computed(() => {
  const now = new Date()
  const m = now.getMonth() === 0 ? 12 : now.getMonth()
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  return months[m - 1] + ' ' + (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
})

function rowsByPuskesmas(p) {
  return data.value.filter(r => r.puskesmas === p)
}

function totalKids(p) {
  const row = rowsByPuskesmas(p)[0]
  return row ? row.total_kids : 0
}

function sumPuskesmas(p, key) {
  return rowsByPuskesmas(p).reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

function grand(key) {
  if (key === 'total_kids') {
    return data.value.reduce((s, r) => Math.max(s, Number(r.total_kids) || 0), 0)
  }
  if (filterPuskesmas.value) {
    return rowsByPuskesmas(filterPuskesmas.value).reduce((s, r) => s + (Number(r[key]) || 0), 0)
  }
  return data.value.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

async function load() {
  try {
    const res = await reportsApi.kebutuhanVaksin({ puskesmas: filterPuskesmas.value || undefined })
    data.value = res.data.data
    puskesmasList.value = res.data.puskesmas || []
  } catch { data.value = []; puskesmasList.value = [] }
}
onMounted(load)
watch(filterPuskesmas, load)

function print() { window.print() }
</script>
