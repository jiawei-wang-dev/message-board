<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps({
  compact: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  replyTo: { type: String, default: '' },
})

const emit = defineEmits(['submit', 'cancel'])
const content = ref('')
const textarea = ref(null)
const fieldId = `comment-${Math.random().toString(36).slice(2)}`
const characterCount = computed(() => content.value.length)
const canSubmit = computed(() => content.value.trim().length > 0 && !props.loading)

function submit() {
  if (!canSubmit.value) return
  emit('submit', content.value.trim())
}

function clear() {
  content.value = ''
}

defineExpose({ clear })

onMounted(async () => {
  if (!props.compact) return
  await nextTick()
  textarea.value?.focus()
})
</script>

<template>
  <form :class="compact ? 'rounded-xl border border-slate-200 bg-white p-3' : 'panel p-4 sm:p-5'" @submit.prevent="submit">
    <div v-if="!compact" class="mb-3 flex items-center gap-3">
      <span class="grid size-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-hidden="true">我</span>
      <div>
        <label :for="fieldId" class="block text-sm font-bold text-slate-800">发起新话题</label>
        <p class="text-xs text-slate-500">分享你的想法、问题或近况。</p>
      </div>
    </div>
    <label v-else :for="fieldId" class="sr-only">回复 {{ replyTo }}</label>
    <textarea
      ref="textarea"
      :id="fieldId"
      v-model="content"
      class="field min-h-24 resize-y text-sm leading-6"
      :class="compact ? 'min-h-20' : ''"
      :placeholder="compact ? `回复 ${replyTo}…` : '你想和大家聊些什么？'"
      maxlength="2000"
      :aria-describedby="`${fieldId}-help`"
    />
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p :id="`${fieldId}-help`" class="text-xs text-slate-400">{{ characterCount.toLocaleString() }} / 2,000</p>
      <div class="flex items-center gap-2">
        <button v-if="compact" type="button" class="btn-quiet px-3 py-2 text-xs" :disabled="loading" @click="$emit('cancel')">取消</button>
        <button type="submit" class="btn-primary px-4 py-2 text-sm" :disabled="!canSubmit" :aria-busy="loading">
          <svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
            <path class="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
          </svg>
          {{ loading ? '发布中…' : compact ? '发布回复' : '发布留言' }}
        </button>
      </div>
    </div>
  </form>
</template>
