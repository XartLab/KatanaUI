// SPDX-License-Identifier: MIT
// 策略入口（#245 模块 2）的演示。入口都是演示用的固定值。
import { StrategyLauncherUsage } from '../usage/StrategyLauncherUsage.tsx'
import { Row } from './parts'

export function StrategyLauncherDemo() {
  return (
    <Row name="可关的风险提示 · 入口卡（图标 · 名字 · 新 · 标签 · 右箭头）· 点卡回调">
      <StrategyLauncherUsage />
    </Row>
  )
}
