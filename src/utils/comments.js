export const MAX_COMMENT_LENGTH = 2000

export function validateCommentContent(content, maxLength = MAX_COMMENT_LENGTH) {
  const value = typeof content === 'string' ? content.trim() : ''

  if (!value) return { valid: false, value, error: '请输入留言内容。' }
  if (value.length > maxLength) {
    return {
      valid: false,
      value,
      error: `留言不能超过 ${maxLength} 个字符。`,
    }
  }

  return { valid: true, value, error: '' }
}

export function commentTimestamp(comment) {
  const value = comment?.createdAt
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

export function mergeCommentsByCreatedAt(existing, incoming, direction = 'asc') {
  const merged = new Map(existing.map((comment) => [comment.id, comment]))
  for (const comment of incoming) merged.set(comment.id, comment)

  const multiplier = direction === 'desc' ? -1 : 1
  return [...merged.values()].sort((a, b) => {
    const timeDifference = commentTimestamp(a) - commentTimestamp(b)
    if (timeDifference) return timeDifference * multiplier
    return String(a.id).localeCompare(String(b.id)) * multiplier
  })
}

export function toCommentDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatRelativeTime(value, now = Date.now()) {
  const date = toCommentDate(value)
  if (!date) return '刚刚'

  const seconds = Math.round((date.getTime() - now) / 1000)
  const absoluteSeconds = Math.abs(seconds)
  const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

  if (absoluteSeconds < 60) return '刚刚'
  if (absoluteSeconds < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
  if (absoluteSeconds < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
  if (absoluteSeconds < 604800) return formatter.format(Math.round(seconds / 86400), 'day')

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
