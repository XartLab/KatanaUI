// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { HoldToConfirm } from '../../src/index'
import { Row } from './parts'

// #1919 的操作与结构件的演示。数据都是演示用的（页上写明），不是行情。

export function HoldToConfirmDemo() {
  const [flattened, setFlattened] = useState(0)
  const [stopped, setStopped] = useState(0)
  return (
    <>
      <Row name="danger · 默认 2 秒">
        <HoldToConfirm hint="按住 2 秒，全部平仓" confirmedLabel="已平仓" onConfirm={() => setFlattened((n) => n + 1)}>
          全部平仓
        </HoldToConfirm>
        <output data-gallery-hold>已触发 {flattened} 次</output>
      </Row>
      <Row name="default · 1 秒">
        <HoldToConfirm
          tone="default"
          holdMs={1000}
          hint="按住 1 秒，停止策略"
          onConfirm={() => setStopped((n) => n + 1)}
        >
          停止策略
        </HoldToConfirm>
        <output data-gallery-hold-fast>已触发 {stopped} 次</output>
      </Row>
      <Row name="禁用">
        <HoldToConfirm disabled hint="按住 2 秒，全部撤单" onConfirm={() => {}}>
          全部撤单
        </HoldToConfirm>
      </Row>
      <p className="gal-note">演示：按钮不连任何账户，只计数。单击不会触发；按住不放，或键盘按住空格 / 回车。</p>
    </>
  )
}
