// SPDX-License-Identifier: MIT
import { PortfolioRunGrid, type PortfolioRunRow } from '../../src/index'

// 最小用法：下面的品种与数字都是编的演示数据。
const ROWS: PortfolioRunRow[] = [
  {
    id: 'a',
    symbol: 'DEMO-A',
    position: 3,
    unrealizedPnl: 142.5,
    realizedPnl: 310,
    riskAmount: 1200,
    equityContribution: 452.5,
    status: 'running',
  },
  {
    id: 'b',
    symbol: 'DEMO-B',
    position: -2,
    unrealizedPnl: -86,
    realizedPnl: 40,
    riskAmount: 900,
    equityContribution: -46,
    status: 'paused',
  },
  {
    id: 'c',
    symbol: 'DEMO-C',
    position: 0,
    unrealizedPnl: 0,
    realizedPnl: -120,
    riskAmount: 0,
    equityContribution: -120,
    status: 'disconnected',
  },
]

export function PortfolioRunGridUsage() {
  return (
    <PortfolioRunGrid
      rows={ROWS}
      summary={{ equity: 100_373.5, availableFunds: 86_200, buyingPower: 172_400, drawdown: -0.0342 }}
      format={{
        amount: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        quantity: String,
        percent: (v) => `${(v * 100).toFixed(2)}%`,
      }}
      labels={{
        grid: '组合运行表',
        summary: '组合汇总',
        equity: '权益',
        availableFunds: '可用资金',
        buyingPower: '购买力',
        drawdown: '回撤',
        columns: {
          symbol: '品种',
          position: '持仓',
          unrealizedPnl: '浮动盈亏',
          realizedPnl: '已实现盈亏',
          riskAmount: '占用风险资金',
          equityContribution: '权益贡献',
          status: '状态',
          actions: '操作',
        },
        status: { running: '运行', paused: '暂停', noNewEntries: '停新开', disconnected: '断流' },
        pause: '暂停',
        resume: '恢复',
        closePosition: '平掉',
      }}
      onPause={() => {}}
      onResume={() => {}}
      onClose={() => {}}
    />
  )
}
