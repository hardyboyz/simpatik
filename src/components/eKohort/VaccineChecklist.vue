<template>
  <div class="vaccine-checklist">
    <div
      v-for="(v, i) in schedule"
      :key="v.code"
      class="vaccine-item"
      :class="{ completed: v.completed, missing: !v.completed }"
    >
      <div class="vaccine-check">
        <span v-if="v.completed" class="check-icon">✓</span>
        <span v-else class="uncheck-icon blinking" :class="{ 'blink-yellow': true }">○</span>
      </div>
      <div class="vaccine-info">
        <div class="vaccine-name">{{ v.name }}</div>
        <div class="vaccine-detail">
          <template v-if="v.completed && v.date_administered">
            {{ formatDate(v.date_administered) }}
          </template>
          <template v-else-if="v.age_months">
            Usia {{ v.age_months }} bulan
          </template>
        </div>
      </div>
      <div v-if="!v.completed" class="vaccine-action"></div>
    </div>
    <div v-if="!schedule.length" class="empty-list">Tidak ada jadwal vaksin</div>
  </div>
</template>

<script setup>
defineProps({
  schedule: { type: Array, default: () => [] }
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID')
}
</script>

<style scoped>
.vaccine-checklist { display: flex; flex-direction: column; gap: 0.35rem; }
.vaccine-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  transition: background 0.2s;
}
.vaccine-item.completed { background: #f0fdf4; border-color: #bbf7d0; }
.vaccine-item.missing { background: #fffbeb; border-color: #fde68a; }
.vaccine-check { flex-shrink: 0; width: 1.5rem; text-align: center; font-size: 1.1rem; }
.check-icon { color: var(--success); font-weight: 700; }
.uncheck-icon { color: var(--warning); }
.blink-yellow {
  animation: blinkYellow 1.2s ease-in-out infinite;
}
@keyframes blinkYellow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.vaccine-info { flex: 1; min-width: 0; }
.vaccine-name { font-weight: 500; font-size: 0.85rem; }
.vaccine-detail { font-size: 0.7rem; color: var(--secondary); }
.vaccine-action { flex-shrink: 0; }
.empty-list { text-align: center; padding: 1rem; color: var(--secondary); font-size: 0.85rem; }
</style>
