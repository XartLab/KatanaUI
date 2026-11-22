// SPDX-License-Identifier: MIT
/**
 * Cell renderers of DataGrid: the default cell body and the live flashing cell.
 * DataGrid 的格子（体检 §7 从 data-grid.tsx 拆出）：默认格子内容、实时模式下值变了闪涨跌色的数值格。
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useValueFlash } from '../../lib/live.ts'
import { LimitStatus } from '../../cn/limit-status.tsx'
import { StreakBadge } from '../../cn/streak-badge.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { ToneText } from '../../quotes/tone-text.tsx'
import { barRatio, type ResolvedCell } from './columns.ts'

/** 数值类的列才闪：文本、时间、买卖、品种变了不闪（闪色只表达涨跌）。 */
export const FLASH_TYPES: ReadonlySet<string> = new Set(['number', 'price', 'quantity', 'pnl', 'change'])

/** 一个数值格：值变了闪涨跌色（共用层 useValueFlash，1 秒节流）；格子是定位与滚动的最小单元，key 换掉让 CSS 动画重放。 */
export function FlashCell({
  value,
  className,
  children,
  ...rest
}: {
  value: number | null
  className: string
  children: ReactNode
  role: string
  style: CSSProperties
  title: string | undefined
  'data-col': string
  'data-type': string
  'data-heat'?: string
}) {
  const { flash, key } = useValueFlash(value)
  return (
    <div key={key} {...rest} className={cn(className, 'k-live-flash')} data-flash={flash ?? undefined}>
      {children}
    </div>
  )
}

/** 一格里的内容：品种拆成代码加场所，有方向的类型（盈亏、涨跌幅、买卖）用 ToneText 跟 data-updown，别的直接写字。 */
export function CellBody({
  resolved,
  extent,
  ellipsis,
  maxPills,
}: {
  resolved: ResolvedCell
  extent: number
  /** 纯文字写进 .k-grid-name，超长时省略号截断（cell 是 flex，文字本身不出省略号）。 */
  ellipsis?: boolean
  maxPills?: number
}) {
  if (resolved.pills) return <PillCell pills={resolved.pills} max={maxPills} />
  if (resolved.streak) {
    const { value, form, labels } = resolved.streak
    return <StreakBadge streak={value} form={form} labels={labels} />
  }
  if (resolved.limitStatus) {
    return <LimitStatus status={resolved.limitStatus.value} labels={resolved.limitStatus.labels} />
  }
  if (resolved.progress) {
    const { done, total, ratio } = resolved.progress
    return (
      <>
        <span className="k-grid-progress-text">
          {done}/{total}
        </span>
        <span className="k-grid-progress" data-slot="grid-progress" aria-hidden="true">
          {ratio !== undefined && <i style={{ width: `${ratio * 100}%` }} />}
        </span>
      </>
    )
  }
  if (resolved.bar !== undefined) {
    const ratio = barRatio(resolved.bar, extent)
    return (
      <>
        <span className="k-grid-bar" data-slot="grid-bar" data-dir={ratio > 0 ? 'up' : ratio < 0 ? 'down' : 'flat'}>
          <i style={{ width: `${Math.abs(ratio) * 50}%`, [ratio < 0 ? 'right' : 'left']: '50%' }} />
        </span>
        <span className="k-grid-bar-text">{resolved.text}</span>
      </>
    )
  }
  if (resolved.symbol) {
    return (
      <>
        {resolved.symbol.icon && (
          <SymbolMark
            symbol={resolved.symbol.code}
            name={resolved.symbol.name}
            src={resolved.symbol.icon.src}
            size={16}
          />
        )}
        <span className="k-grid-name">{resolved.symbol.code}</span>
        {resolved.symbol.venue && <span className="k-grid-tag">{resolved.symbol.venue}</span>}
      </>
    )
  }
  if (resolved.direction !== undefined) return <ToneText tone={resolved.direction}>{resolved.text}</ToneText>
  return ellipsis ? <span className="k-grid-name">{resolved.text}</span> : resolved.text
}

/** 胶囊的「+n」预留的宽度（px）与胶囊之间的间距，跟 data-grid.css 的 .k-grid-pill 一致。 */
const PILL_MORE_WIDTH = 32
const PILL_GAP = 4

/**
 * pill 列的一格：多枚短标签排成一行，装不下的收成「+n」（悬停的 title 写全部）。
 * 先按 maxPills 截（服务端渲染与首帧就是这个数），挂载后量每枚的宽，按格子宽度再往下收；格子变宽变窄时重算。
 */
function PillCell({ pills, max }: { pills: NonNullable<ResolvedCell['pills']>; max?: number }) {
  const box = useRef<HTMLSpanElement | null>(null)
  const cap = Math.min(pills.length, max ?? pills.length)
  const [fit, setFit] = useState(cap)
  const key = pills.map((pill) => pill.label).join('\u0000')
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-pill]'))
      const widths = nodes.map((node) => {
        const was = node.hidden
        node.hidden = false
        const width = node.offsetWidth
        node.hidden = was
        return width
      })
      const room = el.clientWidth
      const total = widths.length
      let count = 0
      for (let k = Math.min(cap, total); k >= 0; k--) {
        const used = widths.slice(0, k).reduce((sum, width) => sum + width, 0) + Math.max(0, k - 1) * PILL_GAP
        const more = k < total ? (k > 0 ? PILL_GAP : 0) + PILL_MORE_WIDTH : 0
        if (used + more <= room) {
          count = k
          break
        }
      }
      setFit(room > 0 ? count : cap)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [key, cap])
  const shown = Math.min(fit, cap)
  const rest = pills.length - shown
  return (
    <span ref={box} className="k-grid-pills" data-slot="grid-pills">
      {pills.map((pill, i) => (
        <span key={`${i}-${pill.label}`} className="k-grid-pill" data-pill="" data-tone={pill.tone} hidden={i >= shown}>
          {pill.label}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="k-grid-pill k-grid-pill-more"
          data-slot="grid-pill-more"
          title={pills.map((pill) => pill.label).join(' · ')}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}

/** 行快捷按钮条贴在行尾；表横向滚开时行尾在可视区外，把滚出去的那段宽度写成变量让条往里挪（theme/row-actions.css 读它）。 */
export function keepActionsInView(scroll: HTMLElement) {
  scroll.style.setProperty(
    '--k-grid-hidden-right',
    `${Math.max(0, scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft)}px`,
  )
}
