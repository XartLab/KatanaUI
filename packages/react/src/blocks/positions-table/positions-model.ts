// SPDX-License-Identifier: MIT
/**
 * Pure model of PositionsTable: liquidation distance, its risk level and bar fill, unrealized PnL percent and the footer totals.
 * 持仓表的纯函数：强平距离、强平风险档、进度条填充、未实现盈亏百分比、表尾合计。件不认识交易所：价格与保证金都是调用方算好的数。
 */
import { clamp } from '../../lib/num.ts'

export type PositionSide = 'long' | 'short'

export type Position = {
  /** Stable id of the row (an exchange position id or symbol + side). */
  id: string
  /** Instrument code shown in the first column. */
  symbol: string
  side: PositionSide
  /** Absolute position size. */
  quantity: number
  /** Average entry price. */
  entryPrice: number
  markPrice: number
  /** Liquidation price; null when the position cannot be liquidated (cash account, fully hedged). */
  liquidationPrice: number | null
  /** Unrealized PnL in the settlement currency. */
  unrealizedPnl: number
  /** Margin held for this position; null for unmargined positions. */
  margin: number | null
  /** Leverage multiple; null when not applicable. */
  leverage: number | null
  /** Decimal places of this instrument's prices. */
  pricePrecision?: number
}

/** Liquidation risk: none (no liquidation price), safe, warn or danger (breached counts as danger). */
export type LiquidationRisk = 'none' | 'safe' | 'warn' | 'danger'

/**
 * 标记价到强平价的距离，占标记价的百分比；多头强平价在下，空头在上；已越过强平价给 0 或负数。
 * 没有强平价（null、非正数）或标记价非正数是 null。
 */
export function liquidationDistance(
  side: PositionSide,
  markPrice: number,
  liquidationPrice: number | null,
): number | null {
  if (liquidationPrice === null || !Number.isFinite(liquidationPrice) || liquidationPrice <= 0) return null
  if (!Number.isFinite(markPrice) || markPrice <= 0) return null
  const gap = side === 'long' ? markPrice - liquidationPrice : liquidationPrice - markPrice
  return (gap / markPrice) * 100
}

/**
 * 强平距离的风险档：≤ danger 是危险，≤ warn 是警告，其余安全；没有距离是 none。danger 缺省取 warn 的一半。
 */
export function liquidationRisk(distance: number | null, warn: number, danger: number = warn / 2): LiquidationRisk {
  if (distance === null || Number.isNaN(distance)) return 'none'
  if (distance <= danger) return 'danger'
  if (distance <= warn) return 'warn'
  return 'safe'
}

/** 距离在进度条上的填充（0 到 1）：达到刻度上限是满条，0 及以下是空条；没有距离是 0。 */
export function liquidationFill(distance: number | null, scaleMax: number): number {
  if (distance === null || !(scaleMax > 0)) return 0
  return clamp(distance / scaleMax, 0, 1)
}

/**
 * 未实现盈亏占保证金的百分比；没有保证金时退到成本（数量 × 开仓均价）；都没有是 null。
 */
export function unrealizedPercent(
  position: Pick<Position, 'unrealizedPnl' | 'margin' | 'quantity' | 'entryPrice'>,
): number | null {
  const base =
    position.margin !== null && position.margin > 0 ? position.margin : position.quantity * position.entryPrice
  if (!(base > 0) || !Number.isFinite(position.unrealizedPnl)) return null
  return (position.unrealizedPnl / base) * 100
}

export type PositionTotals = {
  count: number
  unrealizedPnl: number
  margin: number
  /** Total unrealized PnL over total margin, in percent; null when there is no margin. */
  percent: number | null
  /** How many positions are at the warn or danger level. */
  atRisk: number
}

/** 表尾合计：行数、盈亏、保证金，以及临近强平（警告或危险）的行数。 */
export function positionTotals(positions: readonly Position[], warn: number, danger?: number): PositionTotals {
  let unrealizedPnl = 0
  let margin = 0
  let atRisk = 0
  for (const position of positions) {
    if (Number.isFinite(position.unrealizedPnl)) unrealizedPnl += position.unrealizedPnl
    if (position.margin !== null && Number.isFinite(position.margin)) margin += position.margin
    const risk = liquidationRisk(
      liquidationDistance(position.side, position.markPrice, position.liquidationPrice),
      warn,
      danger,
    )
    if (risk === 'warn' || risk === 'danger') atRisk += 1
  }
  return {
    count: positions.length,
    unrealizedPnl,
    margin,
    percent: margin > 0 ? (unrealizedPnl / margin) * 100 : null,
    atRisk,
  }
}
