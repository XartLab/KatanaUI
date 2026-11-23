// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-task-list（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// Agent 要走完的一份计划，只读：每一步是 排队 / 进行中 / 完成 / 失败，可带一层子步骤与右侧小注。
// 和我们已有的 TaskList（人来点的清单）是两回事，所以新建不并入：那个是读者勾，这个是 Agent 报进度，读者不能改。
// 要点：完成的行下沉 1px、淡一点，安静下来，让正在跑的那一行是唯一要注意的东西；进行中的行有一条流光下划线，一次只有一处在动（带子步骤的父行不画，它的活跃由正在跑的子步骤表达）。
// 相对原件：标题与各状态读屏词由调用方传；对勾 / 叉用 CSS 一次性画出（原件注明 motion 的 pathLength 在这里不可靠，同样改走关键帧）；颜色走 lib/severity.ts 的状态色与 --k-content-*；去掉 reduced-motion 分支。
import { motion } from 'motion/react'
import { Fragment } from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { statusColor } from '../lib/severity.ts'
import { unit } from '../lib/spring.ts'
import { taskProgress, type AiTask, type AiTaskStatus } from './ai-task-model.ts'

export type { AiTask, AiTaskStatus } from './ai-task-model.ts'

const BOX = 14
const CHECK_PATH = 'M 3.5 7.5 L 6 10 L 10.5 4.5'
const CROSS_PATH = 'M 5 5 L 9 9 M 9 5 L 5 9'

const BOX_STROKE: Readonly<Record<AiTaskStatus, string>> = {
  pending: 'var(--k-content-tertiary-foreground)',
  running: 'var(--k-content-body-foreground)',
  done: statusColor('ok'),
  failed: statusColor('danger'),
}

function TaskBox({ status }: { status: AiTaskStatus }) {
  const done = status === 'done'
  const failed = status === 'failed'
  return (
    <span aria-hidden="true" className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="size-3.5">
        {/* 描边与底色用 CSS 过渡：motion 在 var() 颜色之间插值不可靠。 */}
        <rect
          x={1}
          y={1}
          width={12}
          height={12}
          rx={3.5}
          strokeWidth={1.4}
          fill={failed ? statusColor('danger') : statusColor('ok')}
          className="transition-[stroke,fill-opacity] duration-[var(--dur-snappy)] ease-[var(--ease-snappy)]"
          style={{ fillOpacity: done ? 0.14 : 0, stroke: BOX_STROKE[status] }}
        />
        {/* 勾与叉是被画出来的：像是在打勾这个动作，而不是一个本来就在的状态。 */}
        {done ? (
          <path
            className="k-ai-draw"
            d={CHECK_PATH}
            fill="none"
            pathLength={1}
            stroke={statusColor('ok')}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
          />
        ) : null}
        {failed ? (
          <path
            className="k-ai-draw"
            d={CROSS_PATH}
            fill="none"
            pathLength={1}
            stroke={statusColor('danger')}
            strokeLinecap="round"
            strokeWidth={1.8}
          />
        ) : null}
      </svg>
    </span>
  )
}

function TaskRow({
  task,
  depth,
  statusLabels,
}: {
  task: AiTask
  depth: number
  statusLabels: Readonly<Record<AiTaskStatus, string>>
}) {
  const running = task.status === 'running' && !task.children?.length
  const done = task.status === 'done'
  return (
    <motion.li
      data-slot="ai-task"
      data-status={task.status}
      className="m-0 list-none"
      style={{ paddingLeft: depth * 20 }}
      initial={false}
      // 完成的行沉 1px、淡到 70%：让位给正在跑的那一行（70% 下备注用正文字色仍 ≥4.5:1；原 65% + ink-3 只有 2.9:1）。
      animate={{ opacity: done ? 0.7 : 1, y: done ? 1 : 0 }}
      transition={unit(snappy)}
    >
      <span className="relative flex items-start gap-2 py-1">
        <TaskBox status={task.status} />
        <span className="k-text-data min-w-0 flex-1 leading-snug text-ink">
          {task.label}
          <span className="sr-only"> · {statusLabels[task.status]}</span>
        </span>
        {task.note ? (
          <span className="k-text-caption shrink-0 text-(--k-content-body-foreground) tabular-nums">{task.note}</span>
        ) : null}
        {running ? (
          <span
            aria-hidden="true"
            className="k-ai-sweep pointer-events-none absolute inset-x-0 bottom-0 h-px text-ink-3"
          />
        ) : null}
      </span>
    </motion.li>
  )
}

export type AiTaskListProps = {
  /** The plan; sub-steps go in `children` of a task, one level deep. */
  tasks: readonly AiTask[]
  /** Heading of the plan, such as "Plan" (required). */
  label: string
  /** Screen-reader words for each status (required). */
  statusLabels: Readonly<Record<AiTaskStatus, string>>
  /** Extra class name on the root. */
  className?: string
}

export function AiTaskList({ tasks, label, statusLabels, className }: AiTaskListProps) {
  const { done, total } = taskProgress(tasks)
  return (
    <div data-slot="ai-task-list" className={cn('w-full k-mat-block p-3', className)}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="k-text-data m-0 font-semibold text-ink">{label}</p>
        <p className="k-text-caption m-0 text-ink-3 tabular-nums" data-slot="ai-task-count">
          {done}/{total}
        </p>
      </div>
      <ul className="m-0 list-none p-0">
        {tasks.map((task) => (
          <Fragment key={task.id}>
            <TaskRow task={task} depth={0} statusLabels={statusLabels} />
            {task.children?.map((child) => (
              <TaskRow key={child.id} task={child} depth={1} statusLabels={statusLabels} />
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  )
}
