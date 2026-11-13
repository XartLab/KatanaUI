// SPDX-License-Identifier: MIT
// 设计稿覆盖表（#1870）：design/katana-console/project/components/ 的每张组件卡落到了哪里、做没做。
// 手写的只有 packages/ui/docs/coverage-map.json（每张卡的归属、落点、状态）；这个脚本只对账并生成 packages/ui/docs/coverage.md：
//   - 目录里有、映射里没有的卡 → 红；映射里有、目录里没有的 → 红（卡改名删除了映射要跟着改）；
//   - 归属或状态不在规定的五类、三态里 → 红；已做与部分没有落点 → 红；没做反而写了现有落点 → 红；
//   - 落点是包的出口名的，要真的从 @katanaview/ui 或 @katanaview/ui/quant 导出；是路径的，文件或目录要真的存在。
// 卡的分组取 preview.html 第 1 行的 `@dsCard group`。
// 用法：pnpm --filter @katanaview/ui coverage            重新生成 coverage.md
//       pnpm --filter @katanaview/ui coverage --check    只对账与比对已提交的 coverage.md（pnpm lint:ds 先跑它）
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { KINDS, STATUSES, summarize, whereText } from '../docs/coverage-core.ts'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..')
const repo = resolve(pkg, '../..')
const CARDS = join(repo, 'design/katana-console/project/components')
const MAP = join(pkg, 'docs/coverage-map.json')
const OUT = join(pkg, 'docs/coverage.md')

/** 卡：目录名 → 分组（preview.html 第 1 行的 @dsCard group；没写的是空串）。 */
export function readCards() {
  const cards = new Map()
  for (const name of readdirSync(CARDS).sort()) {
    const first = readFileSync(join(CARDS, name, 'preview.html'), 'utf8').split('\n', 1)[0]
    cards.set(name, /@dsCard\b[^>]*?\bgroup="([^"]*)"/.exec(first)?.[1] ?? '')
  }
  return cards
}

/** 包的出口名：扫三份出口文件里 `export { A, B } from` 与 `export function/const` 的名字（`export *` 跟进去）。 */
export function packageExports() {
  const names = new Set()
  const scan = (file) => {
    const text = readFileSync(file, 'utf8')
    for (const [, body] of text.matchAll(/export\s*\{([^}]*)\}/g))
      for (const item of body.split(',')) {
        const name = item
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)
          .pop()
        if (name && !/^type\s/.test(item.trim())) names.add(name)
      }
    for (const [, name] of text.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g)) names.add(name)
    for (const [, from] of text.matchAll(/export\s*\*\s*from\s*'(\.[^']+)'/g)) {
      const next = [`${from}.ts`, `${from}/index.ts`].map((rel) => resolve(dirname(file), rel)).find(existsSync)
      if (next) scan(next)
    }
  }
  // 出口取自 package.json 的 exports（.ts 的那些），新加一层的出口（如 #1869 的 ./blocks）不用再改这里。
  const { exports } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'))
  for (const target of Object.values(exports))
    if (typeof target === 'string' && target.endsWith('.ts')) scan(join(pkg, target))
  return names
}

/** 对账：返回问题列表（空就是过）。 */
export function problems(map, cards, exported) {
  const out = []
  const mapped = new Set(Object.keys(map.cards))
  for (const name of cards.keys()) if (!mapped.has(name)) out.push(`卡 ${name} 没有映射（coverage-map.json 里加一条）`)
  for (const name of mapped) if (!cards.has(name)) out.push(`映射里的 ${name} 在设计稿里没有这张卡`)
  for (const [name, entry] of Object.entries(map.cards)) {
    if (!KINDS.includes(entry.kind)) out.push(`${name}：归属「${entry.kind}」不在 ${KINDS.join('、')} 里`)
    if (!STATUSES.includes(entry.status)) out.push(`${name}：状态「${entry.status}」不在 ${STATUSES.join('、')} 里`)
    if (!Array.isArray(entry.at)) {
      out.push(`${name}：at 要是数组`)
      continue
    }
    if (entry.status !== '没做' && entry.at.length === 0) out.push(`${name}：状态是${entry.status}，at 不能空`)
    if (entry.status === '没做' && entry.at.length > 0)
      out.push(`${name}：没做的卡不该有现有落点 ${entry.at.join('、')}`)
    for (const place of entry.at) {
      if (place.includes('/')) {
        if (!existsSync(join(repo, place))) out.push(`${name}：路径 ${place} 不存在`)
      } else if (!exported.has(place)) out.push(`${name}：${place} 不是包的出口名`)
    }
    for (const place of entry.planned ?? [])
      if (!place.includes('/') && exported.has(place)) out.push(`${name}：${place} 已经在包里了，从 planned 挪进 at`)
  }
  return out
}

export function render(map, cards) {
  const rows = [...cards.keys()].map((name) => {
    const entry = map.cards[name]
    const group = cards.get(name) || '—'
    const note = entry.note ? `${entry.note}` : ''
    return `| ${name} | ${group} | ${entry.kind} | ${whereText(entry)} | ${entry.status} | ${note} |`
  })
  const summary = summarize(map).map(
    (s) => `| ${s.kind} | ${s.done} | ${s.partial} | ${s.none} | ${s.total} | ${s.done} / ${s.total} |`,
  )
  const total = summarize(map).reduce((sum, s) => ({ done: sum.done + s.done, all: sum.all + s.total }), {
    done: 0,
    all: 0,
  })
  return `<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- 生成文件：pnpm --filter @katanaview/ui coverage。手写的是 coverage-map.json，不要改这份。 -->

# 设计稿覆盖表

设计稿存档 \`design/katana-console/project/components/\` 的 ${cards.size} 张组件卡，每张落到了哪里、做没做（#1870）。
归属：基础件（\`primitives/\`）、自有件（\`katana/\`）、量化（\`quant/\`）、积木（\`blocks/\`，#1869）、面板（\`src/panels\` 与应用外壳）。
状态：已做（卡的内容在包里或应用里做出来了，落点写在「落在哪里」）、部分（做了一块，缺什么写在备注）、没做。
「计划」是已经定了名字、还没有的落点（积木层的 DataGrid、EmptyState、Toolbar，#1869），落地后挪进现有落点。

## 汇总

| 归属 | 已做 | 部分 | 没做 | 总数 | 已做 / 总数 |
| --- | --- | --- | --- | --- | --- |
${summary.join('\n')}
| 合计 | | | | ${total.all} | ${total.done} / ${total.all} |

## 每张卡

| 卡 | 分组 | 归属 | 落在哪里 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const map = JSON.parse(readFileSync(MAP, 'utf8'))
  const cards = readCards()
  const found = problems(map, cards, packageExports())
  if (found.length > 0) {
    console.error(`覆盖表对不上（${found.length} 条）：\n  ${found.join('\n  ')}`)
    process.exit(1)
  }
  const text = render(map, cards)
  if (process.argv.includes('--check')) {
    if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== text) {
      console.error('coverage.md 与映射对不上，跑 pnpm --filter @katanaview/ui coverage 重新生成')
      process.exit(1)
    }
    console.log(`coverage.md 与映射一致（${cards.size} 张卡）`)
  } else {
    writeFileSync(OUT, text)
    console.log(`coverage.md 已生成（${cards.size} 张卡）`)
  }
}
