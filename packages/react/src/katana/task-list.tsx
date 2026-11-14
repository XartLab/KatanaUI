// SPDX-License-Identifier: MIT
// 任务清单：点一行打勾，圆圈填上强调色、对勾一笔画出来，文字被一道线划掉；划完之后这一行沉到清单底部，其余的行弹簧补上空位。再点一下取消，回到原来的位置。
// 用于 Agent 的计划与任务。交互学自 rare-ui 的 task-list（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 打勾分三段按顺序走：圆圈填色加对勾 → 划线（线画在文字自己的背景上，所以折行的文字每行一道线）→ 沉底；
// ② 沉底要等划线放完才开始，不是一点就跳；③ 取消勾是倒着走：线先收、对勾再收、再回到原位；④ 每行是 role=checkbox 的按钮，
// 整行都能点；⑤ 屏外有一个 role=status 的区，勾上、取消时播报「某某已完成 / 已重开」；⑥ 可受控也可不受控。
// 我们的做法：划线与对勾用 motion 的弹簧，沉底用 layout 动画；没有它那套逐段的阶段状态机，只记「划完了」这一件事。
import { motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

export type Task = {
  id: string
  label: string
  done?: boolean
}

export type TaskListLabels = {
  /** 勾上后读屏播报，如「<label> 已完成」。 */
  completed: (label: string) => string
  /** 取消勾后读屏播报。 */
  reopened: (label: string) => string
}

/**
 * 清单的显示次序：没完成的在前、保持原次序；已「划完」的（parked 里的）沉到后面，按沉下去的先后排。
 * 勾上但线还没划完的行仍留在原位。parked 里有、但现在已不是完成的（被外面改了）或已经不存在的，当作没沉。
 */
export function orderTasks(tasks: readonly Task[], parked: readonly string[]): Task[] {
  const sunk = parked
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => task?.done === true)
  return [...tasks.filter((task) => !sunk.includes(task)), ...sunk]
}

function Mark({ done }: { done: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 flex-none" data-slot="task-list-mark">
      <circle cx={12} cy={12} r={9.5} fill="none" stroke="var(--ink-400)" strokeWidth={2} />
      <motion.circle
        cx={12}
        cy={12}
        r={9.5}
        fill="var(--signal-orange)"
        style={{ transformBox: 'view-box', transformOrigin: '12px 12px' }}
        initial={false}
        animate={{ scale: done ? 1 : 0 }}
        transition={unit(snappy)}
      />
      <motion.path
        d="M7.6 12.6 10.6 15.4 16.4 9"
        fill="none"
        stroke="var(--bg-000)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={unit(snappy)}
      />
    </svg>
  )
}

function TaskRow({
  task,
  onToggle,
  onStruck,
}: {
  task: Task
  onToggle: (done: boolean) => void
  /** 划线放完（勾上时）：清单据此把这一行沉底。 */
  onStruck: () => void
}) {
  const done = task.done === true
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      data-slot="task-list-item"
      data-task-id={task.id}
      data-state={done ? 'checked' : 'unchecked'}
      onClick={() => onToggle(!done)}
      className={cn(
        'flex w-full cursor-pointer items-start gap-2.5 rounded-[var(--radius-control)] border border-line bg-surface-2 px-3 py-2 text-left',
        'transition-colors duration-[120ms] hover:bg-surface-3 active:bg-surface-3',
        focusRing,
      )}
    >
      <Mark done={done} />
      <span className="k-text-body min-w-0 flex-1 leading-5">
        <motion.span
          data-slot="task-list-label"
          className={cn('transition-colors duration-[200ms]', done ? 'text-ink-3' : 'text-ink')}
          style={{
            backgroundImage: 'linear-gradient(currentColor, currentColor)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0 55%',
            // 折行的文字每一行各画一道线，而不是把整段当一个盒子只在最后一行画。
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
          initial={false}
          animate={{ backgroundSize: `${done ? 100 : 0}% 1.5px` }}
          transition={snappy}
          onAnimationComplete={() => {
            if (done) onStruck()
          }}
        >
          {task.label}
        </motion.span>
      </span>
    </button>
  )
}

export type TaskListProps = {
  tasks?: readonly Task[]
  defaultTasks?: readonly Task[]
  onTasksChange?: (tasks: Task[]) => void
  labels: TaskListLabels
  /** 清单的读屏名。 */
  label?: string
  className?: string
}

export function TaskList({ tasks, defaultTasks = [], onTasksChange, labels, label, className }: TaskListProps) {
  const [inner, setInner] = useState<readonly Task[]>(defaultTasks)
  const current = tasks ?? inner
  const [parked, setParked] = useState<string[]>(() => current.filter((task) => task.done).map((task) => task.id))
  const [announcement, setAnnouncement] = useState('')

  const toggle = (task: Task, done: boolean) => {
    const next = current.map((item) => (item.id === task.id ? { ...item, done } : item))
    if (tasks === undefined) setInner(next)
    onTasksChange?.(next)
    setAnnouncement(done ? labels.completed(task.label) : labels.reopened(task.label))
    // 取消勾：立刻回到原位，不等动画。
    if (!done) setParked((ids) => ids.filter((id) => id !== task.id))
  }

  return (
    <ul
      data-slot="task-list"
      aria-label={label}
      className={cn('flex w-full max-w-md flex-col gap-1.5 p-0', className)}
      style={{ listStyle: 'none', margin: 0 }}
    >
      {orderTasks(current, parked).map((task) => (
        <motion.li key={task.id} layout="position" transition={snappy} className="m-0 list-none p-0">
          <TaskRow
            task={task}
            onToggle={(done) => toggle(task, done)}
            onStruck={() => setParked((ids) => (ids.includes(task.id) ? ids : [...ids, task.id]))}
          />
        </motion.li>
      ))}
      {/* li 的角色改成 status 会让 ul 的子元素不是 listitem（axe list 规则）：li 留着，播报放进里面的 span。 */}
      <li className="sr-only">
        <span role="status" aria-live="polite">
          {announcement}
        </span>
      </li>
    </ul>
  )
}
