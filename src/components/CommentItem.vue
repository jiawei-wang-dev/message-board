<script setup>
import { computed, nextTick, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import {
  createReply,
  getCommentErrorMessage,
  getReplies,
} from '../services/comments'
import { formatRelativeTime, mergeCommentsByCreatedAt, toCommentDate } from '../utils/comments'
import CommentForm from './CommentForm.vue'

defineOptions({ name: 'CommentItem' })

const props = defineProps({
  comment: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  currentUserId: { type: String, default: '' },
})

const emit = defineEmits(['delete'])
const { currentUser } = useAuth()
const { showToast } = useToast()
const replying = ref(false)
const replySubmitting = ref(false)
const replyButton = ref(null)
const replies = ref([])
const repliesLoading = ref(false)
const repliesError = ref('')
const repliesLoaded = ref(false)
const repliesExpanded = ref(false)
const lastReplyDocument = ref(null)
const hasMoreReplies = ref(false)
const repliesRegionId = `replies-${props.comment.id}`

const initials = computed(() =>
  (props.comment.userName || '社区成员')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
const deepThread = computed(() => props.depth >= 3)
const canDelete = computed(
  () => !props.comment.isDeleted && props.currentUserId === props.comment.userId,
)
const avatarClasses = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]
const avatarClass = computed(() => {
  const value = props.comment.userId || props.comment.userName || ''
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0)
  return avatarClasses[hash % avatarClasses.length]
})
const createdDate = computed(() => toCommentDate(props.comment.createdAt))
const dateTime = computed(() => createdDate.value?.toISOString() || '')
const relativeTime = computed(() => formatRelativeTime(props.comment.createdAt))

function mergeReplies(incomingReplies) {
  replies.value = mergeCommentsByCreatedAt(replies.value, incomingReplies, 'asc')
}

async function loadReplies({ loadMore = false } = {}) {
  if (repliesLoading.value) return
  if (loadMore && (!hasMoreReplies.value || !lastReplyDocument.value)) return
  if (!loadMore && repliesLoaded.value) {
    repliesExpanded.value = true
    return
  }

  repliesLoading.value = true
  repliesError.value = ''
  repliesExpanded.value = true

  try {
    const result = await getReplies(props.comment.id, {
      cursor: loadMore ? lastReplyDocument.value : null,
    })
    mergeReplies(result.replies)
    lastReplyDocument.value = result.cursor
    hasMoreReplies.value = result.hasMore
    repliesLoaded.value = true
  } catch (error) {
    repliesError.value = getCommentErrorMessage(
      error,
      loadMore ? '无法加载更多回复，请稍后重试。' : '无法加载回复，请稍后重试。',
    )
  } finally {
    repliesLoading.value = false
  }
}

async function toggleReplies() {
  if (repliesExpanded.value) {
    repliesExpanded.value = false
    return
  }
  await loadReplies()
}

function startReplying() {
  if (props.comment.isDeleted) return
  replying.value = true
}

async function closeReplyComposer() {
  if (replySubmitting.value) return
  replying.value = false
  await nextTick()
  replyButton.value?.focus()
}

async function sendReply(content) {
  if (replySubmitting.value || !currentUser.value || props.comment.isDeleted) return
  replySubmitting.value = true

  try {
    const createdReply = await createReply({
      user: currentUser.value,
      parent: props.comment,
      content,
    })
    mergeReplies([createdReply])
    repliesExpanded.value = true
    if (!repliesLoaded.value) await loadReplies()
    replying.value = false
    showToast(`已回复 ${props.comment.userName}。`)
    await nextTick()
    replyButton.value?.focus()
  } catch (error) {
    const permissionDenied = error?.code === 'permission-denied'
      || error?.code === 'firestore/permission-denied'
    showToast(
      permissionDenied
        ? '无法发布回复，父留言可能已删除或当前账户没有权限。'
        : getCommentErrorMessage(error, '回复发布失败，请稍后重试。'),
      'error',
    )
  } finally {
    replySubmitting.value = false
  }
}
</script>

<template>
  <article :aria-label="`${comment.userName} 的留言`" class="comment-node">
    <div class="flex gap-3 sm:gap-4">
      <span
        class="grid size-9 shrink-0 place-items-center rounded-full text-[0.68rem] font-extrabold ring-2 ring-white sm:size-10"
        :class="avatarClass"
      >
        <img
          v-if="comment.userPhotoURL"
          :src="comment.userPhotoURL"
          :alt="`${comment.userName} 的头像`"
          class="size-full rounded-full object-cover"
        />
        <span v-else aria-hidden="true">{{ initials }}</span>
      </span>

      <div class="min-w-0 flex-1 pt-0.5">
        <header class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 class="break-all text-sm font-bold text-slate-900">{{ comment.userName }}</h3>
          <span aria-hidden="true" class="text-slate-300">·</span>
          <time class="text-xs text-slate-500" :datetime="dateTime">{{ relativeTime }}</time>
        </header>

        <p v-if="comment.isDeleted" class="mt-2 text-sm italic leading-6 text-slate-400">[该留言已删除]</p>
        <p v-else class="mt-2 whitespace-pre-line [overflow-wrap:anywhere] text-[0.925rem] leading-6 text-slate-700">{{ comment.content }}</p>

        <div class="mt-2.5 flex flex-wrap items-center gap-1">
          <button
            v-if="!comment.isDeleted"
            ref="replyButton"
            type="button"
            class="comment-action"
            :aria-expanded="replying"
            @click="replying ? closeReplyComposer() : startReplying()"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 17 4 12l5-5M4 12h10a6 6 0 0 1 6 6v1" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            回复
          </button>
          <button
            type="button"
            class="comment-action"
            :aria-expanded="repliesExpanded"
            :aria-controls="repliesRegionId"
            :disabled="repliesLoading"
            @click="toggleReplies"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-3.5 transition-transform" :class="repliesExpanded ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ repliesLoading && !repliesLoaded ? '加载回复中…' : repliesExpanded ? '收起回复' : repliesLoaded ? '展开回复' : '查看回复' }}
          </button>
          <button v-if="canDelete" type="button" class="comment-action hover:!text-red-600" @click="$emit('delete', comment)">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            删除
          </button>
        </div>

        <div v-if="replying && !comment.isDeleted" class="mt-3">
          <CommentForm
            compact
            :reply-to="comment.userName"
            :loading="replySubmitting"
            @submit="sendReply"
            @cancel="closeReplyComposer"
          />
        </div>
      </div>
    </div>

    <div
      v-show="repliesExpanded"
      :id="repliesRegionId"
      class="thread-children"
      :class="{ 'thread-children--deep': deepThread }"
      role="group"
      :aria-label="`对 ${comment.userName} 的回复`"
    >
      <div v-if="repliesLoading && !repliesLoaded" class="flex items-center gap-2 py-2 text-xs text-slate-500" role="status" aria-live="polite">
        <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
          <path class="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
        </svg>
        正在加载回复…
      </div>

      <div v-if="repliesError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">
        <p>{{ repliesError }}</p>
        <button type="button" class="mt-1 font-bold underline underline-offset-2" @click="loadReplies({ loadMore: repliesLoaded })">重试</button>
      </div>

      <p v-if="repliesLoaded && !replies.length && !repliesError" class="py-2 text-xs text-slate-400">暂无回复</p>

      <CommentItem
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :depth="depth + 1"
        :current-user-id="currentUserId"
        @delete="$emit('delete', $event)"
      />

      <button
        v-if="repliesLoaded && hasMoreReplies"
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="repliesLoading"
        :aria-busy="repliesLoading"
        @click="loadReplies({ loadMore: true })"
      >
        <svg v-if="repliesLoading" class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
          <path class="opacity-80" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
        </svg>
        {{ repliesLoading ? '加载中…' : '加载更多回复' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.comment-node + .comment-node {
  margin-top: 1.25rem;
}

.comment-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.5rem;
  padding: 0.35rem 0.55rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  transition: background-color 150ms ease, color 150ms ease;
}

.comment-action:hover:not(:disabled) {
  background: #f1f5f9;
  color: #334155;
}

.comment-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.thread-children {
  position: relative;
  margin-top: 1rem;
  margin-left: 1.25rem;
  padding-left: 1.5rem;
}

.thread-children::before {
  position: absolute;
  inset-block: 0.1rem 0.4rem;
  left: 0;
  width: 1px;
  background: #dbe2ea;
  content: '';
}

.thread-children--deep {
  margin-left: 0;
  padding-left: 0;
}

.thread-children--deep::before {
  left: -0.45rem;
}

@media (max-width: 640px) {
  .thread-children {
    margin-left: 0.2rem;
    padding-left: 0.65rem;
  }

  .thread-children--deep {
    margin-left: 0;
    padding-left: 0;
  }

  .thread-children--deep::before {
    left: -0.25rem;
  }
}
</style>
