// SPDX-License-Identifier: MIT
import { AiReasoning } from '../../src/index'

export function AiReasoningUsage() {
  return (
    <AiReasoning
      isStreaming
      labels={{ thinking: '思考中', reasoning: '推理过程', thought: (seconds) => `思考了 ${seconds.toFixed(1)} 秒` }}
    >
      先看是个股事件还是板块行情，再查新闻与资金流向。
    </AiReasoning>
  )
}
