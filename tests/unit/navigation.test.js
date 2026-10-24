import { describe, expect, it } from 'vitest'
import { getSafeRedirectPath } from '../../src/utils/navigation'

describe('getSafeRedirectPath', () => {
  it('接受站内路径及查询参数', () => {
    expect(getSafeRedirectPath('/board?sort=oldest')).toBe('/board?sort=oldest')
  })

  it.each([
    'https://example.com',
    '//example.com',
    '/%2Fexample.com',
    '/%5C%5Cexample.com',
    '/board%0Ajavascript:alert(1)',
    '%E0%A4%A',
    null,
  ])('拒绝不安全的重定向值：%s', (value) => {
    expect(getSafeRedirectPath(value)).toBe('/board')
  })
})
