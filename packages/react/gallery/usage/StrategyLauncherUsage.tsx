// SPDX-License-Identifier: MIT
import { GaugeIcon, Grid3x3Icon, RadioIcon, RepeatIcon } from 'lucide-react'
import { useState } from 'react'
import { StrategyLauncher, type StrategyEntry } from '../../src/blocks'

// 演示入口（不是库自带的策略）：入口指向什么由宿主定。
const ENTRIES: readonly StrategyEntry[] = [
  { id: 'grid', name: '网格策略', icon: <Grid3x3Icon />, tags: ['震荡行情', '自动低买高卖', '区间可调'] },
  { id: 'dca', name: '定投加仓', icon: <RepeatIcon />, tags: ['分批建仓', '摊低成本'], isNew: true },
  { id: 'signal', name: '信号策略', icon: <RadioIcon />, tags: ['外部信号', '自动下单', '风控额度'] },
  { id: 'runs', name: '运行中心', icon: <GaugeIcon />, tags: ['查看运行', '暂停与停止'] },
]

export function StrategyLauncherUsage() {
  const [opened, setOpened] = useState('')
  return (
    <div style={{ width: 360 }}>
      <StrategyLauncher
        entries={ENTRIES}
        notice="策略会按设定自动下单，行情剧烈时可能亏损；运行前先确认风控额度。"
        labels={{ region: '策略工具', dismiss: '关闭风险提示', new: '新' }}
        onOpen={setOpened}
      />
      <p data-gallery-opened={opened} style={{ margin: '8px 0 0', fontSize: 12 }}>
        {opened ? `打开：${opened}` : '点一张卡'}
      </p>
    </div>
  )
}
