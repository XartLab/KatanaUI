// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, Input } from '../../src/index'
import { FloatingWindow, useFloatingWindow } from '../../src/blocks'

// 演示用的小下单区（不是 OrderTicket）：点击计数在换窗时保留，证明子树没有重新挂载。
function MiniTicket() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ display: 'grid', gap: 8, padding: 12, width: 300 }}>
      <Input aria-label="价格" defaultValue="94820.5" />
      <Button onClick={() => setCount((n) => n + 1)}>买入</Button>
      <p data-gallery-count={count} style={{ margin: 0, fontSize: 12 }}>
        已下 {count} 单
      </p>
    </div>
  )
}

export function FloatingWindowUsage() {
  const floating = useFloatingWindow()
  return (
    <div style={{ width: 340 }}>
      <Button onClick={floating.toggle} aria-pressed={floating.open}>
        {floating.open ? '放回原处' : '在悬浮窗中交易'}
      </Button>
      <FloatingWindow
        {...floating.props}
        title="下单"
        width={340}
        height={240}
        labels={{ close: '关闭悬浮窗', move: '移动悬浮窗：拖动标题栏或按方向键' }}
        placeholder={<p style={{ margin: '8px 0', fontSize: 12 }}>下单区已在悬浮窗中。</p>}
      >
        <MiniTicket />
      </FloatingWindow>
    </div>
  )
}
