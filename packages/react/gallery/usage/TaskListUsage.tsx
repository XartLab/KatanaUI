// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TaskList, type Task } from '../../src/index'

export function TaskListUsage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'read', label: 'Read the last 20 daily bars' },
    { id: 'suggest', label: 'Suggest, with sources', done: true },
  ])
  return (
    <TaskList
      tasks={tasks}
      onTasksChange={setTasks}
      label="Plan"
      labels={{ completed: (label) => `${label} done`, reopened: (label) => `${label} reopened` }}
    />
  )
}
