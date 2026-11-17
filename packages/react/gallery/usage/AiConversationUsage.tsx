// SPDX-License-Identifier: MIT
import { AiConversation, AiMessage } from '../../src/index'

export function AiConversationUsage() {
  return (
    <div style={{ height: 160 }}>
      <AiConversation label="对话" jumpLabel="回到最新" contentKey={2} className="h-full">
        <AiMessage from="user">600519 今天为什么跌</AiMessage>
        <AiMessage>更像板块与资金面共振。</AiMessage>
      </AiConversation>
    </div>
  )
}
