<script setup>
defineProps({
  title: { type: String, default: '暂无留言' },
  description: { type: String, default: '来发布第一条留言，开启一场有价值的讨论吧。' },
})
</script>

<template>
  <div class="panel px-6 py-14 text-center">
    <div class="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
      <svg aria-hidden="true" viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M8 10h8m-8 4h5M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <h3 class="mt-4 font-extrabold text-slate-900">{{ title }}</h3>
    <p class="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{{ description }}</p>
  </div>
</template>
