// SPDX-License-Identifier: MIT
// 下单面板的仓位计算（纯函数，#96）。三种填法：按成本（OKX 的做法，2026-11-19 实际打开交易页看的）、按数量、
// 按风险金额加止损价（ATAS Beta 8.0.16 的「Position size from monetary risk」，https://feedback.atas.net/de/changelog ，2026-11-19 读）。
// 只算正向合约与现货（以计价币结算）；币本位（反向）合约不在这里。强平价是单仓逐仓的近似，全仓依赖账户其他仓位，调用方有交易所给的值就用它。

export type OrderSide = 'buy' | 'sell'

/** How the size box is read: money put in, contracts, or money at risk. */
export type SizingMode = 'cost' | 'quantity' | 'risk'

/** 合约规格：contractValue 是一张合约合多少基础币（现货写 1），lotSize 是下单数量的最小步长（张）。 */
export type InstrumentSpec = {
  contractValue: number
  lotSize: number
  minSize?: number
}

/** Fee rates as fractions (0.0005 is 0.05%). */
export type FeeRates = { open: number; close: number }

export type HeldPosition = { side: OrderSide; size: number; entryPrice: number }

export type SizingInput = {
  side: OrderSide
  /** Entry price: the limit price, or the best bid / ask for a market order. */
  price: number
  /** 1 for spot and unlevered venues. */
  leverage: number
  fees: FeeRates
  /** Count the estimated closing fee in the cost. Defaults to true. */
  includeCloseFee?: boolean
  spec: InstrumentSpec
  mode: SizingMode
  /** The number typed in the size box: cost or risk in quote currency, or contracts. */
  amount: number
  takeProfit?: number
  /** Required in risk mode. */
  stopLoss?: number
  /** Maintenance margin rate as a fraction; without it no liquidation price is estimated. */
  maintenanceMarginRate?: number
  /** Funds available for new orders, in quote currency. */
  available?: number
  position?: HeldPosition
}

export type SizingIssue = 'no-price' | 'no-amount' | 'no-stop' | 'stop-wrong-side' | 'below-min' | 'exceeds-available'

export type ExitEstimate = { price: number; pnl: number }

export type SizingResult = {
  /** Order size in contracts, floored to the lot size. */
  contracts: number
  /** The same size in base currency. */
  baseQuantity: number
  notional: number
  margin: number
  openFee: number
  /** Estimated fee to close at the entry price. */
  closeFee: number
  /** Margin plus the fees counted in the cost. */
  cost: number
  /** Exit price at which fees are just covered. */
  breakeven: number
  /** Isolated-margin approximation; undefined without a maintenance margin rate or when it cannot be reached. */
  liquidationPrice?: number
  takeProfit?: ExitEstimate
  stopLoss?: ExitEstimate
  /** Net take-profit gain over net stop-loss loss. */
  rewardRisk?: number
  /** The position after this order fills. */
  after?: HeldPosition
  issue?: SizingIssue
}

const EPSILON = 1e-9

const decimalsOf = (step: number): number => {
  const text = String(step)
  if (text.includes('e-')) return Number(text.split('e-')[1])
  return text.includes('.') ? text.split('.')[1].length : 0
}

/** 向下取整到步长：10 U 只能买 0.0159 张时给 0.01，不给 0.02，否则实际占用会超过用户填的数。 */
export function floorToStep(value: number, step: number): number {
  if (!(value > 0) || !(step > 0)) return 0
  const steps = Math.floor(value / step + EPSILON)
  return Number((steps * step).toFixed(decimalsOf(step)))
}

const direction = (side: OrderSide): 1 | -1 => (side === 'buy' ? 1 : -1)

/** Net profit of closing `contracts` at `exit`, after both fees. */
export function exitPnl(
  side: OrderSide,
  entry: number,
  exit: number,
  contracts: number,
  spec: InstrumentSpec,
  fees: FeeRates,
): number {
  const quantity = contracts * spec.contractValue
  return direction(side) * (exit - entry) * quantity - entry * quantity * fees.open - exit * quantity * fees.close
}

/** 含手续费的保本价：多头 P(1+开)/(1−平)，空头 P(1−开)/(1+平)。 */
export function breakevenPrice(side: OrderSide, entry: number, fees: FeeRates): number {
  return side === 'buy' ? (entry * (1 + fees.open)) / (1 - fees.close) : (entry * (1 - fees.open)) / (1 + fees.close)
}

/**
 * 预估强平价（逐仓、正向合约的近似）：保证金加浮动盈亏等于维持保证金加平仓费的那个价。
 * 多头 P(1−1/L)/(1−m−f)，空头 P(1+1/L)/(1+m+f)；多头不加杠杆时到不了，返回 undefined。
 */
export function liquidationPrice(
  side: OrderSide,
  entry: number,
  leverage: number,
  maintenanceMarginRate: number,
  closeFee: number,
): number | undefined {
  if (!(entry > 0) || !(leverage > 0)) return undefined
  const price =
    side === 'buy'
      ? (entry * (1 - 1 / leverage)) / (1 - maintenanceMarginRate - closeFee)
      : (entry * (1 + 1 / leverage)) / (1 + maintenanceMarginRate + closeFee)
  return price > 0 && Number.isFinite(price) ? price : undefined
}

/** Largest order, in contracts, that `cost` pays for at this price and leverage. */
export function contractsForCost(
  cost: number,
  price: number,
  leverage: number,
  fees: FeeRates,
  spec: InstrumentSpec,
  includeCloseFee = true,
): number {
  if (!(cost > 0) || !(price > 0) || !(leverage > 0)) return 0
  const perNotional = 1 / leverage + fees.open + (includeCloseFee ? fees.close : 0)
  return floorToStep(cost / perNotional / (price * spec.contractValue), spec.lotSize)
}

/** 按风险：每张在止损价出场亏多少（价差加开平两笔费），风险金额除以它，向下取整。 */
export function contractsForRisk(
  risk: number,
  side: OrderSide,
  price: number,
  stop: number,
  fees: FeeRates,
  spec: InstrumentSpec,
): number {
  const lossPerContract = -exitPnl(side, price, stop, 1, spec, fees)
  if (!(risk > 0) || !(lossPerContract > 0)) return 0
  return floorToStep(risk / lossPerContract, spec.lotSize)
}

function merged(position: HeldPosition | undefined, side: OrderSide, contracts: number, price: number): HeldPosition {
  if (!position || position.size <= 0) return { side, size: contracts, entryPrice: price }
  if (position.side === side) {
    const size = position.size + contracts
    return { side, size, entryPrice: (position.entryPrice * position.size + price * contracts) / size }
  }
  // 反向单先减仓：没减完均价不变，减过头剩下的按新价开在另一边。
  const rest = position.size - contracts
  if (rest >= 0) return { side: position.side, size: rest, entryPrice: position.entryPrice }
  return { side, size: -rest, entryPrice: price }
}

/** 一次算出下单面板要显示的全部数字。数量先定（按填法），其余都从取整后的数量反算，所以显示的占用不会超过用户填的成本。 */
export function computeSizing(input: SizingInput): SizingResult {
  const { side, price, leverage, fees, spec, mode, amount } = input
  const includeCloseFee = input.includeCloseFee ?? true
  const empty: SizingResult = {
    contracts: 0,
    baseQuantity: 0,
    notional: 0,
    margin: 0,
    openFee: 0,
    closeFee: 0,
    cost: 0,
    breakeven: 0,
  }
  if (!(price > 0)) return { ...empty, issue: 'no-price' }
  if (!(amount > 0)) return { ...empty, issue: 'no-amount' }

  let contracts: number
  let issue: SizingIssue | undefined
  if (mode === 'cost') {
    contracts = contractsForCost(amount, price, leverage, fees, spec, includeCloseFee)
  } else if (mode === 'quantity') {
    contracts = floorToStep(amount, spec.lotSize)
  } else {
    const stop = input.stopLoss
    if (!(stop !== undefined && stop > 0)) return { ...empty, issue: 'no-stop' }
    if (direction(side) * (stop - price) >= 0) return { ...empty, issue: 'stop-wrong-side' }
    contracts = contractsForRisk(amount, side, price, stop, fees, spec)
  }
  if (contracts <= 0 || contracts < (spec.minSize ?? spec.lotSize) - EPSILON) issue = 'below-min'

  const baseQuantity = contracts * spec.contractValue
  const notional = baseQuantity * price
  const margin = notional / leverage
  const openFee = notional * fees.open
  const closeFee = notional * fees.close
  const cost = margin + openFee + (includeCloseFee ? closeFee : 0)
  if (!issue && input.available !== undefined && cost > input.available + EPSILON) issue = 'exceeds-available'

  const estimate = (exit: number | undefined): ExitEstimate | undefined =>
    exit !== undefined && exit > 0 && contracts > 0
      ? { price: exit, pnl: exitPnl(side, price, exit, contracts, spec, fees) }
      : undefined
  const takeProfit = estimate(input.takeProfit)
  const stopLoss = estimate(input.stopLoss)
  const rewardRisk =
    takeProfit && stopLoss && takeProfit.pnl > 0 && stopLoss.pnl < 0 ? takeProfit.pnl / -stopLoss.pnl : undefined

  return {
    contracts,
    baseQuantity,
    notional,
    margin,
    openFee,
    closeFee,
    cost,
    breakeven: breakevenPrice(side, price, fees),
    liquidationPrice:
      input.maintenanceMarginRate === undefined || contracts <= 0
        ? undefined
        : liquidationPrice(side, price, leverage, input.maintenanceMarginRate, fees.close),
    takeProfit,
    stopLoss,
    rewardRisk,
    after: contracts > 0 ? merged(input.position, side, contracts, price) : undefined,
    issue,
  }
}
