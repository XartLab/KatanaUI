// SPDX-License-Identifier: MIT
// 改自 SmoothUI animated-tags（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 标签挑选：上面是「已选」，下面是「可选」，点一个标签它就飞到另一边（布局动画 + 模糊淡出淡入）。选自选分组、策略标签、板块关注。
// 与 ChipGroup 的分工：ChipGroup 是一排原地开关的筛选芯片（选中不换位置）；AnimatedTags 是把选中的拎出来单独放一处，适合要看清「我选了哪几个」。
// 与原件的差别：原件写死的「Selected Tags」「Remove x」「Add x」都改成 labels；已选区空着时显示 emptyLabel；弹簧同原件（bounce 0、0.25 秒）。
import { Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 弹簧参数来自 SmoothUI animated-tags：bounce 0、0.25 秒；进出的位移 20 像素、模糊 4 像素。
const SPRING = { type: 'spring' as const, bounce: 0, duration: 0.25 }
const SLIDE = 20
const BLUR = 'blur(4px)'

export type AnimatedTagsLabels = {
  /** Caption of the chosen area. */
  selected: string
  /** Caption of the area with the tags still to pick. */
  available: string
  /** Shown in the chosen area while it is empty. */
  empty: string
  /** Name of the button that removes a chosen tag, for example "Remove AI". */
  remove: (tag: string) => string
  /** Name of the button that adds a tag, for example "Add AI". */
  add: (tag: string) => string
}

export type AnimatedTagsProps = {
  /** Every tag that can be picked. */
  tags: readonly string[]
  /** Chosen tags (controlled); omit to let the component keep them. */
  selected?: readonly string[]
  /** Chosen tags at first render when uncontrolled. */
  defaultSelected?: readonly string[]
  /** Called with the chosen tags after every add or remove. */
  onChange?: (selected: string[]) => void
  /** All the text the picker needs; the package ships none. */
  labels: AnimatedTagsLabels
  /** Extra class name on the root. */
  className?: string
}

export function AnimatedTags({ tags, selected, defaultSelected = [], onChange, labels, className }: AnimatedTagsProps) {
  const [own, setOwn] = useState<string[]>([...defaultSelected])
  const chosen = selected ?? own
  const commit = (next: string[]) => {
    setOwn(next)
    onChange?.(next)
  }
  const rest = tags.filter((tag) => !chosen.includes(tag))
  const tagClass = cn(
    'k-text-data flex cursor-pointer items-center gap-(--space-2) rounded-[var(--radius-control)] border px-(--space-2) py-(--space-1) text-ink transition-colors duration-[var(--dur-snappy)] hover:bg-alpha-white-6',
    focusRing,
  )
  return (
    <div data-slot="animated-tags" className={cn('flex flex-col gap-(--space-4)', className)}>
      <div className="flex flex-col gap-(--space-1)">
        <span className="k-text-caption text-ink-3">{labels.selected}</span>
        <div
          data-slot="animated-tags-selected"
          className="flex min-h-12 flex-wrap items-center gap-(--space-1) k-mat-card p-(--space-2)"
        >
          <AnimatePresence initial={false}>
            {chosen.map((tag) => (
              <motion.button
                key={tag}
                layout
                type="button"
                aria-label={labels.remove(tag)}
                onClick={() => commit(chosen.filter((one) => one !== tag))}
                initial={{ opacity: 0, y: SLIDE, filter: BLUR }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: SLIDE, filter: BLUR }}
                transition={SPRING}
                className={cn(tagClass, 'border-line-strong bg-surface-3')}
              >
                {tag}
                <X aria-hidden="true" className="size-3.5 shrink-0 text-ink-3" />
              </motion.button>
            ))}
          </AnimatePresence>
          {chosen.length === 0 && <span className="k-text-caption px-(--space-1) text-ink-4">{labels.empty}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-(--space-1)">
        <span className="k-text-caption text-ink-3">{labels.available}</span>
        <div data-slot="animated-tags-available" className="flex flex-wrap items-center gap-(--space-1)">
          <AnimatePresence initial={false}>
            {rest.map((tag) => (
              <motion.button
                key={tag}
                layout
                type="button"
                aria-label={labels.add(tag)}
                onClick={() => commit([...chosen, tag])}
                initial={{ opacity: 0, y: -SLIDE, filter: BLUR }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -SLIDE, filter: BLUR }}
                transition={SPRING}
                className={cn(tagClass, 'border-line bg-transparent')}
              >
                {tag}
                <Plus aria-hidden="true" className="size-3.5 shrink-0 text-ink-3" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
