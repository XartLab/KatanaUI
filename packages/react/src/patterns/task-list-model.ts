// SPDX-License-Identifier: MIT
// TaskList 的数据与次序规则（纯函数）：任务的形状、划完的行沉底。

/** One task: id, label and whether it is done. */
export type Task = {
  id: string
  label: string
  done?: boolean
}

/**
 * Display order: open tasks first in their original order, then the parked (struck-through) ones in the order they sank.
 * 清单的显示次序：没完成的在前、保持原次序；已「划完」的（parked 里的）沉到后面，按沉下去的先后排。
 * 勾上但线还没划完的行仍留在原位。parked 里有、但现在已不是完成的（被外面改了）或已经不存在的，当作没沉。
 */
export function orderTasks(tasks: readonly Task[], parked: readonly string[]): Task[] {
  const sunk = parked
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => task?.done === true)
  return [...tasks.filter((task) => !sunk.includes(task)), ...sunk]
}
