<template>
  <div class="village-map">
    <div class="map-grid">
      <div
        v-for="v in villages"
        :key="v.id"
        class="village-block"
        :class="'status-' + (v.status_color || 'hijau')"
        :title="`${v.village_name}: ${v.completed || 0}/${v.total_kids || 0} lengkap`"
      >
        <div class="village-name">{{ v.village_name }}</div>
        <div class="village-status">
          <span class="status-dot" :class="'dot-' + (v.status_color || 'hijau')"></span>
          {{ v.completed || 0 }}/{{ v.total_kids || 0 }}
        </div>
        <div v-if="v.pending > 0" class="village-alert">{{ v.pending }} Drop-out</div>
      </div>
      <div v-if="!villages.length" class="empty-map">Belum ada data desa</div>
    </div>
    <div class="map-legend">
      <span><span class="legend-dot dot-hijau"></span> Aman (&ge;80%)</span>
      <span><span class="legend-dot dot-kuning"></span> Waspada (&lt;80%)</span>
      <span><span class="legend-dot dot-merah"></span> Kritis (&ge;20% Drop-out)</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  villages: { type: Array, default: () => [] }
})
</script>

<style scoped>
.village-map { font-size: 0.85rem; }
.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}
.village-block {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.65rem;
  text-align: center;
  transition: transform 0.15s;
  cursor: default;
}
.village-block:hover { transform: translateY(-2px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.village-block.status-hijau { border-color: var(--success); background: #f0fdf4; }
.village-block.status-kuning { border-color: var(--warning); background: #fffbeb; }
.village-block.status-merah { border-color: var(--danger); background: #fef2f2; }
.village-name { font-weight: 600; font-size: 0.8rem; margin-bottom: 0.25rem; word-break: break-word; }
.village-status { font-size: 0.75rem; color: var(--secondary); display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-hijau { background: var(--success); }
.dot-kuning { background: var(--warning); }
.dot-merah { background: var(--danger); }
.village-alert { margin-top: 0.3rem; font-size: 0.7rem; color: var(--danger); font-weight: 600; }
.empty-map { grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--secondary); }
.map-legend {
  display: flex; gap: 1rem; justify-content: center; margin-top: 0.75rem;
  font-size: 0.75rem; color: var(--secondary);
}
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; vertical-align: middle; margin-right: 0.25rem; }
</style>
