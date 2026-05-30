<template>
  <button
    class="btn-wa"
    :class="{ 'btn-wa-small': small }"
    :disabled="sending"
    @click="sendReminder"
    :title="phone ? `Kirim WA ke ${phone}` : 'Nomor WA tidak tersedia'"
  >
    <span v-if="sending" class="wa-spinner"></span>
    <span v-else class="wa-icon">💬</span>
    <span class="wa-text">{{ sending ? 'Mengirim...' : (label || 'WA') }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { eKohortApi } from '../../api'

const props = defineProps({
  phone: { type: String, default: '' },
  kidName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  missingVaccines: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  small: { type: Boolean, default: false }
})

const emit = defineEmits(['sent', 'error'])
const sending = ref(false)

function formatPhone(num) {
  if (!num) return ''
  let cleaned = num.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)
  if (!cleaned.startsWith('62')) cleaned = '62' + cleaned
  return cleaned
}

async function sendReminder() {
  if (sending.value) return
  sending.value = true
  try {
    const missingStr = props.missingVaccines.length
      ? props.missingVaccines.join(', ')
      : 'beberapa jenis imunisasi'

    if (props.phone) {
      try {
        await eKohortApi.whatsappSend({
          phone: props.phone,
          kid_name: props.kidName,
          mother_name: props.motherName,
          missing_vaccines: props.missingVaccines
        })
        emit('sent', { phone: props.phone, kidName: props.kidName, method: 'fonnte' })
        return
      } catch (apiErr) {
        const msg = apiErr.response?.data?.error || ''
        if (!msg.includes('Fonnte token belum dikonfigurasi') && !msg.includes('token')) {
          emit('error', { phone: props.phone, error: msg || 'Gagal kirim via Fonnte' })
          sending.value = false
          return
        }
      }
    }

    const phoneClean = formatPhone(props.phone || '')
    const message = encodeURIComponent(
      `Yth. Ibu ${props.motherName || 'Orang Tua'} ${props.kidName ? `dari ${props.kidName}` : ''},\n\n`
      + `Kami dari Puskesmas mengingatkan bahwa putra/putri Ibu membutuhkan imunisasi kejar untuk: ${missingStr}.\n\n`
      + `Silakan datang ke Posyandu/Puskesmas terdekat pada hari dan jam kerja.\n\n`
      + `Terima kasih.\n\n`
      + `- Sistem e-Kohort Digital`
    )

    window.open(`https://wa.me/${phoneClean}?text=${message}`, '_blank')
    emit('sent', { phone: props.phone || 'manual', kidName: props.kidName, method: 'wa.me' })
  } catch (e) {
    emit('error', { phone: props.phone, error: e.message })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.btn-wa {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  background: #25D366;
  color: #fff;
  transition: all 0.2s;
}
.btn-wa:hover:not(:disabled) { background: #1da851; transform: translateY(-1px); }
.btn-wa:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-wa-small { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
.wa-icon { font-size: 1rem; }
.wa-spinner {
  width: 1rem; height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: waSpin 0.6s linear infinite;
}
@keyframes waSpin { to { transform: rotate(360deg); } }
</style>
