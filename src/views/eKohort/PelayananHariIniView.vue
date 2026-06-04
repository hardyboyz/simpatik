<template>
  <div>
    <div class="grid grid-2 mb-2">
      <div class="card" style="border-left: 4px solid var(--primary);">
        <div class="card-header flex-between">
          <span>Pelayanan Hari Ini: {{ todayDate }}</span>
          <span class="badge badge-info">{{ queue.length }} antrean</span>
        </div>
        <div class="pelayanan-info">
          <div>Petugas: <strong>{{ auth.userName }}</strong></div>
          <div>Puskesmas: <strong>{{ auth.userPuskesmas || '-' }}</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">Tambah Antrean</div>
        <div class="add-queue-row">
          <input v-model="quickSearch" class="form-input" placeholder="Cari nama anak..."
            @keyup.enter="searchQuick" style="flex:1;">
          <button class="btn btn-primary btn-sm" @click="searchQuick">Cari</button>
        </div>
        <div v-if="quickResults.length" class="quick-results">
          <div v-for="k in quickResults" :key="k.id" class="quick-item" @click="addToQueue(k)">
            <span>{{ k.name }}</span>
            <span style="font-size:0.75rem;color:var(--secondary);">{{ k.village_name }}</span>
            <button class="btn btn-sm btn-success">+ Antre</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex-between">
        <span>Antrean Posyandu Hari Ini</span>
        <div class="flex gap-1">
          <select v-model="filterQueueStatus" class="form-select" style="width:150px;">
            <option value="">Semua</option>
            <option value="waiting">Menunggu</option>
            <option value="done">Selesai</option>
          </select>
          <button class="btn btn-sm btn-outline" @click="loadQueue">🔄</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>No</th><th>Nama Anak</th><th>NIK</th><th>Ibu</th><th>Desa</th><th>Status</th><th>Vaksinasi</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            <tr v-for="q in filteredQueue" :key="q.id">
              <td>{{ q.queue_number }}</td>
              <td><strong>{{ q.kid_name }}</strong></td>
              <td>{{ q.nik || '-' }}</td>
              <td>{{ q.mother_name || '-' }}</td>
              <td>{{ q.village_name || '-' }}</td>
              <td>
                <span class="badge" :class="q.status === 'done' ? 'badge-success' : 'badge-warning'">
                  {{ q.status === 'done' ? 'Selesai' : 'Menunggu' }}
                </span>
              </td>
              <td>
                <div class="vaccine-actions" v-if="q.status !== 'done'">
                  <button
                    v-for="v in quickVaccines"
                    :key="v.code"
                    class="btn btn-sm vaccine-btn"
                    :class="[v.code.toLowerCase().replace(/[^a-z0-9]/g, '') + '-btn', { 'vaccine-done': isVaccineGiven(q, v.code) }]"
                    :disabled="vaccinating === q.id + '-' + v.code || isVaccineGiven(q, v.code)"
                    @click="confirmVaccinate(q, v)"
                  >
                    {{ isVaccineGiven(q, v.code) ? v.short + ' ✓' : (vaccinating === q.id + '-' + v.code ? '...' : v.short) }}
                  </button>
                </div>
                <span v-else style="color:var(--secondary);font-size:0.8rem;">
                  {{ q.officer ? `oleh ${q.officer}` : 'Selesai' }}
                </span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button v-if="q.status !== 'done'"
                    class="btn btn-sm btn-success"
                    @click="confirmDone(q)">Selesai</button>
                  <button v-if="q.status !== 'done'"
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmCancel(q)">Batal</button>
                  <span v-else>✅</span>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredQueue.length">
              <td colspan="8" class="text-center" style="padding:2rem;color:var(--secondary);">
                Belum ada antrean hari ini
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { eKohortApi, kidsApi } from '../../api'
import { cacheKids, searchCachedKids } from '../../utils/kidsCache'
import Swal from 'sweetalert2'

const auth = useAuthStore()
const todayDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const queue = ref([])
const activeBatches = ref([])
const selectedBatch = ref(null)
const quickSearch = ref('')
const quickResults = ref([])
const filterQueueStatus = ref('')
const vaccinating = ref('')

const quickVaccines = [
  { code: 'HB0', short: 'HB0' },
  { code: 'BCG', short: 'BCG' },
  { code: 'POLIO1', short: 'P1' },
  { code: 'POLIO2', short: 'P2' },
  { code: 'POLIO3', short: 'P3' },
  { code: 'POLIO4', short: 'P4' },
  { code: 'DPT-HB-Hib1', short: 'DPT1' },
  { code: 'DPT-HB-Hib2', short: 'DPT2' },
  { code: 'DPT-HB-Hib3', short: 'DPT3' },
  { code: 'MR', short: 'MR' },
]

const filteredQueue = computed(() => {
  if (!filterQueueStatus.value) return queue.value
  return queue.value.filter(q => q.status === filterQueueStatus.value)
})

onMounted(async () => {
  await Promise.all([loadQueue(), loadBatches()])
  if (navigator.onLine) {
    try {
      const { data } = await kidsApi.list({ limit: 10000 })
      if (data) cacheKids(data)
    } catch {}
  }
})

async function loadQueue() {
  try {
    const { data } = await eKohortApi.queueToday()
    queue.value = data
  } catch {}
}

async function loadBatches() {
  try {
    const { data } = await eKohortApi.batchesActive()
    activeBatches.value = data
  } catch {}
}

async function searchQuick() {
  if (!quickSearch.value) return
  try {
    const { data } = await eKohortApi.kmsSearch(quickSearch.value)
    quickResults.value = data
    if (data) cacheKids(data)
  } catch {
    const cached = await searchCachedKids(quickSearch.value)
    quickResults.value = cached
  }
}

function confirmVaccinate(q, v) {
  const defaultBatch = selectedBatch?.batch_no || ''
  Swal.fire({
    title: 'Konfirmasi Vaksinasi',
    html: `
      <div style="text-align:left;">
        <div style="margin-bottom:8px;">Anak: <strong>${q.kid_name}</strong></div>
        <div style="margin-bottom:12px;">Vaksin: <strong>${v.short}</strong></div>
        <div>
          <label style="font-weight:500;font-size:0.85rem;">No. Batch Vaksin</label>
          <input id="swal-batch" class="swal2-input" value="${defaultBatch}" placeholder="Contoh: BATCH001" style="margin-top:4px;">
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0d6efd',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Suntik',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const batchInput = document.getElementById('swal-batch')
      return { batch_no: batchInput ? batchInput.value.trim() : defaultBatch }
    }
  }).then(result => {
    if (result.isConfirmed) {
      quickVaccinate(q, v.code, result.value?.batch_no || defaultBatch)
    }
  })
}

async function addToQueue(kid) {
  try {
    const res = await eKohortApi.queueAdd({ kid_id: kid.id })
    if (res.data?.offline) {
      queue.value.push({
        id: Date.now(),
        queue_number: queue.value.length + 1,
        kid_id: kid.id,
        kid_name: kid.name,
        nik: kid.nik,
        mother_name: kid.mother_name,
        village_name: kid.village_name,
        status: 'waiting',
        given_vaccines: [],
        officer: null
      })
    } else {
      await loadQueue()
    }
    quickResults.value = []
    quickSearch.value = ''
    Swal.fire({ icon: 'success', title: 'Ditambahkan!', text: `${kid.name} masuk antrean`, timer: 1500, showConfirmButton: false })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
  }
}

async function quickVaccinate(q, vaccineCode, batchOverride) {
  const key = q.id + '-' + vaccineCode
  vaccinating.value = key
  try {
    const res = await eKohortApi.quickVaccinate({
      kid_id: q.kid_id,
      vaccine_code: vaccineCode,
      batch_no: batchOverride || selectedBatch?.batch_no || null,
      officer: auth.userName
    })
    if (res.data?.offline) {
      const entry = queue.value.find(x => x.id === q.id || x.kid_id === q.kid_id)
      if (entry) {
        if (!entry.given_vaccines) entry.given_vaccines = []
        if (!entry.given_vaccines.includes(vaccineCode)) entry.given_vaccines.push(vaccineCode)
      }
    } else {
      await loadQueue()
    }
    Swal.fire({ icon: 'success', title: 'Berhasil!', text: `${q.kid_name} - ${vaccineCode} tercatat`, timer: 1200, showConfirmButton: false })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
  }
  finally { vaccinating.value = '' }
}

function confirmDone(q) {
  const given = (q.given_vaccines || []).length
  Swal.fire({
    title: 'Selesaikan Antrean?',
    html: `Anak: <strong>${q.kid_name}</strong><br>Vaksin diberikan: <strong>${given} jenis</strong>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Selesaikan',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) markDone(q)
  })
}

function confirmCancel(q) {
  Swal.fire({
    title: 'Batalkan Antrean?',
    html: `Anak: <strong>${q.kid_name}</strong><br>Aksi ini akan menghapus antrean`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Batalkan',
    cancelButtonText: 'Tidak'
  }).then(result => {
    if (result.isConfirmed) cancelQueue(q)
  })
}

async function cancelQueue(q) {
  try {
    const res = await eKohortApi.queueRemove(q.id)
    if (res.data?.offline) {
      queue.value = queue.value.filter(x => x.id !== q.id && x.kid_id !== q.kid_id)
    } else {
      await loadQueue()
    }
    Swal.fire({ icon: 'success', title: 'Dibatalkan', text: `Antrean ${q.kid_name} dihapus`, timer: 1200, showConfirmButton: false })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
  }
}

async function markDone(q) {
  try {
    const res = await eKohortApi.queueUpdate(q.id, { status: 'done', officer: auth.userName })
    if (res.data?.offline) {
      const entry = queue.value.find(x => x.id === q.id || x.kid_id === q.kid_id)
      if (entry) { entry.status = 'done'; entry.officer = auth.userName }
    } else {
      await loadQueue()
    }
    Swal.fire({ icon: 'success', title: 'Selesai', text: `Antrean ${q.kid_name} selesai`, timer: 1200, showConfirmButton: false })
  } catch (e) {
    Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.error || e.message })
  }
}

function isVaccineGiven(q, vaccineCode) {
  return (q.given_vaccines || []).includes(vaccineCode)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}
</script>

  <style scoped>
.btn-outline-danger { background: transparent; border: 1px solid #dc3545; color: #dc3545; }
.btn-outline-danger:hover { background: #dc3545; color: #fff; }
.pelayanan-info { display: flex; gap: 2rem; font-size: 0.85rem; color: var(--secondary); }
.add-queue-row { display: flex; gap: 0.5rem; }
.quick-results { margin-top: 0.5rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; max-height: 200px; overflow-y: auto; }
.quick-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid #f1f5f9;
}
.quick-item:hover { background: #f8fafc; }
.quick-item:last-child { border-bottom: none; }
.quick-item span:first-child { flex: 1; font-weight: 500; }
.batch-list { display: flex; flex-direction: column; gap: 0.35rem; }
.batch-item {
  padding: 0.5rem 0.65rem; border: 1px solid #e2e8f0; border-radius: 0.375rem;
  cursor: pointer; transition: all 0.15s;
}
.batch-item:hover { border-color: var(--primary); }
.batch-item.selected { border-color: var(--primary); background: #dbeafe; }
.batch-code { font-weight: 500; font-size: 0.85rem; }
.batch-meta { font-size: 0.7rem; color: var(--secondary); }
.empty-batch { text-align: center; padding: 1rem; color: var(--secondary); font-size: 0.85rem; }
.vaccine-actions { display: flex; flex-wrap: wrap; gap: 0.25rem; max-width: 300px; }
.vaccine-btn {
  font-size: 0.7rem !important; padding: 0.2rem 0.4rem !important;
  background: #eff6ff; color: var(--primary); border: 1px solid #bfdbfe;
}
.vaccine-btn:hover:not(:disabled) { background: var(--primary); color: #fff; }
.vaccine-btn:disabled { opacity: 0.5; }
.vaccine-done {
  background: #d1fae5 !important;
  border-color: #6ee7b7 !important;
  color: #065f46 !important;
  cursor: default !important;
}
</style>
