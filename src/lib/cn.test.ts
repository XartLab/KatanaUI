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

describe('字号档类不被同串里的字号工具类吃掉（2026-11-13 独立审：input sm 的 text-[length:…] 删掉了 k-text-body）', () => {
  it('cn 对 input 的 sm 变体保留档类，只改字号', async () => {
    const { inputVariants } = await import('../primitives/input')
    const out = cn(inputVariants({ size: 'sm' }))
    expect(out).toContain('k-text-body')
    expect(out).toContain('[font-size:var(--text-data-size)]')
  })

  it('源码里同一个字符串字面量不同时写档类和 text-[ / text-xs… 这类字号工具类', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const root = join(import.meta.dirname, '..')
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? walk(join(dir, e.name))
          : /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name)
            ? [join(dir, e.name)]
            : [],
      )
    const bad: string[] = []
    for (const file of walk(root)) {
      for (const literal of readFileSync(file, 'utf8').match(/'[^'\n]*'|`[^`\n]*`/g) ?? []) {
        if (
          /k-text-(title|body|data|caption|micro)/.test(literal) &&
          /(^|[\s'`:])text-(\[|xs\b|sm\b|base\b|lg\b|xl\b|[2-9]xl\b)/.test(literal)
        )
          bad.push(`${file}: ${literal}`)
      }
    }
    expect(bad).toEqual([])
  })
})
