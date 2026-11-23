// SPDX-License-Identifier: MIT
import { AiPromptInput } from '../../src/index'

export function AiPromptInputUsage() {
  return (
    <AiPromptInput
      label="向交易助手提问"
      placeholder="问点什么……"
      labels={{ send: '发送', stop: '停止生成' }}
      onSubmit={(text) => console.log(text)}
    />
  )
}
