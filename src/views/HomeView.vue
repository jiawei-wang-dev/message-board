<script setup>
import { RouterLink } from 'vue-router'

const features = [
  {
    title: '话题脉络清晰',
    description: '每个观点都保留完整上下文，让讨论自然延伸、轻松跟进。',
    icon: 'threads',
  },
  {
    title: '无限层级回复',
    description: '无论讨论深入到哪一层，都能清楚看见彼此之间的回应关系。',
    icon: 'replies',
  },
  {
    title: '安全账户',
    description: '可靠的账户体系，让每一次参与都有身份、有分寸。',
    icon: 'secure',
  },
]
</script>

<template>
  <div>
    <section class="page-shell grid min-w-0 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
      <div class="min-w-0 max-w-2xl">
        <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
          <span class="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          专注交流的社区空间
        </div>
        <h1 class="[overflow-wrap:anywhere] text-4xl font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.55rem]">
          让每一次讨论，<br class="hidden sm:block" />都脉络清晰。
        </h1>
        <p class="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          留言板是一个专注而友好的交流空间。分享想法、提出问题，也能沿着回复脉络，轻松跟进每一个观点。
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <RouterLink to="/board" class="btn-primary px-5 py-3 text-sm">
            浏览留言
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14m-5-5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </RouterLink>
          <RouterLink to="/register" class="btn-secondary px-5 py-3 text-sm">创建账户</RouterLink>
        </div>
        <p class="mt-4 text-xs text-slate-400">一个简洁、安静，适合认真交流的空间。</p>
      </div>

      <div class="relative mx-auto w-full max-w-lg lg:mx-0">
        <div class="absolute -inset-5 -z-10 rounded-[2rem] bg-brand-100/45 blur-3xl" aria-hidden="true" />
        <div class="panel overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4">
              <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">今日热门</p>
              <p class="mt-1 text-sm font-extrabold text-slate-800">社区讨论</p>
            </div>
            <span class="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">24 人参与</span>
          </div>
          <div class="space-y-5 p-5 sm:p-6">
            <div class="flex gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">陈</span>
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-xs"><strong class="text-slate-800">陈知远</strong><span class="text-slate-400">12 分钟前</span></div>
                <p class="mt-1.5 text-sm leading-6 text-slate-600">哪一个微小改变，最明显地改善了你们团队每周的工作方式？</p>
                <p class="mt-2 text-xs font-bold text-brand-600">8 条回复</p>
              </div>
            </div>
            <div class="ml-5 border-l border-slate-200 pl-5 sm:ml-8">
              <div class="flex gap-3">
                <span class="grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-[0.65rem] font-bold text-amber-700">林</span>
                <div>
                  <div class="flex items-center gap-2 text-xs"><strong class="text-slate-800">林悦</strong><span class="text-slate-400">5 分钟前</span></div>
                  <p class="mt-1.5 [overflow-wrap:anywhere] text-sm leading-6 text-slate-600">站会前先写一段简短进展，对我们帮助很大。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-slate-200/80 bg-white py-12 sm:py-14" aria-labelledby="features-heading">
      <div class="page-shell">
        <div class="max-w-xl">
          <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600">为讨论而生</p>
          <h2 id="features-heading" class="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">保持上下文，从容跟进每个观点。</h2>
        </div>
        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <article v-for="feature in features" :key="feature.title" class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/40">
            <div class="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
              <svg v-if="feature.icon === 'threads'" aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 5h14v10H9l-4 4V5Z" stroke-linejoin="round" /><path d="M8 9h8m-8 3h5" stroke-linecap="round" />
              </svg>
              <svg v-else-if="feature.icon === 'replies'" aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 17-5-5 5-5M4 12h9a7 7 0 0 1 7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z" stroke-linejoin="round" /><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="mt-4 font-extrabold text-slate-900">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
