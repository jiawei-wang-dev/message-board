import { describe, expect, it } from 'vitest'
import {
  formatRelativeTime,
  mergeCommentsByCreatedAt,
  toCommentDate,
  validateCommentContent,
} from '../../src/utils/comments'

describe('validateCommentContent', () => {
  it('拒绝空白内容', () => {
    expect(validateCommentContent('   ')).toEqual({
      valid: false,
      value: '',
      error: '请输入留言内容。',
    })
  })

  it('修剪并接受有效内容', () => {
    expect(validateCommentContent('  一条有效留言  ')).toEqual({
      valid: true,
      value: '一条有效留言',
      error: '',
    })
  })

  it('拒绝超过长度限制的内容', () => {
    expect(validateCommentContent('长'.repeat(2001)).valid).toBe(false)
  })
})

describe('mergeCommentsByCreatedAt', () => {
  const oldComment = { id: 'old', createdAt: new Date('2026-01-01T00:00:00Z') }
  const newComment = { id: 'new', createdAt: new Date('2026-01-02T00:00:00Z') }

  it('按时间排序并按 id 去重', () => {
    const replacement = { ...oldComment, content: '更新后的内容' }
    const result = mergeCommentsByCreatedAt([oldComment, newComment], [replacement], 'asc')

    expect(result.map(({ id }) => id)).toEqual(['old', 'new'])
    expect(result[0].content).toBe('更新后的内容')
  })

  it('支持倒序排列和 Firestore 时间戳形状', () => {
    const firestoreComment = { id: 'later', createdAt: { toMillis: () => 2 } }
    const earlierComment = { id: 'earlier', createdAt: { toMillis: () => 1 } }

    expect(mergeCommentsByCreatedAt([], [earlierComment, firestoreComment], 'desc'))
      .toEqual([firestoreComment, earlierComment])
  })
})

describe('comment date formatting', () => {
  const now = new Date('2026-10-24T12:00:00Z').getTime()

  it('兼容 Firestore Timestamp 并处理无效值', () => {
    const date = new Date('2026-10-24T11:00:00Z')
    expect(toCommentDate({ toDate: () => date })).toBe(date)
    expect(toCommentDate('not-a-date')).toBeNull()
  })

  it('生成自然的中文相对时间', () => {
    expect(formatRelativeTime(new Date(now - 30_000), now)).toBe('刚刚')
    expect(formatRelativeTime(new Date(now - 3_600_000), now)).toContain('小时前')
  })
})
