<script setup>
import { nextTick, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { registerUser } from '../services/auth'

const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const loading = ref(false)
const errorAlert = ref(null)
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
  if (!displayName.value.trim()) {
    await showError('请输入昵称。')
    return
  }
  if (displayName.value.trim().length < 2) {
    await showError('昵称至少需要 2 个字符。')
    return
  }
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
  if (!passwordConfirmation.value) {
    await showError('请再次输入密码。')
    return
  }
  if (password.value !== passwordConfirmation.value) {
    await showError('两次输入的密码不一致。')
    return
  }

  loading.value = true
  const result = await registerUser(
    displayName.value,
    email.value,
    password.value,
  )

  if (!result.success) {
    loading.value = false
    await showError(result.error)
    return
  }

  await router.replace('/board')
}
</script>

<template>
  <section class="page-shell grid min-h-[calc(100vh-8rem)] place-items-center py-10 sm:py-16">
    <div class="w-full max-w-md">
      <div class="text-center">
        <span class="mx-auto grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-4v6m3-3h-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <h1 class="mt-5 text-2xl font-black tracking-[-0.03em] text-slate-950">创建账户</h1>
        <p class="mt-2 text-sm text-slate-500">加入社区，分享你的想法和观点。</p>
      </div>

      <form class="panel mt-7 p-5 sm:p-7" novalidate @submit.prevent="submit">
        <div>
          <label for="register-name" class="text-sm font-bold text-slate-700">昵称</label>
          <input id="register-name" v-model="displayName" class="field mt-2" type="text" name="name" autocomplete="name" placeholder="请输入昵称" minlength="2" maxlength="50" required aria-describedby="register-name-hint register-error" :aria-invalid="Boolean(error)" />
          <p id="register-name-hint" class="mt-1.5 text-xs text-slate-400">你的留言旁会显示这个名字。</p>
        </div>
        <div class="mt-5">
          <label for="register-email" class="text-sm font-bold text-slate-700">邮箱</label>
          <input id="register-email" v-model="email" class="field mt-2" type="email" name="email" autocomplete="email" placeholder="请输入邮箱地址" required aria-describedby="register-error" :aria-invalid="Boolean(error)" />
        </div>
        <div class="mt-5">
          <div class="flex items-center justify-between gap-3">
            <label for="register-password" class="text-sm font-bold text-slate-700">密码</label>
            <span class="text-xs font-semibold text-slate-400">至少 8 个字符</span>
          </div>
          <input id="register-password" v-model="password" class="field mt-2" type="password" name="password" autocomplete="new-password" placeholder="请设置安全密码" minlength="8" required aria-describedby="password-hint register-error" :aria-invalid="Boolean(error)" />
          <p id="password-hint" class="mt-1.5 text-xs text-slate-400">建议组合使用字母、数字和符号。</p>
        </div>
        <div class="mt-5">
          <label for="register-password-confirmation" class="text-sm font-bold text-slate-700">确认密码</label>
          <input id="register-password-confirmation" v-model="passwordConfirmation" class="field mt-2" type="password" name="passwordConfirmation" autocomplete="new-password" placeholder="请再次输入密码" minlength="8" required aria-describedby="register-error" :aria-invalid="Boolean(error)" />
        </div>

        <p v-if="error" id="register-error" ref="errorAlert" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700" role="alert" tabindex="-1">{{ error }}</p>

        <button type="submit" class="btn-primary mt-6 w-full px-4 py-2.5 text-sm" :disabled="loading" :aria-busy="loading">
          {{ loading ? '正在创建账户…' : '注册' }}
        </button>
        <p class="mt-4 text-center text-xs leading-5 text-slate-400">注册即表示你愿意以友善、尊重的方式参与讨论。</p>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        已有账户？
        <RouterLink to="/login" class="font-bold text-brand-600 hover:text-brand-700 hover:underline">去登录</RouterLink>
      </p>
    </div>
  </section>
</template>
