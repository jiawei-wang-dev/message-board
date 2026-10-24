<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import { logoutUser } from '../services/auth'

const menuOpen = ref(false)
const logoutLoading = ref(false)
const route = useRoute()
const router = useRouter()
const { currentUser, isAuthenticated, authLoading } = useAuth()
const { showToast } = useToast()
const displayName = computed(() => currentUser.value?.displayName || '用户')
const userInitial = computed(() => displayName.value.trim().charAt(0).toUpperCase() || '用')

function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}

async function handleLogout() {
  if (logoutLoading.value) return

  logoutLoading.value = true
  const result = await logoutUser()
  logoutLoading.value = false

  if (!result.success) {
    showToast(result.error, 'error')
    return
  }

  showToast('已安全退出登录。')
  await router.replace('/')
}

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <nav class="page-shell flex h-16 items-center justify-between" aria-label="主导航">
      <RouterLink to="/" class="group flex items-center gap-2.5 rounded-lg" aria-label="留言板首页">
        <span class="grid size-8 place-items-center rounded-[0.65rem] bg-brand-600 text-white shadow-sm transition-transform group-hover:-rotate-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 8h10M7 12h7M7 16h4" stroke-linecap="round" />
            <path d="M5 4h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 3v-4a2 2 0 0 1-1-1.73V6a2 2 0 0 1 2-2Z" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="text-[1.05rem] font-extrabold tracking-[-0.025em] text-slate-900">留言板</span>
      </RouterLink>

      <div class="hidden items-center gap-1 md:flex">
        <RouterLink to="/" class="nav-link">首页</RouterLink>
        <RouterLink to="/board" class="nav-link">留言板</RouterLink>
      </div>

      <div v-if="authLoading" class="hidden items-center gap-2 md:flex" aria-label="正在确认登录状态" aria-busy="true">
        <span class="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div v-else-if="isAuthenticated" class="hidden items-center gap-2 md:flex">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700" aria-hidden="true">{{ userInitial }}</span>
        <span class="max-w-40 truncate pr-2 text-sm font-bold text-slate-700" :title="displayName">{{ displayName }}</span>
        <button type="button" class="btn-secondary px-4 py-2 text-sm" :disabled="logoutLoading" :aria-busy="logoutLoading" @click="handleLogout">
          {{ logoutLoading ? '正在退出…' : '退出登录' }}
        </button>
      </div>
      <div v-else class="hidden items-center gap-2 md:flex">
        <RouterLink to="/login" class="btn-quiet px-3.5 py-2 text-sm">登录</RouterLink>
        <RouterLink to="/register" class="btn-primary px-4 py-2 text-sm">注册</RouterLink>
      </div>

      <button
        class="grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
        </svg>
        <svg v-else aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
        </svg>
      </button>
    </nav>

    <div v-if="menuOpen" id="mobile-menu" class="border-t border-slate-200 bg-white px-3 py-3 md:hidden">
      <div class="mx-auto grid max-w-3xl gap-1">
        <RouterLink to="/" class="mobile-nav-link">首页</RouterLink>
        <RouterLink to="/board" class="mobile-nav-link">留言板</RouterLink>
        <div class="my-2 border-t border-slate-200" />
        <div v-if="authLoading" class="h-10 animate-pulse rounded-lg bg-slate-100" aria-label="正在确认登录状态" aria-busy="true" />
        <template v-else-if="isAuthenticated">
          <div class="flex min-w-0 items-center gap-2 px-3 py-2">
            <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700" aria-hidden="true">{{ userInitial }}</span>
            <p class="min-w-0 truncate text-sm font-bold text-slate-700" :title="displayName">{{ displayName }}</p>
          </div>
          <button type="button" class="btn-secondary mt-1 px-4 py-2.5 text-sm" :disabled="logoutLoading" :aria-busy="logoutLoading" @click="handleLogout">
            {{ logoutLoading ? '正在退出…' : '退出登录' }}
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mobile-nav-link">登录</RouterLink>
          <RouterLink to="/register" class="btn-primary mt-1 px-4 py-2.5 text-sm">注册</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-link {
  border-radius: 0.55rem;
  padding: 0.5rem 0.8rem;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 650;
  transition: color 150ms ease, background-color 150ms ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  background: #f1f5f9;
  color: #172033;
}

.mobile-nav-link {
  border-radius: 0.65rem;
  padding: 0.7rem 0.8rem;
  color: #475569;
  font-size: 0.925rem;
  font-weight: 650;
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-exact-active {
  background: #f1f5f9;
  color: #172033;
}
</style>
