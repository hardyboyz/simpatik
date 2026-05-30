<template>
  <div ref="mapContainer" class="leaflet-map"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  villages: { type: Array, default: () => [] }
})

const mapContainer = ref(null)
let map = null
let markers = []

// Belitung Timur: center ~-2.95, 108.15
const BELITUNG_CENTER = [-2.95, 108.15]
const BELITUNG_BOUNDS = [[-3.15, 107.6], [-2.7, 108.6]]

const villageCoords = [
  [ -2.750, 108.200 ], [ -2.780, 108.350 ], [ -2.820, 108.480 ],
  [ -2.850, 108.100 ], [ -2.880, 108.250 ], [ -2.910, 108.400 ],
  [ -2.940, 108.050 ], [ -2.970, 108.200 ], [ -3.000, 108.350 ],
  [ -3.030, 108.100 ], [ -2.760, 108.280 ], [ -2.790, 108.420 ],
  [ -2.830, 108.050 ], [ -2.860, 108.180 ], [ -2.890, 108.320 ],
  [ -2.920, 108.460 ], [ -2.950, 108.080 ], [ -2.980, 108.220 ],
  [ -3.010, 108.380 ], [ -2.740, 108.320 ], [ -2.770, 108.450 ],
  [ -2.810, 108.080 ], [ -2.840, 108.210 ], [ -2.870, 108.350 ],
  [ -2.900, 108.480 ], [ -2.930, 108.120 ], [ -2.960, 108.260 ],
  [ -2.990, 108.400 ], [ -3.020, 108.200 ], [ -3.050, 108.350 ],
]

function getColor(status) {
  if (status === 'merah') return '#dc3545'
  if (status === 'kuning') return '#ffc107'
  return '#198754'
}

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value, {
    center: BELITUNG_CENTER,
    zoom: 11,
    zoomControl: true,
    maxBounds: L.latLngBounds(BELITUNG_BOUNDS),
    maxBoundsViscosity: 1
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map)
  updateMarkers()
}

function updateMarkers() {
  if (!map) return
  markers.forEach(m => map.removeLayer(m))
  markers = []

  props.villages.forEach((v, i) => {
    const coord = villageCoords[i % villageCoords.length]
    const jitterLat = (Math.random() - 0.5) * 0.008
    const jitterLng = (Math.random() - 0.5) * 0.008
    const lat = coord[0] + jitterLat
    const lng = coord[1] + jitterLng

    const color = getColor(v.status_color || 'hijau')
    const radius = Math.max(10, Math.min(22, (v.total_kids || 5) * 1.8))

    const circle = L.circleMarker([lat, lng], {
      radius,
      color: '#fff',
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2.5,
      opacity: 1
    }).addTo(map)

    const labelText = `${v.village_name}\nLengkap: ${v.completed || 0}/${v.total_kids || 0}`
    const icon = L.divIcon({
      className: 'village-label',
      html: `<div style="
        font-size:9px;font-weight:600;text-align:center;line-height:1.1;
        text-shadow:0 1px 2px #fff,0 -1px 2px #fff,1px 0 2px #fff,-1px 0 2px #fff;
        white-space:nowrap;transform:translate(-50%,-50%);margin-top:-${radius+10}px;
      ">${v.village_name}</div>`,
      iconSize: [0, 0]
    })
    L.marker([lat, lng], { icon, interactive: false }).addTo(map)

    circle.bindTooltip(`<strong>${v.village_name}</strong><br>${v.completed || 0}/${v.total_kids || 0} lengkap`, {
      direction: 'top', offset: L.point(0, -radius - 2)
    })
    circle.bindPopup(`
      <div style="min-width:160px;">
        <h4 style="margin:0 0 6px;">${v.village_name}</h4>
        <div>Total: <strong>${v.total_kids || 0}</strong> anak</div>
        <div>Lengkap: <strong>${v.completed || 0}</strong></div>
        <div>Drop-out: <strong style="color:${v.pending > 0 ? '#dc3545' : '#198754'}">${v.pending || 0}</strong></div>
        <div style="margin-top:4px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>
          ${v.status_color === 'merah' ? 'Kritis' : v.status_color === 'kuning' ? 'Waspada' : 'Aman'}
        </div>
      </div>
    `)

    markers.push(circle)
  })
}

onMounted(async () => {
  await nextTick()
  initMap()
})

watch(() => props.villages, () => {
  if (!map) { nextTick(() => initMap()); return }
  updateMarkers()
}, { deep: true })
</script>

<style>
.village-label { background: none !important; border: none !important; }
</style>
