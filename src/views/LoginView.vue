<script setup>
import { nextTick, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { loginUser } from '../services/auth'
import { getSafeRedirectPath } from '../utils/navigation'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const errorAlert = ref(null)
const route = useRoute()
const router = useRouter()

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function showError(message) {
  error.value = message
  await nextTick()
  errorAlert.value?.focus()
}

async function submit() {
  if (loading.value) return

  error.value = ''
  if (!email.value.trim()) {
    await showError('请输入邮箱。')
    return
  }
  if (!emailPattern.test(email.value.trim())) {
    await showError('请输入有效的邮箱地址。')
    return
  }
  if (!password.value) {
    await showError('请输入密码。')
    return
  }
  if (password.value.length < 8) {
    await showError('密码至少需要 8 个字符。')
    return
  }

  loading.value = true
  const result = await loginUser(email.value, password.value)

  if (!result.success) {
    loading.value = false
    await showError(result.error)
    return
  }

  await router.replace(getSafeRedirectPath(route.query.redirect))
}
</script>

<template>
  <section class="page-shell grid min-h-[calc(100vh-8rem)] place-items-center py-10 sm:py-16">
    <div class="w-full max-w-md">
      <div class="text-center">
        <span class="mx-auto grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 8h10M7 12h7M7 16h4" stroke-linecap="round" /><path d="M5 4h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 3v-4a2 2 0 0 1-1-1.73V6a2 2 0 0 1 2-2Z" stroke-linejoin="round" />
          </svg>
        </span>
        <h1 class="mt-5 text-2xl font-black tracking-[-0.03em] text-slate-950">欢迎回来</h1>
        <p class="mt-2 text-sm text-slate-500">登录后继续参与讨论。</p>
      </div>

      <form class="panel mt-7 p-5 sm:p-7" novalidate @submit.prevent="submit">
        <div>
          <label for="login-email" class="text-sm font-bold text-slate-700">邮箱</label>
          <input id="login-email" v-model="email" class="field mt-2" type="email" name="email" autocomplete="email" placeholder="请输入邮箱地址" required aria-describedby="login-email-hint login-error" :aria-invalid="Boolean(error)" />
          <p id="login-email-hint" class="mt-1.5 text-xs text-slate-400">请输入注册账户时使用的邮箱。</p>
        </div>
        <div class="mt-5">
          <div class="flex items-center justify-between gap-3">
            <label for="login-password" class="text-sm font-bold text-slate-700">密码</label>
            <span class="text-xs font-semibold text-slate-400">至少 8 个字符</span>
          </div>
          <input id="login-password" v-model="password" class="field mt-2" type="password" name="password" autocomplete="current-password" placeholder="请输入密码" minlength="8" required aria-describedby="login-error" :aria-invalid="Boolean(error)" />
        </div>

        <p v-if="error" id="login-error" ref="errorAlert" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700" role="alert" tabindex="-1">{{ error }}</p>

        <button type="submit" class="btn-primary mt-6 w-full px-4 py-2.5 text-sm" :disabled="loading" :aria-busy="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        还没有账户？
        <RouterLink to="/register" class="font-bold text-brand-600 hover:text-brand-700 hover:underline">立即注册</RouterLink>
      </p>
    </div>
  </section>
</template>
