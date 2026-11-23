// SPDX-License-Identifier: MIT
import { AccountEquity, type AccountEquityLabels } from '../../src/blocks'

// 演示数据：账户数字与权益曲线都是编出来的（闭式公式），不是真实账户。
export const EQUITY_CURVE: readonly number[] = Array.from({ length: 48 }, (_, i) =>
  Math.round(50000 + i * 52 + 900 * Math.sin(i / 4) + 400 * Math.cos(i / 1.7)),
)

export const EQUITY_LABELS: AccountEquityLabels = {
  region: '账户权益（演示数据）',
  equity: '总权益',
  available: '可用',
  usedMargin: '已用保证金',
  unrealizedPnl: '未实现盈亏',
  marginRatio: '保证金率',
  level: { safe: '安全', warn: '警告', danger: '危险' },
  threshold: (level, value, direction) =>
    `${level === 'warn' ? '警告' : '危险'} ${direction === 'higher' ? '≥' : '≤'} ${value}%`,
  curve: '近 48 个周期权益',
}

export function AccountEquityUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <AccountEquity
        equity={52430.18}
        available={31720.4}
        usedMargin={20709.78}
        unrealizedPnl={-1691}
        thresholds={{ warn: 50, danger: 80 }}
        curve={EQUITY_CURVE}
        currency="USDT"
        labels={EQUITY_LABELS}
      />
    </div>
  )
}
