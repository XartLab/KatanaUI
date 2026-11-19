// SPDX-License-Identifier: MIT
import { AiContextMeter } from '../../src/index'

export function AiContextMeterUsage() {
  return (
    <AiContextMeter
      used={62_000}
      limit={128_000}
      label="上下文已用 48%"
      breakdown={[
        { label: '对话历史', tokens: 28_000 },
        { label: '工具结果', tokens: 34_000 },
      ]}
    />
  )
}
