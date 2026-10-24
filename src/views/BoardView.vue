<script setup>
import { onMounted, ref, watch } from 'vue'
import CommentForm from '../components/CommentForm.vue'
import CommentList from '../components/CommentList.vue'
import CommentSkeleton from '../components/CommentSkeleton.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import {
  createRootComment,
  getCommentErrorMessage,
  getRootComments,
  softDeleteComment,
} from '../services/comments'
import { mergeCommentsByCreatedAt } from '../utils/comments'

const { showToast } = useToast()
const { currentUser } = useAuth()
const sortOrder = ref('newest')
const comments = ref([])
const cursor = ref(null)
const hasMore = ref(false)
const initialLoading = ref(true)
const loadingMore = ref(false)
const posting = ref(false)
const queryError = ref('')
const deletingComment = ref(null)
const deleting = ref(false)
const commentForm = ref(null)
let queryGeneration = 0

async function loadFirstPage() {
  const generation = ++queryGeneration
  initialLoading.value = true
  loadingMore.value = false
  queryError.value = ''
  comments.value = []
  cursor.value = null
  hasMore.value = false

  try {
    const result = await getRootComments({ sortOrder: sortOrder.value })
    if (generation !== queryGeneration) return
    comments.value = mergeCommentsByCreatedAt(
      [],
      result.comments,
      sortOrder.value === 'oldest' ? 'asc' : 'desc',
    )
    cursor.value = result.cursor
    hasMore.value = result.hasMore
  } catch (error) {
    if (generation !== queryGeneration) return
    queryError.value = getCommentErrorMessage(error, '无法加载留言，请稍后重试。')
  } finally {
    if (generation === queryGeneration) initialLoading.value = false
  }
}

async function loadMoreComments() {
  if (initialLoading.value || loadingMore.value || !hasMore.value || !cursor.value) return
  const generation = queryGeneration
  loadingMore.value = true

  try {
    const result = await getRootComments({
      sortOrder: sortOrder.value,
      cursor: cursor.value,
    })
    if (generation !== queryGeneration) return
    comments.value = mergeCommentsByCreatedAt(
      comments.value,
      result.comments,
      sortOrder.value === 'oldest' ? 'asc' : 'desc',
    )
    cursor.value = result.cursor
    hasMore.value = result.hasMore
  } catch (error) {
    if (generation === queryGeneration) {
      showToast(getCommentErrorMessage(error, '无法加载更多留言，请稍后重试。'), 'error')
    }
  } finally {
    if (generation === queryGeneration) loadingMore.value = false
  }
}

async function postMessage(content) {
  if (posting.value || !currentUser.value) return
  posting.value = true

  try {
    await createRootComment({ user: currentUser.value, content })
    commentForm.value?.clear()
    showToast('留言发布成功。')
    await loadFirstPage()
  } catch (error) {
    showToast(getCommentErrorMessage(error, '留言发布失败，请稍后重试。'), 'error')
  } finally {
    posting.value = false
  }
}

function requestDelete(comment) {
  if (comment.userId === currentUser.value?.uid && !comment.isDeleted) {
    deletingComment.value = comment
  }
}

function cancelDelete() {
  if (!deleting.value) deletingComment.value = null
}

async function confirmDelete() {
  if (deleting.value || !deletingComment.value || !currentUser.value) return
  deleting.value = true
  const target = deletingComment.value

  try {
    await softDeleteComment({ commentId: target.id, userId: currentUser.value.uid })
    target.content = ''
    target.isDeleted = true
    target.deletedAt = new Date()
    target.updatedAt = new Date()
    deletingComment.value = null
    showToast('留言已删除，后续回复结构将保持有效。')
  } catch (error) {
    showToast(getCommentErrorMessage(error, '删除失败，请稍后重试。'), 'error')
  } finally {
    deleting.value = false
  }
}

watch(sortOrder, loadFirstPage)
onMounted(loadFirstPage)
</script>

<template>
  <div class="page-shell py-8 sm:py-10">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
          <span class="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          社区留言板
        </div>
        <h1 class="mt-2 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">加入讨论</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">分享你的想法，提出一个具体的问题，或在已有话题中补充自己的观点。</p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <label for="sort-comments" class="text-sm font-bold text-slate-600">排序</label>
        <select id="sort-comments" v-model="sortOrder" class="field w-auto min-w-32 py-2 text-sm font-semibold">
          <option value="newest">最新发布</option>
          <option value="oldest">最早发布</option>
        </select>
      </div>
    </header>

    <div class="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
      <div class="min-w-0 space-y-6">
        <CommentForm ref="commentForm" :loading="posting" @submit="postMessage" />

        <CommentSkeleton v-if="initialLoading" />

        <div v-else-if="queryError" class="panel px-6 py-10 text-center" role="alert">
          <div class="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 8v5m0 3h.01M10.3 4.4 2.8 17.5A1.7 1.7 0 0 0 4.3 20h15.4a1.7 1.7 0 0 0 1.5-2.5L13.7 4.4a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h2 class="mt-4 font-extrabold text-slate-900">留言加载失败</h2>
          <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{{ queryError }}</p>
          <button type="button" class="btn-secondary mt-5 px-4 py-2 text-sm" @click="loadFirstPage">重新加载</button>
        </div>

        <template v-else>
          <CommentList
            :comments="comments"
            :current-user-id="currentUser?.uid"
            @delete="requestDelete"
          />
          <button
            v-if="comments.length && hasMore"
            type="button"
            class="btn-secondary w-full py-3 text-sm"
            :disabled="loadingMore"
            :aria-busy="loadingMore"
            @click="loadMoreComments"
          >
            <svg v-if="loadingMore" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
              <path class="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
            </svg>
            {{ loadingMore ? '加载中…' : '加载更多留言' }}
          </button>
        </template>
      </div>

      <aside class="panel order-first p-5 lg:order-last lg:sticky lg:top-24" aria-labelledby="community-details">
        <h2 id="community-details" class="text-sm font-extrabold text-slate-900">关于留言板</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">在这里提出有价值的问题，分享实用想法，展开彼此尊重的讨论。</p>
        <dl class="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 lg:grid-cols-1">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-xs text-slate-500">已加载留言</dt>
            <dd class="text-sm font-extrabold text-slate-800">{{ comments.length }}</dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-xs text-slate-500">每页显示</dt>
            <dd class="text-sm font-extrabold text-slate-800">10</dd>
          </div>
        </dl>
        <div class="mt-4 flex gap-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="mt-0.5 size-4 shrink-0 text-brand-500" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke-linecap="round" />
          </svg>
          <p class="text-xs leading-5 text-slate-500">请保持回复友善、切题，并为讨论带来建设性的内容。</p>
        </div>
      </aside>
    </div>

    <ConfirmModal
      :open="Boolean(deletingComment)"
      :loading="deleting"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>
