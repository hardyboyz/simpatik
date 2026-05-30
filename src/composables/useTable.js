import { ref, computed } from 'vue'

export function useTable(data, options = {}) {
  const perPage = options.perPage || 10
  const currentPage = ref(1)
  const sortKey = ref('')
  const sortOrder = ref('asc')

  const sortedData = computed(() => {
    const arr = [...data.value]
    if (!sortKey.value) return arr
    return arr.sort((a, b) => {
      let va = a[sortKey.value], vb = b[sortKey.value]
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortOrder.value === 'asc' ? va - vb : vb - va
      }
      va = String(va).toLowerCase()
      vb = String(vb).toLowerCase()
      return sortOrder.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(sortedData.value.length / perPage)))

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * perPage
    return sortedData.value.slice(start, start + perPage)
  })

  function setSort(key) {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortOrder.value = 'asc'
    }
    currentPage.value = 1
  }

  const pageRange = computed(() => {
    const total = totalPages.value
    const cur = currentPage.value
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages = []
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
      pages.push(i)
    }
    if (cur < total - 2) pages.push('...')
    pages.push(total)
    return pages
  })

  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function resetPage() {
    currentPage.value = 1
  }

  function sortIndicator(key) {
    if (sortKey.value !== key) return ''
    return sortOrder.value === 'asc' ? ' ▲' : ' ▼'
  }

  return {
    currentPage,
    perPage,
    sortKey,
    sortOrder,
    sortedData,
    paginatedData,
    totalPages,
    setSort,
    goToPage,
    resetPage,
    pageRange,
    sortIndicator
  }
}
