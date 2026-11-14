// SPDX-License-Identifier: MIT
import { Ellipsis } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Led, type LedState } from '../../katana/led.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover.tsx'
import { collapsedItems } from './status-bar-model.ts'

// 状态栏（#1901）：一排分段（segment），左 / 中 / 右三段，每段一组项；项由数据声明，不在组件里写死「QUOTE · EXEC · ALICE」。
// 组件卡 StatusBar：分段模型参考 oh-my-posh（MIT）、上下文显隐参考 Starship（ISC），只取结构，不引代码（2026-11-14 读组件卡）。
// 项：LED（可选）· 键名（点阵、灰）· 值（等宽、亮）；可点的项是按钮；实盘这类 `live` 项有琥珀内描边且不可收起。
// 宽度不够时按优先级收起：先收优先级最低的，收起的项进右端的「…」弹层；pinned 的项永远留在条上。
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

function Segment({ item, measure = false }: { item: StatusItem; measure?: boolean }) {
  const body = (
    <>
      {item.led && <Led state={item.led} label={item.ledLabel ?? ''} />}
      {item.label && <span className="k-status-key">{item.label}</span>}
      {item.value !== undefined && <span className="k-status-value">{item.value}</span>}
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
      <button type="button" {...common} onClick={item.onClick} tabIndex={measure ? -1 : undefined}>
        {body}
      </button>
    )
  return <div {...common}>{body}</div>
}

export function StatusBar({ left = [], center = [], right = [], label, moreLabel, className }: StatusBarProps) {
  const groups = { left, center, right }
  const all = [...left, ...center, ...right].filter((item) => !item.hidden)
  const bar = useRef<HTMLDivElement>(null)
  const ruler = useRef<HTMLDivElement>(null)
  const [folded, setFolded] = useState<readonly string[]>([])

  const fit = () => {
    const box = bar.current
    const rule = ruler.current
    if (!box || !rule) return
    const widths = new Map<string, number>()
    for (const node of rule.querySelectorAll<HTMLElement>('[data-id]')) widths.set(node.dataset.id!, node.offsetWidth)
    const available = box.clientWidth
    const next = collapsedItems(
      all.map((item) => ({
        id: item.id,
        width: widths.get(item.id) ?? 0,
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
  useLayoutEffect(fit)
  useLayoutEffect(() => {
    const box = bar.current
    if (!box) return
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
    // fit 每次渲染都是新的，但只读 ref 与 all；观察者只需建一次，内容变化由上面的 useLayoutEffect 管
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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
      {/* 量宽度用的影子：把所有没隐藏的项排成一行，读每项的自然宽度（收起的项也要知道能不能放回来）。 */}
      <div className="k-status-ruler" aria-hidden="true" ref={ruler} inert>
        {all.map((item) => (
          <Segment key={item.id} item={item} measure />
        ))}
      </div>
    </div>
  )
}
