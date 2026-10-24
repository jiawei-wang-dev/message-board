<script setup>
defineProps({ count: { type: Number, default: 3 } })
</script>

<template>
  <div class="space-y-4" role="status" aria-label="正在加载讨论">
    <div v-for="item in count" :key="item" class="panel animate-pulse p-5 sm:p-6">
      <div class="flex gap-4">
        <div class="size-10 shrink-0 rounded-full bg-slate-200" />
        <div class="flex-1 space-y-3">
          <div class="h-3 w-32 rounded bg-slate-200" />
          <div class="space-y-2">
            <div class="h-3 w-full rounded bg-slate-100" />
            <div class="h-3 w-4/5 rounded bg-slate-100" />
          </div>
          <div class="h-3 w-20 rounded bg-slate-100" />
        </div>
      </div>
    </div>
    <span class="sr-only">正在加载讨论…</span>
  </div>
</template>
