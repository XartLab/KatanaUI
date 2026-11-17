// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { HoldToConfirm } from '../../src/index'

export function HoldToConfirmUsage() {
  const [flattened, setFlattened] = useState(0)
  const [stopped, setStopped] = useState(0)
  return (
    <>
      <HoldToConfirm
        labels={{ hint: '按住 2 秒，全部平仓', confirmed: '已平仓' }}
        onConfirm={() => setFlattened((n) => n + 1)}
      >
        全部平仓
      </HoldToConfirm>
      <output data-gallery-hold>已触发 {flattened} 次</output>

      <HoldToConfirm
        tone="neutral"
        holdMs={1000}
        labels={{ hint: '按住 1 秒，停止策略' }}
        onConfirm={() => setStopped((n) => n + 1)}
      >
        停止策略
      </HoldToConfirm>
      <output data-gallery-hold-fast>已触发 {stopped} 次</output>

      <HoldToConfirm disabled labels={{ hint: '按住 2 秒，全部撤单' }} onConfirm={() => {}}>
        全部撤单
      </HoldToConfirm>
    </>
  )
}
