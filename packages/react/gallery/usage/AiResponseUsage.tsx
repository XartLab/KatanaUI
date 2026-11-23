// SPDX-License-Identifier: MIT
import { AiResponse } from '../../src/index'

export function AiResponseUsage() {
  return (
    <AiResponse
      text="批价继续回落 [1]，融资净卖出 [2]。"
      citations={[
        { index: 1, source: { id: 'a', site: '财新', title: '批发价连续下行' } },
        { index: 2, source: { id: 'b', site: '上交所', title: '融资净卖出居前' } },
      ]}
      locale="zh-CN"
    />
  )
}
