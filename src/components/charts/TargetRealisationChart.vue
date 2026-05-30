<template>
  <div>
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="loading text-center">Tidak ada data</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  labels: { type: Array, default: () => [] },
  targetData: { type: Array, default: () => [] },
  realizationData: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})

const chartData = computed(() => {
  if (!props.labels.length) return null
  return {
    labels: props.labels,
    datasets: [
      {
        label: 'Target (%)',
        backgroundColor: '#0d6efd',
        data: props.targetData
      },
      {
        label: 'Realisasi (%)',
        backgroundColor: '#198754',
        data: props.realizationData
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: !!props.title, text: props.title }
  },
  scales: {
    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Persentase (%)' } }
  }
}
</script>
