<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="page-shell grid min-h-[calc(100vh-8rem)] place-items-center py-16 text-center">
    <div>
      <p class="text-sm font-extrabold uppercase tracking-[0.18em] text-brand-600">404</p>
      <h1 class="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">页面不存在</h1>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">页面可能已被移动，或地址输入有误。你可以返回留言板继续浏览。</p>
      <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <RouterLink to="/board" class="btn-primary px-5 py-2.5 text-sm">前往留言板</RouterLink>
        <RouterLink to="/" class="btn-secondary px-5 py-2.5 text-sm">返回首页</RouterLink>
      </div>
    </div>
  </section>
</template>
