// SPDX-License-Identifier: MIT
import { AiToolCall } from '../../src/index'

export function AiToolCallUsage() {
  return (
    <AiToolCall
      name="search_news"
      status="success"
      summary="3 条"
      labels={{
        status: { pending: '排队', running: '运行中', success: '完成', error: '失败' },
        args: '参数',
        result: '结果',
      }}
      args={'{ "query": "600519 下跌" }'}
      result="贵州茅台批发价连续下行"
    />
  )
}
