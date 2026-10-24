import { readonly, ref } from 'vue'

const toast = ref(null)
let timeoutId

export function useToast() {
  function showToast(message, type = 'success', duration = 3500) {
    window.clearTimeout(timeoutId)
    toast.value = { message, type }
    timeoutId = window.setTimeout(() => {
      toast.value = null
    }, duration)
  }

  function dismissToast() {
    window.clearTimeout(timeoutId)
    toast.value = null
  }

  return { toast: readonly(toast), showToast, dismissToast }
}
