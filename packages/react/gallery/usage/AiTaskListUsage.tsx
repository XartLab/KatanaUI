// SPDX-License-Identifier: MIT
import { AiTaskList } from '../../src/index'

export function AiTaskListUsage() {
  return (
    <AiTaskList
      label="计划"
      statusLabels={{ pending: '待办', running: '进行中', done: '已完成', failed: '失败' }}
      tasks={[
        { id: 'a', label: '读取近 20 日行情', status: 'done' },
        { id: 'b', label: '查新闻与资金流向', status: 'running' },
        { id: 'c', label: '生成减仓建议', status: 'pending' },
      ]}
    />
  )
}
