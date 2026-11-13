// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vite-plus/test'
import { cn } from './cn'

describe('cn', () => {
  it('拼类名，假值丢掉', () => {
    expect(cn('a', [].length > 0 && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d')
  })

  it('后写的 Tailwind 类盖住前面冲突的：调用方传 className 能改件的样子', () => {
    expect(cn('px-3 h-[30px]', 'px-5')).toBe('h-[30px] px-5')
  })

  it('字号档类（k-text-*）互相盖：后写的档赢', () => {
    expect(cn('k-text-data', 'k-text-caption')).toBe('k-text-caption')
  })

  it('字号档类跟 Tailwind 自己的字号、字重互盖，但不碰颜色', () => {
    expect(cn('k-text-data text-ink', 'text-sm')).toBe('text-ink text-sm')
    expect(cn('text-sm font-bold', 'k-text-body')).toBe('k-text-body')
    expect(cn('k-text-data', 'text-ink-2')).toBe('k-text-data text-ink-2')
  })

  it('档类之后写的行高、字重微调不删档类（按钮、页签、分组标题都这样写）', () => {
    expect(cn('k-text-data leading-none')).toBe('k-text-data leading-none')
    expect(cn('k-text-caption h-[26px] font-semibold')).toBe('k-text-caption h-[26px] font-semibold')
    expect(cn('k-text-micro px-2 leading-normal text-ink-2 uppercase', 'pt-1')).toBe(
      'k-text-micro px-2 leading-normal text-ink-2 uppercase pt-1',
    )
    expect(cn('k-text-data leading-none', 'font-medium')).toBe('k-text-data leading-none font-medium')
  })

  it('档类盖掉它前面的字重与行高，调用方换档时旧的微调不留', () => {
    expect(cn('font-bold leading-none', 'k-text-body')).toBe('k-text-body')
    expect(cn('k-text-data leading-none', 'k-text-body')).toBe('k-text-body')
  })
})
