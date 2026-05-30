<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="btn-page" :disabled="currentPage <= 1" @click="$emit('go', currentPage - 1)">‹</button>
    <template v-for="p in pageRange" :key="p">
      <span v-if="p === '...'" class="page-dots">…</span>
      <button v-else class="btn-page" :class="{ active: p === currentPage }" @click="$emit('go', p)">{{ p }}</button>
    </template>
    <button class="btn-page" :disabled="currentPage >= totalPages" @click="$emit('go', currentPage + 1)">›</button>
    <span class="page-info">{{ from }}-{{ to }} dari {{ total }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: Number,
  totalPages: Number,
  total: Number,
  perPage: Number,
  pageRange: Array
})

defineEmits(['go'])

const from = computed(() => (props.currentPage - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.currentPage * props.perPage, props.total))
</script>
