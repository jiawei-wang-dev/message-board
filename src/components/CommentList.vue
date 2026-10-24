<script setup>
import CommentItem from './CommentItem.vue'
import EmptyState from './EmptyState.vue'

defineProps({
  comments: { type: Array, default: () => [] },
  currentUserId: { type: String, default: '' },
})

defineEmits(['delete'])
</script>

<template>
  <section aria-labelledby="discussion-heading">
    <h2 id="discussion-heading" class="sr-only">讨论区</h2>
    <div v-if="comments.length" class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="panel p-4 sm:p-6">
        <CommentItem
          :comment="comment"
          :current-user-id="currentUserId"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
    <EmptyState v-else />
  </section>
</template>
