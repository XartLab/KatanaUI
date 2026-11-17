// SPDX-License-Identifier: MIT
import { Ellipsis } from 'lucide-react'
import { isValidElement, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { ReadoutFlash, parseReadout } from '../../lib/live-readout.tsx'
import { useStatusFlash } from '../../lib/live.ts'
import { fontFor, measureText } from '../../lib/text-measure.ts'
import { Led, type LedState } from '../../katana/led.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover.tsx'
import { collapsedItems } from './status-bar-model.ts'

// 状态栏（#1901）：一排分段（segment），左 / 中 / 右三段，每段一组项；项由数据声明，不在组件里写死「QUOTE · EXEC · ALICE」。
// 组件卡 StatusBar：分段模型参考 oh-my-posh（MIT）、上下文显隐参考 Starship（ISC），只取结构，不引代码（2026-11-14 读组件卡）。
// 项：LED（可选）· 键名（点阵、灰）· 值（等宽、亮）；可点的项是按钮；实盘这类 `live` 项有琥珀内描边且不可收起。
// 宽度不够时按优先级收起：先收优先级最低的，收起的项进右端的「…」弹层；pinned 的项永远留在条上。
// 实时刷新：数值（延迟、时钟）变了闪涨跌色；灯的状态或非数值的文字变了（断线、重连）在整项上盖一层一次性的闪：变坏（警告、危险）警示色，变好涨色。
// 没做：模板语法与主题 JSON（{{led}}、hideWhen）——「无事则隐藏」由宿主给数据时省掉那一项（`hidden`）；右键编辑主题是产品决定，留给宿主。

export type StatusItem = {
  id: string
  /** 键名（点阵字体，灰），如 QUOTE。 */
  label?: string
  /** 值（等宽，亮）。 */
  value?: ReactNode
  /** 前面的状态灯；给了就必须给 ledLabel。LED 只表达真实状态，发光体预算整条栏不超过两盏（组件卡）。 */
  led?: LedState
  ledLabel?: string
  /** 点击：整项是个按钮（QUOTE → 数据源……）。不给就是纯读数。 */
  onClick?: () => void
  /** 悬停提示。 */
  title?: string
  /** 越大越晚被收起，默认 0。 */
  priority?: number
  /** 永不收起（安全语义的项）。 */
  pinned?: boolean
  /** 实盘账户这类项：琥珀内描边，也不收起。 */
  live?: boolean
  /** 隐藏（宿主的「无事则隐藏」规则算出来的结果），隐藏的项不占位、不量。 */
  hidden?: boolean
}

export type StatusBarProps = {
  left?: readonly StatusItem[]
  center?: readonly StatusItem[]
  right?: readonly StatusItem[]
  /** 状态栏的名字（读屏念）。 */
  label: string
  /** 「…」按钮的名字（读屏念）。 */
  moreLabel: string
  className?: string
}

const MORE_WIDTH = 28

// 项的固定宽（px），来源 theme/status-bar.css：左 padding 14、右 padding 10（第 35 行）、子元素 gap 6（第 32 行）；LED 8px（theme/led.css 第 7–8 行）。
// 键名 --text-tag-md（500 12px）--font-num、字距 --text-tag-md-tracking 0.08em 且大写（第 61–63 行）；值 12px --font-num（第 66 行，字重 400）。
// 字号字重随根节点的 --k-text-scale / --k-weight-adjust（tokens.css 的 --text-tag-md 里 round(12px × scale)），这里同样读出来。
const ITEM_PADDING = 24
const ITEM_GAP = 6
const LED_WIDTH = 8
const KEY_TRACKING = 0.08

/** 值是 ReactNode：只数其中的文字（字符串、数字、元素里的子文字），量不了的节点按没有算。 */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

const rootNumber = (name: string, fallback: number) => {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

/** 一项排出来的宽度：用 pretext 按字体预先算，不渲染出来量。 */
function itemWidth(item: StatusItem): number {
  const scale = rootNumber('--k-text-scale', 1)
  const weight = 500 + rootNumber('--k-weight-adjust', 0)
  const parts: number[] = []
  if (item.led) parts.push(LED_WIDTH)
  if (item.label)
    parts.push(
      measureText(
        item.label.toUpperCase(),
        fontFor(weight, Math.round(12 * scale), '--font-num'),
        KEY_TRACKING * Math.round(12 * scale),
      ),
    )
  const value = item.value === undefined ? undefined : textOf(item.value)
  if (item.value !== undefined) parts.push(measureText(value!, fontFor(400, 12, '--font-num')))
  const gaps = Math.max(0, parts.length - 1) * ITEM_GAP
  return Math.ceil(parts.reduce((sum, w) => sum + w, 0)) + gaps + ITEM_PADDING
}

function Segment({ item }: { item: StatusItem }) {
  const text = item.value === undefined ? '' : textOf(item.value)
  const numeric = parseReadout(text) !== null
  // 状态 = 灯的状态加非数值的文字：「已连接」变「已断开」、灯 ok 变 danger 都算；数值的变化走 ReadoutFlash，不在这里。
  const status = useStatusFlash(`${item.led ?? ''}|${numeric ? '' : text}`)
  const bad = item.led === 'warn' || item.led === 'danger'
  const body = (
    <>
      {item.led && <Led state={item.led} label={item.ledLabel ?? ''} />}
      {item.label && <span className="k-status-key">{item.label}</span>}
      {item.value !== undefined && (
        <span className="k-status-value">
          {numeric && (typeof item.value === 'string' || typeof item.value === 'number') ? (
            <ReadoutFlash text={item.value} />
          ) : (
            item.value
          )}
        </span>
      )}
      {status.flash && (
        // 盖在整项上的一层，不换项自己的 key：项是按钮时换 key 会丢焦点。
        <i
          key={status.key}
          className={cn('k-status-flash', bad ? 'k-live-alert' : 'k-live-flash')}
          data-tone={item.led === 'danger' ? 'negative' : undefined}
          data-flash={bad ? undefined : 'up'}
          aria-hidden="true"
        />
      )}
    </>
  )
  const common = {
    'data-id': item.id,
    'data-live': item.live ? '' : undefined,
    title: item.title,
    className: 'k-status-item',
  }
  if (item.onClick)
    return (
      <button type="button" {...common} onClick={item.onClick}>
        {body}
      </button>
    )
  return <div {...common}>{body}</div>
}

export function StatusBar({ left = [], center = [], right = [], label, moreLabel, className }: StatusBarProps) {
  const groups = { left, center, right }
  const all = [...left, ...center, ...right].filter((item) => !item.hidden)
  const bar = useRef<HTMLDivElement>(null)
  const [folded, setFolded] = useState<readonly string[]>([])

  const fit = () => {
    const box = bar.current
    if (!box) return
    const available = box.clientWidth
    const next = collapsedItems(
      all.map((item) => ({
        id: item.id,
        width: itemWidth(item),
        priority: item.priority ?? 0,
        pinned: !!item.pinned || !!item.live,
      })),
      available,
      0,
      MORE_WIDTH,
    )
    setFolded((prev) => (prev.join('|') === next.join('|') ? prev : next))
  }
  // 每次渲染后量一遍（项是数据，变了就重算）；条自己变宽变窄时也量。
  const latestFit = useRef(fit)
  // 渲染后再换成最新的 fit：观察者回调里拿到的是最新数据，又不在渲染中写 ref
  useLayoutEffect(() => {
    latestFit.current = fit
    fit()
  })
  useLayoutEffect(() => {
    const box = bar.current
    if (!box) return
    const run = () => latestFit.current()
    const observer = new ResizeObserver(run)
    observer.observe(box)
    // Web 字体加载完字宽会变，预算宽度要跟着重算（text-measure 已先清缓存）
    document.fonts?.addEventListener?.('loadingdone', run)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener?.('loadingdone', run)
    }
    // fit 每次渲染都是新的，但只读 ref 与 all；观察者只需建一次，内容变化由上面的 useLayoutEffect 管
  }, [])

  const shown = (items: readonly StatusItem[]) => items.filter((item) => !item.hidden && !folded.includes(item.id))
  const hiddenItems = all.filter((item) => folded.includes(item.id))
  return (
    <div className={cn('k-status-bar', className)} role="group" aria-label={label} data-slot="status-bar" ref={bar}>
      {(['left', 'center', 'right'] as const).map((side) => (
        <div key={side} className="k-status-group" data-side={side}>
          {shown(groups[side]).map((item) => (
            <Segment key={item.id} item={item} />
          ))}
          {side === 'right' && hiddenItems.length > 0 && (
            <Popover>
              <PopoverTrigger className="k-status-more" aria-label={moreLabel}>
                <Ellipsis aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent variant="menu" side="top" align="end" className="k-status-pop">
                {hiddenItems.map((item) => (
                  <Segment key={item.id} item={item} />
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
      ))}
    </div>
  )
}
