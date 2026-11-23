// SPDX-License-Identifier: MIT
// 跑马灯、自动刷新、表尾合计（#77 第 5 条）的演示。数据都是演示用的固定值。
import { GridSummaryRowUsage } from '../usage/GridSummaryRowUsage.tsx'
import { RefreshControlUsage } from '../usage/RefreshControlUsage.tsx'
import { TickerTapeUsage } from '../usage/TickerTapeUsage.tsx'
import { Row } from './parts'

export function TickerTapeDemo() {
  return (
    <>
      <Row name="滚动（悬停、聚焦或按右端暂停钮停住；点品种联动）· 一行不滚动（inline · static）">
        <TickerTapeUsage />
      </Row>
    </>
  )
}

export function RefreshControlDemo() {
  return (
    <Row name="10 秒 / 1 分钟 / 不刷新 · 立即刷新 · 上次时刻与下次倒计时">
      <RefreshControlUsage />
    </Row>
  )
}

export function GridSummaryRowDemo() {
  return (
    <Row name="合计 · 均值 · 中位数（第一列固定，横向滚动时跟着列走、粘在底边）">
      <GridSummaryRowUsage />
    </Row>
  )
}
