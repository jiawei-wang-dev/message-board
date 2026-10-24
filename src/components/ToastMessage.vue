<script setup>
defineProps({
  message: { type: String, required: true },
  type: { type: String, default: 'success' },
})

defineEmits(['dismiss'])
</script>

<template>
  <div
    class="fixed bottom-4 left-4 right-4 z-[60] flex justify-center sm:left-auto sm:right-5"
    :role="type === 'error' ? 'alert' : 'status'"
    :aria-live="type === 'error' ? 'assertive' : 'polite'"
  >
    <div class="flex w-full max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
      <span class="grid size-6 shrink-0 place-items-center rounded-full" :class="type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'">
        <svg v-if="type === 'error'" aria-hidden="true" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m8 8 8 8m0-8-8 8" stroke-linecap="round" />
        </svg>
        <svg v-else aria-hidden="true" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m6 12 4 4 8-8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <p class="flex-1 leading-5">{{ message }}</p>
      <button type="button" class="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="关闭通知" @click="$emit('dismiss')">
        <svg aria-hidden="true" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
