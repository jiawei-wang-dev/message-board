<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import ToastMessage from './components/ToastMessage.vue'
import { useToast } from './composables/useToast'

const { toast, dismissToast } = useToast()
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <div class="flex min-h-screen flex-col bg-surface text-ink">
    <Navbar />
    <main id="main-content" class="flex-1" tabindex="-1">
      <RouterView />
    </main>
    <footer class="border-t border-slate-200/80 bg-white py-6">
      <div class="page-shell flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 留言板</p>
        <p>让每一次交流都清晰有序。</p>
      </div>
    </footer>
    <ToastMessage
      v-if="toast"
      :message="toast.message"
      :type="toast.type"
      @dismiss="dismissToast"
    />
  </div>
</template>
