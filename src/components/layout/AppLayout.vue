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
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const sidebarOpen = ref(false)
const collapsed = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

provide('sidebarOpen', sidebarOpen)
provide('sidebarCollapsed', collapsed)
provide('toggleSidebar', toggleSidebar)
provide('closeSidebar', closeSidebar)
provide('toggleCollapse', toggleCollapse)
</script>
