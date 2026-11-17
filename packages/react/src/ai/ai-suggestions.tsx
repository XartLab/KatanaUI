// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-suggestions（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 提示词建议的药丸：对话的空态与回答后的追问一行。进场要像「出现」而不是「通知」：从中间向两边错开，
// 而不是从左扫到右——从左扫到右暗示阅读顺序与优先级，这些是同等分量的备选，从中间散开才这么说。
// 相对原件：标题由调用方传；按钮用我们的 Button（药丸圆角）；弹簧取 snappy；去掉 reduced-motion 分支。
import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/** 离中心每远一格晚 45ms（原件 STAGGER_SECONDS）。 */
const STAGGER_SECONDS = 0.045

export type AiSuggestion = {
  id: string
  label: string
}

/** 每个下标离整行中点的距离：中间 0，往两边递增，用来排进场的先后。 */
export function centreOutOrder(count: number): number[] {
  const middle = (count - 1) / 2
  return Array.from({ length: count }, (_, index) => Math.abs(index - middle))
}

export type AiSuggestionsProps = {
  /** The chips. */
  suggestions: readonly AiSuggestion[]
  /** Called with the chosen suggestion. */
  onSelect?: (suggestion: AiSuggestion) => void
  /** Optional heading, such as "Follow-ups". */
  label?: string
  /** Extra class name on the root. */
  className?: string
}

export function AiSuggestions({ suggestions, onSelect, label, className }: AiSuggestionsProps) {
  const delays = useMemo(() => centreOutOrder(suggestions.length), [suggestions.length])
  return (
    <div data-slot="ai-suggestions" className={cn('flex w-full flex-col gap-2', className)}>
      {label ? <p className="k-text-micro m-0 text-ink-3 uppercase">{label}</p> : null}
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        <AnimatePresence initial>
          {suggestions.map((suggestion, index) => (
            <motion.li
              key={suggestion.id}
              layout
              initial={{ opacity: 0, scale: 0.94, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ ...unit(snappy), delay: (delays[index] ?? 0) * STAGGER_SECONDS }}
            >
              <Button
                type="button"
                data-slot="ai-suggestion"
                className="h-auto rounded-full px-3 py-1.5 font-normal"
                onClick={() => onSelect?.(suggestion)}
              >
                {suggestion.label}
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
