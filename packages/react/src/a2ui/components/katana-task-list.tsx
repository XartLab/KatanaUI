// SPDX-License-Identifier: MIT
// KatanaTaskList：智能体的计划与任务清单，点一行打勾。勾上或取消只发 Action，状态由智能体改完写回；
// 在写回之前件先按用户的点击显示，数据模型一变就以数据为准。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { TaskList, type Task } from '../../index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, parseList, weightSchema } from '../support.tsx'

const taskSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the task. The host gets it back when the user toggles it.'),
    label: z.string().describe('The task text.'),
    done: z.boolean().describe('Whether the task is done. Defaults to false.').optional(),
  })
  .strict()

export const KatanaTaskListApi = {
  name: 'KatanaTaskList',
  schema: z
    .object({
      tasks: z
        .union([z.array(taskSchema), CommonSchemas.DataBinding])
        .describe(
          'The tasks. Either a literal array or {"@path": "/tasks"} bound to a data-model array; write the new done flag back after onToggle.',
        ),
      label: CommonSchemas.DynamicString.describe('Accessible name of the list.'),
      completedLabel: text('Announcement when a task is ticked; {label} is the task text, for example "{label} done".'),
      reopenedLabel: text(
        'Announcement when a tick is removed; {label} is the task text, for example "{label} reopened".',
      ),
      onToggle: actionSchema(
        'Dispatched when the user ticks or unticks a task. metadata.extensions.katanaTask carries {id, done}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaTaskList = createComponentImplementation(KatanaTaskListApi, ({ props }) => {
  const source = useMemo(() => parseList(taskSchema, props.tasks), [props.tasks])
  const [picked, setPicked] = useState<Readonly<Record<string, boolean>>>({})
  // 数据模型更新了任务：丢掉本地的点击，以数据为准。
  useEffect(() => setPicked((current) => (Object.keys(current).length > 0 ? {} : current)), [source])
  const tasks: Task[] = source.map((task) => ({
    id: task.id,
    label: task.label,
    done: picked[task.id] ?? task.done === true,
  }))
  return (
    <Cell weight={props.weight}>
      <TaskList
        tasks={tasks}
        label={props.label}
        labels={{
          completed: (label) => fill(props.completedLabel, { label }),
          reopened: (label) => fill(props.reopenedLabel, { label }),
        }}
        onTasksChange={(next) => {
          const before = new Map(tasks.map((task) => [task.id, task.done === true]))
          const changed = next.find((task) => before.get(task.id) !== (task.done === true))
          if (!changed) return
          setPicked((current) => ({ ...current, [changed.id]: changed.done === true }))
          void props.onToggle?.(withExtension('katanaTask', { id: changed.id, done: changed.done === true }))
        }}
      />
    </Cell>
  )
})
