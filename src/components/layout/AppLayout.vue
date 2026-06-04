<template>
  <div class="app-layout" :class="{ collapsed }">
    <Sidebar />
    <div class="main-content">
      <Navbar />
      <div class="page-content">
        <router-view />
      </div>
    </div>
    <button class="sidebar-toggle-float" @click="toggleCollapse" :title="collapsed ? 'Buka navigasi' : 'Tutup navigasi'">
      {{ collapsed ? '☰' : '✕' }}
    </button>
    <div class="offline-badge" :class="{ online }" :title="online ? 'Terhubung' : 'Offline'">
      <span class="dot"></span>
      <span>{{ online ? 'Online' : 'Offline' }}</span>
    </div>
    <div v-if="!online" class="offline-banner">
      <span>&#9888; Offline — data akan dikirim saat koneksi tersedia ({{ pendingSync }} antrean)</span>
    </div>
    <div v-else-if="pendingSync > 0" class="offline-banner syncing">
      <span>&#8635; Menyinkronkan {{ pendingSync }} data ...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import { getQueueSize, trySyncQueue } from '../../api'

const sidebarOpen = ref(false)
const collapsed = ref(false)
const online = ref(navigator.onLine)
const pendingSync = ref(0)

let syncTimer = null

async function updatePending() {
  pendingSync.value = await getQueueSize()
}

async function handleOnline() {
  online.value = true
  const queueBefore = pendingSync.value
  const result = await trySyncQueue()
  if (result.processed > 0 || result.failed > 0) {
    await updatePending()
  }
  if (pendingSync.value === 0 && queueBefore > 0) {
    window.dispatchEvent(new CustomEvent('sync-complete'))
  }
}

function handleOffline() {
  online.value = false
  updatePending()
}

function handleSyncChange() {
  updatePending()
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('sync-queue-changed', handleSyncChange)
  updatePending()
  syncTimer = setInterval(() => {
    if (navigator.onLine && pendingSync.value > 0) {
      handleOnline()
    }
  }, 15000)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('sync-queue-changed', handleSyncChange)
  if (syncTimer) clearInterval(syncTimer)
})

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar() { sidebarOpen.value = false }
function toggleCollapse() { collapsed.value = !collapsed.value }

provide('sidebarOpen', sidebarOpen)
provide('sidebarCollapsed', collapsed)
provide('toggleSidebar', toggleSidebar)
provide('closeSidebar', closeSidebar)
provide('toggleCollapse', toggleCollapse)
</script>

<style scoped>
.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #dc3545;
  color: #fff;
  text-align: center;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.offline-banner.syncing {
  background: #ffc107;
  color: #1e293b;
}
.offline-badge {
  position: fixed;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  background: #dc3545;
  color: #fff;
  z-index: 9998;
  opacity: 0.85;
}
.offline-badge.online {
  background: #198754;
}
.offline-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}
</style>
