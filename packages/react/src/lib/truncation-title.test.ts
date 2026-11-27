// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { installTruncationTitles, isTruncated } from './truncation-title.ts'

describe('isTruncated：真被截断才算', () => {
  it('省略号开着、内容比盒子宽才算', () => {
    expect(isTruncated({ textOverflow: 'ellipsis', scrollWidth: 180, clientWidth: 120 })).toBe(true)
    expect(isTruncated({ textOverflow: 'ellipsis', scrollWidth: 120, clientWidth: 120 })).toBe(false)
  })
  it('1px 以内的亚像素差不算', () => {
    expect(isTruncated({ textOverflow: 'ellipsis', scrollWidth: 121, clientWidth: 120 })).toBe(false)
    expect(isTruncated({ textOverflow: 'ellipsis', scrollWidth: 122, clientWidth: 120 })).toBe(true)
  })
  it('没开省略号（clip）不算：那是别的截法，补 title 也解释不了', () => {
    expect(isTruncated({ textOverflow: 'clip', scrollWidth: 300, clientWidth: 120 })).toBe(false)
  })
})

describe('installTruncationTitles', () => {
  it('没有 document（SSR、单测）时什么都不做，卸载函数也能调', () => {
    const off = installTruncationTitles(undefined)
    expect(off()).toBeUndefined()
  })
})
