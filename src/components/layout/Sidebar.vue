<template>
  <aside class="sidebar" :class="{ open: sidebarOpen }">
    <div class="sidebar-brand">
      <span class="brand-icon">💉</span>
      <div class="brand-info">
        <div class="brand-title" style="font-size:35px">SIMPATIK</div>
        <div class="brand-sub">Sistem Informasi Mikroplanning<br>dan Tracking Imunisasi Kejar</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <!-- <div class="nav-section">Menu Utama</div>
      <router-link to="/" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📊</span>
        <span class="nav-text">Dashboard</span>
      </router-link> -->

      <div class="nav-section">Menu Utama</div>
      <router-link to="/ekohort" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">Dashboard</span>
      </router-link>
      <router-link to="/ekohort/kms" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📋</span>
        <span class="nav-text">KMS Digital</span>
      </router-link>
      <router-link to="/ekohort/pelayanan" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">💉</span>
        <span class="nav-text">Pelayanan Hari Ini</span>
      </router-link>
      <router-link to="/ekohort/imunisasi-kejar" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">🔴</span>
        <span class="nav-text">Imunisasi Kejar</span>
      </router-link>
      <router-link to="/ekohort/mikroplanning" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📦</span>
        <span class="nav-text">Mikroplanning</span>
      </router-link>

      <div class="nav-section">Registrasi</div>
      <router-link to="/kids" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">👶</span>
        <span class="nav-text">Data Balita</span>
      </router-link>

      <div class="nav-section">Imunisasi</div>
      <router-link to="/kebutuhan-vaksin" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📋</span>
        <span class="nav-text">Kebutuhan Vaksin</span>
      </router-link>
      <router-link to="/vaccines" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">💊</span>
        <span class="nav-text">Jenis Vaksin</span>
      </router-link>
      <!-- <router-link to="/targets" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">🎯</span>
        <span class="nav-text">Target Per Desa</span>
      </router-link> -->
      <router-link to="/targets/tahunan" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📈</span>
        <span class="nav-text">Target Tahunan</span>
      </router-link>

      <div class="nav-section">Demografi</div>
      <router-link to="/demographics" class="nav-item" @click="closeSidebar">
        <span class="nav-icon">📊</span>
        <span class="nav-text">Data Demografi</span>
      </router-link>

      <div class="nav-section nav-toggle" :class="{ active: laporanOpen }" @click="laporanOpen = !laporanOpen">
        <span class="nav-icon">📄</span>
        <span class="nav-text">LAPORAN</span>
        <span class="toggle-chevron" :class="{ open: laporanOpen }">▶</span>
      </div>
      <div class="nav-submenu" :class="{ open: laporanOpen }">
        <router-link to="/laporan/bulanan-bayi" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">1.</span>
          <span class="nav-text">Lap. Bulanan Hasil Imunisasi Rutin Bayi</span>
        </router-link>
        <router-link to="/laporan/luar-wilayah-bayi" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">2.</span>
          <span class="nav-text">Lap. Hasil Imunisasi Rutin Bayi Luar Wilayah</span>
        </router-link>
        <router-link to="/laporan/analisa-pws" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">3.</span>
          <span class="nav-text">Tabel Analisa Bulanan PWS</span>
        </router-link>
        <router-link to="/laporan/kumulatif-bayi" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">4.</span>
          <span class="nav-text">Lap. Hasil Imunisasi Rutin Bayi (Kumulatif)</span>
        </router-link>
        <router-link to="/laporan/rencana-tindak-lanjut" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">5.</span>
          <span class="nav-text">Lap. Rencana Tindak Lanjut PWS</span>
        </router-link>
        <router-link to="/laporan/pemantauan-uci" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">6.</span>
          <span class="nav-text">Lap. Tabel Pemantauan Desa Menuju UCI</span>
        </router-link>
        <router-link to="/laporan/monitoring-uci" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">7.</span>
          <span class="nav-text">Monitoring Desa Menuju UCI Per Puskesmas</span>
        </router-link>
        <router-link to="/laporan/rekapitulasi-ibu-hamil" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">8.</span>
          <span class="nav-text">Rekapitulasi Imunisasi T Ibu Hamil dan WUS</span>
        </router-link>
        <router-link to="/laporan/bulanan-ibu-hamil" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">9.</span>
          <span class="nav-text">Lap. Bulanan Hasil Imunisasi T Ibu Hamil dan WUS</span>
        </router-link>
        <router-link to="/laporan/kumulatif-ibu-hamil" class="nav-item nav-sub" @click="closeSidebar">
          <span class="nav-icon">10.</span>
          <span class="nav-text">Lap. Kumulatif Hasil Imunisasi T Ibu Hamil dan WUS</span>
        </router-link>
      </div>

      <template v-if="auth.can('all')">
        <div class="nav-section">Master Data</div>
        <router-link to="/villages" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">🏘️</span>
          <span class="nav-text">Desa / Kelurahan</span>
        </router-link>
        <router-link to="/puskesmas" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">🏥</span>
          <span class="nav-text">Puskesmas</span>
        </router-link>
        <router-link to="/polindes" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">🏪</span>
          <span class="nav-text">Polindes</span>
        </router-link>
        <router-link to="/users" class="nav-item" @click="closeSidebar">
          <span class="nav-icon">👥</span>
          <span class="nav-text">Pengguna</span>
        </router-link>
      </template>
    </nav>
  </aside>
  <div v-if="sidebarOpen" class="modal-overlay" @click="closeSidebar" style="z-index: 99;"></div>
</template>

<script setup>
import { inject, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const sidebarOpen = inject('sidebarOpen')
const closeSidebar = inject('closeSidebar')

const laporanOpen = ref(false)
</script>
