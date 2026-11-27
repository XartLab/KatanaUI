// SPDX-License-Identifier: MIT
// 改自 SmoothUI expandable-cards（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 横排卡片，点一张它横向撑开、露出右边的详情，其余保持窄卡；再点收回。用于并排比较几个版本或方案（策略 v1 到 v4：窄卡是版本号与一个数，展开是改了什么）。
// 原件是图片卡（封面图 + 播放键 + 作者头像），换成「face 是窄卡的正面、detail 是展开出的右栏」两个槽，内容全由调用方放。
// 点整张卡正面用的是原件的 after 覆盖层做法（标题按钮的 ::after 铺满卡面，不用嵌套按钮）。展开的宽度与缓动照原件：200 到 500 · 0.25s · ease-out-quint，详情用模糊淡入。

/** 原件的缓出曲线（ease-out-quint）。 */
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const

export type ExpandableCard = {
  id: string
  /** Name on the card face; it is the button that opens the card. */
  title: string
  /** The rest of the narrow face, under the title. */
  face?: ReactNode
  /** The right-hand column shown when the card is open. */
  detail: ReactNode
}

export type ExpandableCardsProps = {
  /** The cards, in order. */
  cards: readonly ExpandableCard[]
  /** What screen readers call the row of cards (required). */
  label: string
  /** Id of the open card (controlled); null means none. */
  selected?: string | null
  /** Called with the id of the opened card, or null when closed. */
  onSelect?: (id: string | null) => void
  /** Width of a closed card in px. */
  collapsedWidth?: number
  /** Width of the open card in px. */
  expandedWidth?: number
  /** Height of every card in px. */
  height?: number
  /** Extra classes for the root element. */
  className?: string
}

export function ExpandableCards({
  cards,
  label,
  selected,
  onSelect,
  collapsedWidth = 180,
  expandedWidth = 460,
  height = 220,
  className,
}: ExpandableCardsProps) {
  const [inner, setInner] = useState<string | null>(null)
  const open = selected === undefined ? inner : selected
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = row.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  const toggle = (id: string) => {
    const next = open === id ? null : id
    setInner(next)
    onSelect?.(next)
    if (next)
      row.current
        ?.querySelector(`[data-card-id="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <div
      ref={row}
      role="group"
      aria-label={label}
      data-slot="expandable-cards"
      className={cn('flex w-full gap-3 overflow-x-auto py-2', className)}
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {cards.map((card) => {
        const isOpen = open === card.id
        return (
          <motion.div
            key={card.id}
            layout
            data-card-id={card.id}
            data-open={isOpen ? '' : undefined}
            animate={{ width: isOpen ? expandedWidth : collapsedWidth }}
            transition={{ duration: 0.25, ease: EASE_OUT_QUINT }}
            className="relative shrink-0 overflow-hidden rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-3"
            style={{ height, scrollSnapAlign: 'start' }}
          >
            <div className="relative flex h-full flex-col justify-between p-4" style={{ width: collapsedWidth }}>
              <h3 className="k-text-title m-0 text-ink">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(card.id)}
                  className={cn(
                    "cursor-pointer rounded-[var(--radius-sm)] text-left after:absolute after:inset-0 after:content-['']",
                    focusRing,
                  )}
                >
                  {card.title}
                </button>
              </h3>
              {card.face ? <div className="relative text-ink-3">{card.face}</div> : null}
            </div>
            <AnimatePresence mode="popLayout">
              {isOpen ? (
                <motion.div
                  key="detail"
                  initial={{ filter: 'blur(5px)', opacity: 0, width: 0 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, width: expandedWidth - collapsedWidth }}
                  exit={{ filter: 'blur(5px)', opacity: 0, width: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT_QUINT, opacity: { delay: 0.1, duration: 0.2 } }}
                  className="absolute top-0 right-0 h-full border-l border-line bg-surface-2"
                >
                  <motion.div
                    initial={{ filter: 'blur(5px)', opacity: 0, x: 20 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, x: 0 }}
                    exit={{ filter: 'blur(5px)', opacity: 0, x: 20 }}
                    transition={{ delay: 0.2, duration: 0.2, ease: EASE_OUT_QUINT }}
                    className="k-text-body h-full overflow-y-auto p-4 text-ink-2"
                  >
                    {card.detail}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
