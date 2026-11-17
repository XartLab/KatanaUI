// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-approval（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// Agent 动手之前摆出来的一张卡：要人拍板的问题、事实表（标的、方向、数量、理由）、几个选项。
// 选中不是勾一个单选钮：选中的那一项展开铺满卡片，其余的收没了——决定要看起来跟它一样不可撤，把被否的选项灰着留在那里等于邀请人再看一眼已经发生的事。
// 我们加的：选项可以要求「按住确认」（hold）。AI 建议下单这种高风险动作，不能一次点击就批；hold 的选项画成我们的 HoldToConfirm，按住填满才算批。
// 相对原件：问题、事实标签、按钮字全由调用方传；选项按钮用我们的 Button；颜色走 token；弹簧取 snappy；去掉 reduced-motion 分支。
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { HoldToConfirm } from '../patterns/hold-to-confirm.tsx'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/** 选项逐个错开 30ms 进场（原件 CHOICE_STAGGER）。 */
const CHOICE_STAGGER = 0.03

export type AiApprovalFact = {
  label: string
  value: ReactNode
  /** 数值的语气：买入类动作用 up、卖出类用 down（读 --pnl-up / --pnl-down，跟着涨跌习惯互换）；不给是中性。 */
  tone?: 'up' | 'down'
}

export type AiApprovalOption = {
  id: string
  label: string
  /** 标签下面或右侧的小注。 */
  detail?: string
  /** 破坏性的那一项（红）。 */
  destructive?: boolean
  /** 主选项（实心）。 */
  primary?: boolean
  /** 要按住才批：给了它，这一项画成 HoldToConfirm；hint 是读屏与悬停提示，如「按住 2 秒确认」。 */
  hold?: { hint: string; confirmedLabel?: string }
}

export type AiApprovalProps = {
  /** What the agent needs a human to settle. */
  question: string
  /** The options; the first is shown first. */
  options: readonly AiApprovalOption[]
  /** Key facts of the action, shown as a label / value table (symbol, side, quantity …). */
  facts?: readonly AiApprovalFact[]
  /** Extra context under the question, such as the model's reason. */
  children?: ReactNode
  /** Called once with the chosen option. */
  onDecide?: (option: AiApprovalOption) => void
  /** Render already resolved, e.g. when replaying a transcript. */
  resolvedId?: string
  /** Extra class name on the root. */
  className?: string
}

export function AiApproval({ question, options, facts, children, onDecide, resolvedId, className }: AiApprovalProps) {
  const [chosenId, setChosenId] = useState<string | null>(resolvedId ?? null)
  const chosen = options.find((option) => option.id === chosenId) ?? null
  const decide = (option: AiApprovalOption) => {
    if (chosenId) return
    setChosenId(option.id)
    onDecide?.(option)
  }
  return (
    <motion.div
      layout
      data-slot="ai-approval"
      data-resolved={chosen?.id}
      transition={unit(snappy)}
      className={cn('w-full rounded-[var(--radius-overlay)] border border-line bg-surface-1 p-3.5', className)}
    >
      <motion.div layout="position" transition={unit(snappy)}>
        <p className="k-text-data m-0 font-semibold text-ink" data-slot="ai-approval-question">
          {question}
        </p>
        {facts?.length ? (
          <dl
            data-slot="ai-approval-facts"
            className="k-text-data m-0 mt-2.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1"
          >
            {facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="m-0 text-ink-3">{fact.label}</dt>
                <dd
                  className={cn(
                    'm-0 text-ink tabular-nums',
                    fact.tone === 'up' && 'text-(color:--pnl-up)',
                    fact.tone === 'down' && 'text-(color:--pnl-down)',
                  )}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children ? <div className="k-text-caption mt-2 leading-relaxed text-ink-3">{children}</div> : null}
      </motion.div>
      <div className="mt-3" role="group" aria-label={question}>
        <AnimatePresence initial={false} mode="popLayout">
          {chosen ? (
            <motion.div
              key="resolved"
              role="status"
              data-slot="ai-approval-resolved"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={unit(snappy)}
              className={cn(
                'k-text-data flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2',
                chosen.destructive
                  ? 'bg-[color-mix(in_srgb,var(--signal-red)_12%,transparent)] text-(color:--signal-red)'
                  : 'bg-surface-4 text-ink',
              )}
            >
              <Check aria-hidden="true" size={14} />
              <span className="font-semibold">{chosen.label}</span>
              {chosen.detail ? <span className="k-text-caption ml-auto opacity-70">{chosen.detail}</span> : null}
            </motion.div>
          ) : (
            <motion.div
              key="options"
              className="flex flex-col gap-1.5"
              exit={{ opacity: 0, scale: 0.98 }}
              transition={unit(snappy)}
            >
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...unit(snappy), delay: index * CHOICE_STAGGER }}
                  className="flex flex-col gap-1"
                >
                  {option.hold ? (
                    <HoldToConfirm
                      labels={{ hint: option.hold.hint, confirmed: option.hold.confirmedLabel }}
                      tone={option.destructive ? 'danger' : 'default'}
                      onConfirm={() => decide(option)}
                      className="w-full"
                    >
                      {option.label}
                    </HoldToConfirm>
                  ) : (
                    <Button
                      type="button"
                      variant={option.destructive ? 'danger' : option.primary ? 'primary' : 'default'}
                      data-slot="ai-approval-option"
                      onClick={() => decide(option)}
                      className="w-full"
                    >
                      {option.label}
                    </Button>
                  )}
                  {option.detail ? <span className="k-text-caption px-1 text-ink-3">{option.detail}</span> : null}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
