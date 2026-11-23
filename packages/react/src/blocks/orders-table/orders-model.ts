// SPDX-License-Identifier: MIT
/**
 * Pure model of OrdersTable: fill ratio, what an order allows (amend, cancel), amend text parsing and the cancel-all set.
 * 委托表的纯函数：成交比例、一张单能不能撤 / 改价、改价输入的解析、「全部撤单」的范围。件不认识交易所：状态是调用方归好的几档。
 */
import { clamp } from '../../lib/num.ts'

export type OrderSide = 'buy' | 'sell'
/** Limit order, market order, or a conditional (stop / trigger) order. */
export type OrderType = 'limit' | 'market' | 'conditional'
/** Open (resting), partial (partly filled), pending (conditional, not triggered yet), canceling (cancel sent, not confirmed). */
export type OrderStatus = 'open' | 'partial' | 'pending' | 'canceling'

export type Order = {
  /** Stable id of the row (the exchange order id). */
  id: string
  symbol: string
  side: OrderSide
  /** Order type: limit, market or conditional. */
  type: OrderType
  /** Order price; null for a market order (or a conditional order that becomes a market order). */
  price: number | null
  /** Trigger price of a conditional order. */
  triggerPrice?: number | null
  /** Ordered quantity. */
  quantity: number
  /** Filled quantity so far. */
  filled: number
  /** Lifecycle status, already normalised by the caller. */
  status: OrderStatus
  /** Created time in milliseconds. */
  time: number
  /** Decimal places of this instrument's prices. */
  pricePrecision?: number
}

/** Filled share, 0 to 1; a non-positive quantity gives 0. */
export function fillRatio(order: Pick<Order, 'quantity' | 'filled'>): number {
  if (!(order.quantity > 0) || !Number.isFinite(order.filled)) return 0
  return clamp(order.filled / order.quantity, 0, 1)
}

/** A cancel request is already out: the row stays but its buttons are off. */
export const isCanceling = (order: Pick<Order, 'status'>): boolean => order.status === 'canceling'

/** Can be cancelled: anything not already being cancelled. */
export const canCancel = (order: Pick<Order, 'status'>): boolean => !isCanceling(order)

/** Can change its price: not a market order, has a price to change, and no cancel in flight. */
export const canAmend = (order: Pick<Order, 'type' | 'price' | 'status'>): boolean =>
  order.type !== 'market' && order.price !== null && !isCanceling(order)

/** Orders that "cancel all" would cancel. */
export const cancellable = (orders: readonly Order[]): Order[] => orders.filter(canCancel)

/**
 * Parses what the user typed in the price box: a positive finite number; a comma as decimal or thousands separator and a full-width minus are tolerated.
 * 改价框里的字 → 价格：正的有限数；逗号当千分位去掉。空、非数、零、负数是 null。
 */
export function parseAmendPrice(text: string): number | null {
  const cleaned = text.trim().replaceAll(',', '').replace('−', '-')
  if (cleaned === '') return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value > 0 ? value : null
}

export type AmendDecision =
  | { kind: 'submit'; price: number }
  /** Same price as before: close the editor without a callback. */
  | { kind: 'unchanged' }
  | { kind: 'invalid' }

/** What Enter does on the amend box: send the new price, just close (price unchanged), or stay with an error. */
export function amendDecision(order: Pick<Order, 'price'>, text: string): AmendDecision {
  const price = parseAmendPrice(text)
  if (price === null) return { kind: 'invalid' }
  if (order.price !== null && Math.abs(price - order.price) < 1e-12) return { kind: 'unchanged' }
  return { kind: 'submit', price }
}

/** Order status tone for the status pill. */
export const statusTone = (status: OrderStatus): 'accent' | 'muted' =>
  status === 'partial' || status === 'open' ? 'accent' : 'muted'
