// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-task-list（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// Agent 计划的纯逻辑：任务状态、展平、完成数。表头的「已完成 / 总数」从任务派生，永远不手传——跟行对不上的 3/7 会毁掉整个面板的可信度。

export type AiTaskStatus = 'pending' | 'running' | 'done' | 'failed'

export type AiTask = {
  id: string
  label: string
  status: AiTaskStatus
  /** Short right-aligned note such as "12/12" or "3 hits". */
  note?: string
  /** Sub-steps, one level deep. */
  children?: readonly AiTask[]
}

/** 把任务连同子步骤展平成一列（先父后子）。 */
export function flattenTasks(tasks: readonly AiTask[]): AiTask[] {
  return tasks.flatMap((task) => [task, ...flattenTasks(task.children ?? [])])
}

/** 已完成几项、一共几项（含子步骤）。 */
export function taskProgress(tasks: readonly AiTask[]): { done: number; total: number } {
  const all = flattenTasks(tasks)
  return { done: all.filter((task) => task.status === 'done').length, total: all.length }
}
