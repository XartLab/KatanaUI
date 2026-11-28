// SPDX-License-Identifier: MIT
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'

// 动效的三条规矩（kubai Vibe Design Tips 011，#251 批 B；写在文档站「基础 · 时长与动效」）：
// 1. 每一段 transition 都写曲线：不落到 CSS 默认的 ease。悬停、按下取 var(--dur-hover) var(--ease-hover)。
// 2. 退场动画（关键帧名 kc-*-out，与折叠收起 kc-accordion-up、kc-collapsible-up）用 var(--dur-exit) var(--ease-exit)，不用 linear：linear 只给在「跑」的东西（转圈、进度、呼吸）。
// 3. 不对 width / height / top / left（含 right、bottom、inset）做过渡：每帧重排。条长写 --fill 用 scale 画，位置用 translate；
//    确实要变尺寸的在 LAYOUT_ALLOW 里写原因，用不上的豁免也会红。
const THEME = fileURLToPath(new URL('./theme/', import.meta.url))
const files = existsSync(THEME) ? readdirSync(THEME).filter((f) => f.endsWith('.css')) : []
const read = (name: string) => readFileSync(join(THEME, name), 'utf8')

/** 逗号分隔，括号里的逗号不算。 */
function splitTop(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out.filter(Boolean)
}

const CURVE =
  /\b(?:ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)\b|cubic-bezier\(|steps\(|linear\(|var\(--ease-/
const hasCurve = (segment: string) => CURVE.test(segment.replace(/var\(--dur[^)]*\)/g, ''))

type Segment = { file: string; line: number; text: string; property: string }
function transitionSegments(): Segment[] {
  return files.flatMap((file) => {
    const text = read(file)
    return [...text.matchAll(/(?:^|[\s;{])transition:\s*([^;}]+);/g)].flatMap((m) => {
      const line = text.slice(0, m.index).split('\n').length + (m[0].startsWith('\n') ? 1 : 0)
      return splitTop(m[1]!).map((segment) => ({ file, line, text: segment, property: segment.split(/\s+/)[0]! }))
    })
  })
}

const LAYOUT =
  /^(?:width|height|top|left|right|bottom|inset|min-width|max-width|min-height|max-height|margin|padding|flex-basis)$/

/** 确实要变尺寸、转成 transform 会走样的过渡。每条写原因；加之前先想能不能用 scale / translate / clip-path。 */
const LAYOUT_ALLOW: { file: string; property: string; reason: string }[] = [
  {
    file: 'motion.css',
    property: 'width',
    reason: 'tabs-pill：底块的宽随页签文字变，圆角 scale 会走样；位置已走 translate，只有宽留着，页签条很短、不高频',
  },
  {
    file: 'motion.css',
    property: 'height',
    reason:
      'Accordion 的折叠：高度在 0 与内容高度（UI SDK 量好的 --accordion-panel-height）之间过渡，内容是文字，scale 会拉伸；低频，用户点开才变',
  },
  {
    file: 'workspace-tabs.css',
    property: 'left',
    reason: '工作台标签的滑块：位置与宽度由量到的页签位置写在行内，随布局变；低频',
  },
  { file: 'workspace-tabs.css', property: 'width', reason: '同上' },
  {
    file: 'sui-motion.css',
    property: 'width',
    reason:
      'NavigationMenu 的视口：宽高跟着当前内容变（Radix 量出来写进变量），内容是文字，scale 会拉伸；低频，用户点开才变；滚动条悬停加宽 6px 也在这条',
  },
  { file: 'sui-motion.css', property: 'height', reason: '同上；滚动条悬停加宽 / 加高一档（6px），1 帧级别的小变化' },
  {
    file: 'motion.css',
    property: 'height',
    reason:
      'Accordion 折叠：高度在 0 与内容高度（UI SDK 量出来写进 --accordion-panel-height）之间过渡，内容是文字与任意子件，scale 会拉伸；用户点标题才发生，低频，写法同 Collapsible（sui-motion.css）',
  },
  {
    file: 'form-motion.css',
    property: 'width',
    reason: 'Button dot-morph：悬停时圆点拉成竖条，高度读 Radix 量的内容高；只在悬停的按钮上、一个点',
  },
  { file: 'form-motion.css', property: 'height', reason: '同上' },
  {
    file: 'treemap.css',
    property: 'left',
    reason: 'Treemap 重排：格子的位置与尺寸由布局算法算出，格里有文字，scale 会拉伸；用户切维度时才发生，非行情逐笔',
  },
  { file: 'treemap.css', property: 'top', reason: '同上' },
  { file: 'treemap.css', property: 'width', reason: '同上' },
  { file: 'treemap.css', property: 'height', reason: '同上' },
  {
    file: 'market-heatmap.css',
    property: 'left',
    reason: 'MarketHeatmap 的格子：位置与尺寸来自 treemap 布局，格里有文字；切分组时才动',
  },
  { file: 'market-heatmap.css', property: 'top', reason: '同上' },
  {
    file: 'symbol-galaxy.css',
    property: 'left',
    reason: 'SymbolGalaxy：星点位置来自布局，切分组时点平滑迁移；点是圆，换成 translate 要重写定位，待另开票',
  },
  { file: 'symbol-galaxy.css', property: 'top', reason: '同上' },
  {
    file: 'attribution-bars.css',
    property: 'left',
    reason: 'AttributionBars 的零轴条带点阵纹理（k-dotfill），scale 会把点拉伸；clip-path 又会让 e2e 量不到条长，待定',
  },
  { file: 'attribution-bars.css', property: 'width', reason: '同上' },
]

describe('动效只读 token', () => {
  it('扫到了文件与过渡', () => {
    expect(files.length).toBeGreaterThan(50)
    expect(transitionSegments().length).toBeGreaterThan(100)
  })

  it('检查本身会红：没写曲线的、退场写 linear 的认得出', () => {
    expect(hasCurve('color 0.12s')).toBe(false)
    expect(hasCurve('opacity var(--dur-hover)')).toBe(false)
    expect(hasCurve('color var(--dur-hover) var(--ease-hover)')).toBe(true)
    expect(hasCurve('opacity 160ms ease-out')).toBe(true)
    expect(hasCurve('translate var(--dur-snappy) var(--ease-snappy)')).toBe(true)
    expect(splitTop('a 1s linear(0, 1), b 2s').length).toBe(2)
  })

  it('每一段 transition 都写了曲线', () => {
    const bad = transitionSegments()
      .filter((s) => !hasCurve(s.text))
      .map((s) => `${s.file}:${s.line}  ${s.text}`)
    expect(bad).toEqual([])
  })

  it('退场动画（kc-*-out、折叠收起）用 --ease-exit，不用 linear', () => {
    const bad = files.flatMap((file) =>
      read(file)
        .split('\n')
        .map((line, i) => ({ line, no: i + 1 }))
        .filter(
          ({ line }) =>
            /animation:\s*(?:kc-[a-z-]*-out|kc-(?:accordion|collapsible)-up)\b/.test(line) &&
            !line.includes('var(--ease-exit)'),
        )
        .map(({ line, no }) => `${file}:${no}  ${line.trim()}`),
    )
    expect(bad).toEqual([])
  })

  it('不对 width / height / top / left 做过渡（豁免都写了原因）', () => {
    const hits = transitionSegments().filter((s) => LAYOUT.test(s.property))
    const unlisted = hits
      .filter((s) => !LAYOUT_ALLOW.some((a) => a.file === s.file && a.property === s.property))
      .map((s) => `${s.file}:${s.line}  ${s.text}`)
    expect(unlisted).toEqual([])
    const stale = LAYOUT_ALLOW.filter((a) => !hits.some((s) => s.file === a.file && s.property === a.property))
    expect(stale).toEqual([])
    expect(LAYOUT_ALLOW.every((a) => a.reason.trim() !== '')).toBe(true)
  })
})
