// SPDX-License-Identifier: MIT
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 一个件的根类名只在一份样式表里定义（KatanaUI #236）：样式表都并进同一份 ui.css，两个件撞了名，后加的那份就改了先有的件的样子，
// 而且只在两件同屏或别的应用里才看得出来。2026-11-25 升 KATANAview 时撞出来的：决策树（#185）的 .k-dt 带 container-type: inline-size，
// 把日期时间框（.k-dt）压成 0 宽、点不到；同批还有 .k-sr（排程与策略报告）、.k-tl（A 股时间轴与事件时间轴）、.k-dist-bar（分布柱与图工具行）。
// 判据：「.k-x {」这种整条选择器只有一个类名的规则（件的根定义）只许出现在一份文件里；主题层改别的件（.k-dlg.confirm、[data-theme] .k-x）不算定义，不查。
const SRC = fileURLToPath(new URL('..', import.meta.url))

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.css') ? [full] : []
  })

/** 文件里以单个类名为整条选择器的规则：`.k-x {`。 */
export const rootClasses = (css: string): string[] =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^\.(k-[\w-]+)\s*\{/gm)].map((m) => m[1])

describe('件的根类名不跨文件撞名', () => {
  it('rootClasses 只认整条选择器是一个类名的规则', () => {
    expect(rootClasses('.k-a {\n}\n.k-b, .k-c {\n}\n.k-d .k-e {\n}\n/* .k-f { */\n.k-g:hover {\n}\n')).toEqual(['k-a'])
  })

  it('每个 .k-x { 只在一份样式表里', () => {
    const owners = new Map<string, string[]>()
    for (const file of walk(SRC)) {
      for (const name of new Set(rootClasses(readFileSync(file, 'utf8')))) {
        owners.set(name, [...(owners.get(name) ?? []), relative(SRC, file).replaceAll('\\', '/')])
      }
    }
    const clashes = [...owners]
      .filter(([, files]) => files.length > 1)
      .map(([name, files]) => `.${name}：${files.join('、')}`)
    expect(clashes).toEqual([])
  })
})
