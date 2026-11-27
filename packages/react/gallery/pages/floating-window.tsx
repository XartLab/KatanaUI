// SPDX-License-Identifier: MIT
// 悬浮窗（#245 模块 2）的演示。浏览器支持 Document Picture-in-Picture 时开真窗口，否则是页内浮层。
import { FloatingWindowUsage } from '../usage/FloatingWindowUsage.tsx'
import { Row } from './parts'

export function FloatingWindowDemo() {
  return (
    <Row name="点「在悬浮窗中交易」：Chrome / Edge 开真小窗，别的浏览器是页内可拖浮层 · 关窗后内容回到原处，计数还在">
      <FloatingWindowUsage />
    </Row>
  )
}
