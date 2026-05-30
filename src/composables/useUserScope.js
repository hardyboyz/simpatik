import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function useUserScope() {
  const auth = useAuthStore()

  const isAdmin = computed(() => auth.userRole === 'admin')
  const districtId = computed(() => auth.userDistrictId)
  const villageId = computed(() => auth.userVillageId)
  const puskesmas = computed(() => auth.userPuskesmas)

  function filterByScope(items, options = {}) {
    if (isAdmin.value) return items
    let result = [...items]
    if (villageId.value) {
      if (options.villageField) {
        result = result.filter(item => Number(item[options.villageField]) === Number(villageId.value))
      }
    }
    if (districtId.value) {
      if (options.districtField) {
        result = result.filter(item => Number(item[options.districtField]) === Number(districtId.value))
      }
    }
    if (puskesmas.value) {
      if (options.puskesmasField) {
        result = result.filter(item => item[options.puskesmasField] === puskesmas.value)
      }
    }
    return result
  }

  function scopeDistrictIds() {
    if (isAdmin.value) return null
    return districtId.value ? [Number(districtId.value)] : null
  }

  function scopeVillageIds() {
    if (isAdmin.value) return null
    return villageId.value ? [Number(villageId.value)] : null
  }

  return { isAdmin, districtId, villageId, puskesmas, filterByScope, scopeDistrictIds, scopeVillageIds }
}
