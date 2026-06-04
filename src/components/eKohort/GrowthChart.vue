<template>
  <div class="growth-chart-container">
    <div v-if="hasData" style="height: 300px;">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="empty-chart">Belum ada data pertumbuhan</div>
    <div class="chart-info">
      <span class="info-bb">Weight (kg)</span>
      <span class="info-legend">
        <span class="legend-item"><span class="dot" style="background:#0d6efd"></span> Child</span>
        <span class="legend-item"><span class="dot" style="background:#22c55e"></span> Normal (-2SD to +1SD)</span>
        <span class="legend-item"><span class="dot" style="background:#eab308"></span> Warning</span>
        <span class="legend-item"><span class="dot" style="background:#ef4444"></span> Danger</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { getWHOZScore } from '../../data/whoGrowthStandards'

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  records: { type: Array, default: () => [] },
  birthDate: { type: String, default: null },
  gender: { type: String, default: 'L' }
})

const zScores = [-3, -2, -1, 0, 1, 2, 3]
const monthLabels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24, 30, 36, 48, 60]

const hasData = computed(() => props.records.length > 0)

function calcAgeMonths(dateMeasured) {
  if (!props.birthDate || !dateMeasured) return null
  const birth = new Date(props.birthDate)
  const measured = new Date(dateMeasured)
  const diffMs = measured - birth
  return diffMs / (30.4375 * 24 * 60 * 60 * 1000)
}

const childData = computed(() => {
  return props.records
    .filter(r => r.weight != null)
    .map(r => ({
      x: calcAgeMonths(r.date_measured),
      y: parseFloat(r.weight)
    }))
    .filter(p => p.x !== null && p.x >= 0 && p.x <= 60)
})

const chartData = computed(() => {
  const xMonths = Array.from({ length: 61 }, (_, i) => i)

  const curves = zScores.map(z => ({
    z,
    label: z === 0 ? 'Median (0)' : (z > 0 ? `+${z}SD` : `${z}SD`),
    data: xMonths.map(m => ({ x: m, y: getWHOZScore(props.gender, m, z) }))
  }))

  const zoneColors = [
    null,
    { bg: 'rgba(239,68,68,0.12)', border: '#ef4444' },
    { bg: 'rgba(234,179,8,0.15)', border: '#eab308' },
    { bg: 'rgba(34,197,94,0.08)', border: '#22c55e' },
    { bg: 'rgba(34,197,94,0.08)', border: '#16a34a' },
    { bg: 'rgba(234,179,8,0.15)', border: '#eab308' },
    { bg: 'rgba(239,68,68,0.12)', border: '#ef4444' }
  ]

  const datasets = curves.map((c, i) => {
    const colors = zoneColors[i]
    return {
      label: c.label,
      data: c.data,
      borderColor: colors ? colors.border : '#ef4444',
      backgroundColor: colors ? colors.bg : 'transparent',
      borderWidth: i === 0 || i === 6 ? 0.5 : (i === 3 ? 1.5 : 1),
      borderDash: i === 3 ? [] : [4, 3],
      pointRadius: 0,
      pointHitRadius: 0,
      fill: i === 0 ? false : '-1',
      tension: 0.3,
      order: i === 0 ? 2 : 2
    }
  })

  if (childData.value.length > 0) {
    datasets.push({
      label: 'Child',
      data: childData.value,
      borderColor: '#0d6efd',
      backgroundColor: '#0d6efd',
      borderWidth: 2.5,
      pointRadius: 5,
      pointBackgroundColor: '#0d6efd',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.3,
      fill: false,
      order: 1
    })
  }

  return { datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'nearest' },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: items => `Age: ${items[0].parsed.x.toFixed(1)} months`,
        label: ctx => {
          if (ctx.dataset.label === 'Child') return `Weight: ${ctx.parsed.y.toFixed(2)} kg`
          return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} kg`
        }
      }
    }
  },
  scales: {
    x: {
      type: 'linear',
      min: 0,
      max: 60,
      title: { display: true, text: 'Age (months)' },
      ticks: {
        stepSize: 3,
        callback: v => {
          const majors = [0, 1, 3, 6, 9, 12, 15, 18, 24, 36, 48, 60]
          return majors.includes(v) ? v : ''
        }
      },
      grid: { color: 'rgba(0,0,0,0.05)' }
    },
    y: {
      min: 0,
      max: 22,
      title: { display: true, text: 'Weight (kg)' },
      ticks: { stepSize: 2 },
      grid: { color: 'rgba(0,0,0,0.05)' }
    }
  }
}
</script>

<style scoped>
.growth-chart-container { position: relative; }
.empty-chart { text-align: center; padding: 2rem; color: var(--secondary); font-size: 0.85rem; }
.chart-info { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem; font-size: 0.7rem; }
.info-bb { font-weight: 600; color: #0d6efd; font-size: 0.75rem; }
.info-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.legend-item { display: inline-flex; align-items: center; gap: 0.3rem; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
</style>
