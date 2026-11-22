// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-branch（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 对话分支：同一个问题重答出来的几个版本，用「上一个 / 下一个」翻。复合件：AiBranch（容器）、AiBranchMessages（各分支的内容）、
// AiBranchSelector（翻页条）、AiBranchPrevious / AiBranchNext（两个钮）、AiBranchPage（第几个，共几个）。
// 相对原件：不搬 LegacyAiBranch（旧的整块写法，原件自己标成兼容）；上一个 / 下一个的读屏名与页码文字改成由调用方传；
// 分支数由 AiBranchMessages 的子元素个数给出（原件把整组子元素塞进 state，这里只存个数）；只渲染当前分支，换分支时淡入上移（弹簧取 snappy）；去掉 reduced-motion 分支。
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Children, createContext, useContext, useEffect, useState, type HTMLAttributes, type ReactNode } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

type BranchContext = {
  current: number
  total: number
  setTotal: (total: number) => void
  goTo: (index: number) => void
}
const Context = createContext<BranchContext | null>(null)
function useBranch(): BranchContext {
  const value = useContext(Context)
  if (!value) throw new Error('AiBranch 的子件要放在 AiBranch 里')
  return value
}

export type AiBranchProps = HTMLAttributes<HTMLDivElement> & {
  /** Index of the branch shown first. */
  defaultBranch?: number
  /** Called with the new index whenever the reader changes branch. */
  onBranchChange?: (index: number) => void
}

export function AiBranch({ defaultBranch = 0, onBranchChange, className, ...props }: AiBranchProps) {
  const [current, setCurrent] = useState(defaultBranch)
  const [total, setTotal] = useState(0)
  const goTo = (index: number) => {
    setCurrent(index)
    onBranchChange?.(index)
  }
  return (
    <Context.Provider value={{ current, total, setTotal, goTo }}>
      <div data-slot="ai-branch" className={cn('grid w-full gap-2', className)} {...props} />
    </Context.Provider>
  )
}

export type AiBranchMessagesProps = {
  /** One child per branch. */
  children: ReactNode
}

export function AiBranchMessages({ children }: AiBranchMessagesProps) {
  const { current, total, setTotal } = useBranch()
  const branches = Children.toArray(children)
  // 分支数变了才同步给翻页条（在 effect 里调：渲染中更新父级的 state 会报错）。
  const count = branches.length
  useEffect(() => {
    if (count !== total) setTotal(count)
  }, [count, total, setTotal])
  const shown = Math.min(Math.max(current, 0), Math.max(branches.length - 1, 0))
  return (
    <motion.div
      // 换分支就换 key：新分支从下面淡入上来。
      key={shown}
      data-slot="ai-branch-messages"
      data-branch={shown}
      className="grid gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={unit(snappy)}
    >
      {branches[shown]}
    </motion.div>
  )
}

export type AiBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  /** Which side the bar sits on, matching the message it belongs to. */
  from: 'user' | 'assistant'
}

export function AiBranchSelector({ from, className, ...props }: AiBranchSelectorProps) {
  const { total } = useBranch()
  // 只有一个分支就没有可翻的，不画。
  if (total <= 1) return null
  return (
    <div
      data-slot="ai-branch-selector"
      className={cn(
        'flex items-center gap-2 self-end px-10',
        from === 'assistant' ? 'justify-start' : 'justify-end',
        className,
      )}
      {...props}
    />
  )
}

type StepProps = {
  /** Accessible name of the button (required). */
  label: string
  /** Replaces the default chevron. */
  children?: ReactNode
  /** Extra class name. */
  className?: string
}

export function AiBranchPrevious({ label, children, className }: StepProps) {
  const { current, total, goTo } = useBranch()
  return (
    <Button
      type="button"
      variant="icon"
      size="icon"
      data-slot="ai-branch-previous"
      aria-label={label}
      disabled={total <= 1}
      className={cn('size-7 rounded-full', className)}
      onClick={() => goTo(current > 0 ? current - 1 : total - 1)}
    >
      {children ?? <ChevronLeft aria-hidden="true" size={14} />}
    </Button>
  )
}

export function AiBranchNext({ label, children, className }: StepProps) {
  const { current, total, goTo } = useBranch()
  return (
    <Button
      type="button"
      variant="icon"
      size="icon"
      data-slot="ai-branch-next"
      aria-label={label}
      disabled={total <= 1}
      className={cn('size-7 rounded-full', className)}
      onClick={() => goTo(current < total - 1 ? current + 1 : 0)}
    >
      {children ?? <ChevronRight aria-hidden="true" size={14} />}
    </Button>
  )
}

export type AiBranchPageProps = {
  /** Writes the page text from the 1-based position and the total, such as `(n, total) => \`${n} / ${total}\``. */
  format: (position: number, total: number) => string
  /** Extra class name. */
  className?: string
}

export function AiBranchPage({ format, className }: AiBranchPageProps) {
  const { current, total } = useBranch()
  return (
    <span
      role="status"
      data-slot="ai-branch-page"
      className={cn('k-text-caption font-semibold text-ink-3 tabular-nums', className)}
    >
      {format(Math.min(current, Math.max(total - 1, 0)) + 1, total)}
    </span>
  )
}
