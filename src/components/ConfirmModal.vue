<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '确认删除这条留言？' },
  description: { type: String, default: '留言内容将显示为“[已删除]”，已有回复仍会保留。' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
const dialog = ref(null)
const cancelButton = ref(null)
let previouslyFocused = null

function focusableElements() {
  if (!dialog.value) return []
  return [...dialog.value.querySelectorAll(
    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )]
}

function onKeydown(event) {
  if (!props.open) return

  if (event.key === 'Escape' && !props.loading) {
    event.preventDefault()
    emit('cancel')
    return
  }

  if (event.key !== 'Tab') return
  const elements = focusableElements()
  if (!elements.length) {
    event.preventDefault()
    dialog.value?.focus()
    return
  }

  const first = elements[0]
  const last = elements.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      previouslyFocused = document.activeElement
      await nextTick()
      cancelButton.value?.focus()
    } else if (previouslyFocused instanceof HTMLElement) {
      await nextTick()
      previouslyFocused.focus()
      previouslyFocused = null
    }
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 grid place-items-center p-4" role="presentation" @mousedown.self="!loading && $emit('cancel')">
      <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" aria-hidden="true" />
      <section
        ref="dialog"
        tabindex="-1"
        class="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div class="grid size-11 place-items-center rounded-xl bg-red-50 text-red-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v5m0 3h.01M10.3 4.4 2.8 17.5A1.7 1.7 0 0 0 4.3 20h15.4a1.7 1.7 0 0 0 1.5-2.5L13.7 4.4a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h2 id="confirm-title" class="mt-4 text-lg font-extrabold tracking-tight text-slate-900">{{ title }}</h2>
        <p id="confirm-description" class="mt-2 text-sm leading-6 text-slate-600">{{ description }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button ref="cancelButton" type="button" class="btn-secondary px-4 py-2 text-sm" :disabled="loading" @click="$emit('cancel')">取消</button>
          <button type="button" class="inline-flex items-center rounded-[0.7rem] bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60" :disabled="loading" @click="$emit('confirm')">
            {{ loading ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
