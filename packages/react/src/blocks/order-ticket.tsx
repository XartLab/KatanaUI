// SPDX-License-Identifier: MIT
// 下单面板（#96，用户 2026-11-19 定；版式 2026-11-27 重做，用户：「OKX 下单面板，一直没做得一样」「OKX 的面板不长这样啊」）。
// 版式量自 2026-11-27 在 okx.com BTCUSDT 永续页的实际截图（深色、约 300px 宽的面板；限价、市价、市价加止盈止损三张，放大 1.22 倍）：
// 顶上开仓 / 平仓两格（选中的填绿）、保证金模式与杠杆两个带箭头的灰格、文字页签的委托类型（选中项下面一道线）；
// 然后是一份共用的表单：框上面带标签的价格（框内右边上下箭头、框外「最优价」）、数量（标签是填法下拉）、0–100% 五个停靠点的滑杆、可用与可开多 / 可开空、
// 勾选后原地展开的止盈止损；下面买、卖两个整圆角的钮并排，钮下两栏读数：左栏买、右栏卖（保证金、订单价值、最高买价 / 最低卖价）；最底下费率、计算器、仓位创建器。
// 以前是买、卖各一栏并排、各填各的价格与数量（2026-11-19 的版式，也说是照 OKX，其实不是）：现在价格、数量、止盈止损只有一份，买卖只在钮和读数上分开。
// 颜色全落到我们的 token（Graphite），不取 OKX 的色值；只取「长什么样、怎么交互」，实现原创。
// OKX 没有、我们加的：仓位框可按成本 / 数量 / 风险三种填法（按风险取自 ATAS Beta 8.0.16，https://feedback.atas.net/de/changelog ），
// 出场模板（ATAS Exit Strategy，https://start.atas.net/step-3.-start-trading-with-atas/exit-strategies ），填了数量后多列手续费、总占用、预估强平价、保本价、盈亏比。
// TradingView 的下单面板不参照（用户定）。
// 受控价格（#176）：price / onPriceChange 让订单簿点一档回填限价。交互照 TradingView 的 DOM：点一档就是按这档价下限价单、默认先弹确认
// （帮助中心「Depth of market (DOM)」，2026-11-23 读）；这里点档只回填限价，下单仍走下单钮与调用方的确认。
// 点档时是否顺带切回限价页签，TradingView 页面没写，待核对；这里不切。
// 锁住态（#176）：locked 时两个下单钮都灰掉，lockedReason 写在钮下（警示色加锁形图标），两个钮经 aria-describedby 读到它；面板照样算数。
// 面板只算和显示：账户、费率、合约规格由调用方传，下单是 onSubmit 回调；文字全走 labels。
import { Calculator, ChevronDown, CircleHelp, CirclePlus, Layers, Lock } from 'lucide-react'
import { Fragment, useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { Button } from '../primitives/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { Switch } from '../primitives/switch.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { BoxButton, BoxInput, BoxLabel, InfoLine, PercentSlider, dashedLabel } from './order-ticket-fields.tsx'
import { TicketField, parseAmount, ticketFormat, toTick } from './order-ticket-parts.tsx'
import {
  computeSizing,
  contractsForCost,
  floorToStep,
  type FeeRates,
  type HeldPosition,
  type InstrumentSpec,
  type OrderSide,
  type SizingIssue,
  type SizingMode,
  type SizingResult,
} from './sizing-model.ts'

export type OrderType = 'limit' | 'market'
export type MarginMode = 'cross' | 'isolated'
/** 开仓还是平仓（双向持仓时才有）：平仓单只减仓，买是平空、卖是平多。 */
export type OrderAction = 'open' | 'close'
/** 止盈止损单放在哪：venue 是交易所托管（面板关了也生效），local 是本机盯价触发（进程不在就不生效）。 */
export type StopCustody = 'venue' | 'local'

/** 合约规格加显示用的名字：base / quote 是币种代码，sizeUnit 是数量单位（「张」「股」由调用方给）。 */
export type OrderTicketInstrument = InstrumentSpec & {
  symbol: string
  base: string
  quote: string
  tickSize: number
  sizeUnit: string
}

export type OrderTicketAccount = {
  /** Funds available for new orders, in quote currency. */
  available: number
  fees: FeeRates
  /** Maintenance margin rate as a fraction; without it no liquidation price is shown. */
  maintenanceMarginRate?: number
  position?: HeldPosition
}

/** 最新价与买一 / 卖一；maxBuy / minSell 是交易所的限价（最高买价、最低卖价），给了就在钮下显示。 */
export type OrderTicketMarket = { last: number; bid?: number; ask?: number; maxBuy?: number; minSell?: number }

/** 出场模板（ATAS 的 Exit Strategy）：止盈、止损各是离入场价的百分比（0.02 是 2%），选了就按这一栏的方向填进两个框。 */
export type ExitTemplate = { id: string; name: string; takeProfit?: number; stopLoss?: number }

/**
 * 止盈止损框里填的是什么：触发价，或离入场价的涨跌幅（%）、收益率（%，按杠杆）、盈亏额（计价币，含两边手续费）。
 * 后三种对多、空各算出一个触发价，所以一份输入对两个方向都成立。口径照交易所的「高级」止盈止损（CoinEx 帮助中心「合约止盈止损」，2026-11-27 读；OKX 同类入口要登录，待核对）。
 */
export type ExitUnit = 'price' | 'change' | 'roe' | 'pnl'
/** 触发价看哪一个：最新成交价、标记价格、指数价格（OKX 下单接口的 tpTriggerPxType / slTriggerPxType）。 */
export type TriggerPriceType = 'last' | 'mark' | 'index'

export type OrderDraft = {
  side: OrderSide
  type: OrderType
  /** Limit price; undefined for a market order. */
  price?: number
  contracts: number
  leverage: number
  marginMode?: MarginMode
  /** True for an order placed from the Close tab. */
  reduceOnly: boolean
  takeProfit?: number
  stopLoss?: number
  /** Which price triggers the take-profit and stop-loss; undefined when the venue offers no choice. */
  triggerPrice?: TriggerPriceType
  sizing: SizingResult
}

/** 面板里所有可见文字与读屏名。 */
export type OrderTicketLabels = {
  action: string
  actions: Record<OrderAction, string>
  side: string
  buy: string
  sell: string
  marginMode: string
  marginModes: Record<MarginMode, string>
  leverage: string
  orderType: string
  orderTypes: Record<OrderType, string>
  price: string
  /** Shown in the price box for a market order. */
  marketPrice: string
  /** The button that fills the best bid / ask. */
  best: string
  sizingMode: string
  sizingModes: Record<SizingMode, string>
  /** Accessible name of the percent slider. */
  percent: string
  available: string
  /** Largest order the balance allows, per side. */
  maxOpen: Record<OrderSide, string>
  exits: string
  exitTemplate: string
  noTemplate: string
  takeProfit: string
  stopLoss: string
  /** Units the TP / SL boxes can be typed in (price is always on); leave out to keep price only. */
  exitUnits?: Partial<Record<ExitUnit, string>>
  /** Accessible name of the unit switch. */
  exitUnit?: string
  /** Label of the trigger price selector and its options; leave out to hide it. */
  triggerPrice?: string
  triggerPrices?: Record<TriggerPriceType, string>
  /** Short names of the two sides in the TP / SL readout (long, short). */
  exitSides?: Record<OrderSide, string>
  custody: Record<StopCustody, string>
  size: string
  notional: string
  margin: string
  fees: string
  cost: string
  liquidation: string
  /** Appended to figures that are approximations. */
  estimate: string
  breakeven: string
  rewardRisk: string
  /** Average entry after the fill, shown when a position is held. */
  averageAfter: string
  issues: Record<Exclude<SizingIssue, 'no-price' | 'no-amount'>, string>
  submit: Record<OrderSide, string>
  /** Submit button text on the Close tab: buy closes a short, sell closes a long. */
  submitClose: Record<OrderSide, string>
  feeRate: string
  calculator: string
  /** Placeholder prefix of the contracts box, followed by the contract value and base currency (「单张委托价值 0.01 BTC」). */
  contractValue?: string
  /** Labels of the exchange price limits under the buttons; both are needed (with `market.maxBuy` / `minSell`) for the line to show. */
  maxBuyPrice?: string
  minSellPrice?: string
  /** The position builder entry in the footer; shown with `onOpenPositionBuilder`. */
  positionBuilder?: string
  /** Accessible name of the plus next to the available balance; shown with `onTransfer`. */
  transfer?: string
  /** Accessible name of the help icon at the right end of the order type tabs; shown with `onOpenHelp`. */
  help?: string
  /** Accessible names of the price stepper arrows; the stepper shows when both are given. */
  stepUp?: string
  stepDown?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 一个方向算出来的东西：成交价、算好的仓位、能开多少、问题、能不能下。 */
type SideFigures = ReturnType<typeof figuresFor>

/**
 * 止盈止损框里的数换成这个方向的触发价（按价格最小变动取整）：
 * 涨跌幅 = 入场价 ×（1 ± 幅度），收益率 = 涨跌幅 ÷ 杠杆，盈亏额解 exitPnl = ±金额（含开平两边手续费）。
 * 多头止盈在上、止损在下，空头反过来。填不出（没数、没入场价、盈亏额时没张数）就是 NaN。
 */
export function resolveExitPrice({
  kind,
  side,
  value,
  unit,
  entry,
  leverage,
  contracts,
  spec,
  fees,
}: {
  kind: 'tp' | 'sl'
  side: OrderSide
  value: number
  unit: ExitUnit
  entry: number
  leverage: number
  contracts: number
  spec: InstrumentSpec & { tickSize: number }
  fees: FeeRates
}): number {
  if (!Number.isFinite(value) || value <= 0) return Number.NaN
  if (unit === 'price') return value
  if (!(entry > 0)) return Number.NaN
  const sign = side === 'buy' ? 1 : -1
  const away = kind === 'tp' ? 1 : -1
  let price: number
  if (unit === 'change' || unit === 'roe') {
    const move = value / 100 / (unit === 'roe' ? Math.max(leverage, 1) : 1)
    price = entry * (1 + sign * away * move)
  } else {
    const quantity = contracts * spec.contractValue
    if (!(quantity > 0)) return Number.NaN
    const target = away * value
    price = (target + sign * entry * quantity + entry * quantity * fees.open) / (quantity * (sign - fees.close))
  }
  if (!(price > 0)) return Number.NaN
  return Math.round(price / spec.tickSize) * spec.tickSize
}

function figuresFor(
  side: OrderSide,
  input: {
    type: OrderType
    priceText: string
    market: OrderTicketMarket
    instrument: OrderTicketInstrument
    account: OrderTicketAccount
    leverage: number
    levered: boolean
    includeCloseFee: boolean
    sizingMode: SizingMode
    amount: number
    takeProfit: number
    stopLoss: number
    closing: boolean
  },
) {
  const { market, instrument, account, leverage, includeCloseFee } = input
  // 市价单按对手价算：买看卖一，卖看买一，没有盘口就用最新价。
  const marketPrice = (side === 'buy' ? market.ask : market.bid) ?? market.last
  const price = input.type === 'market' ? marketPrice : parseAmount(input.priceText)
  const sizing = computeSizing({
    side,
    price,
    leverage,
    fees: account.fees,
    includeCloseFee,
    spec: instrument,
    mode: input.sizingMode,
    amount: input.amount,
    takeProfit: Number.isNaN(input.takeProfit) ? undefined : input.takeProfit,
    stopLoss: Number.isNaN(input.stopLoss) ? undefined : input.stopLoss,
    maintenanceMarginRate: input.levered ? account.maintenanceMarginRate : undefined,
    // 平仓单不占新的保证金，只按数量填。
    available: input.closing ? undefined : account.available,
    position: account.position,
  })
  const issue = sizing.issue === 'no-price' || sizing.issue === 'no-amount' ? undefined : sizing.issue
  const maxContracts = contractsForCost(account.available, price, leverage, account.fees, instrument, includeCloseFee)
  const liquidationGap =
    sizing.liquidationPrice === undefined ? undefined : Math.abs(sizing.liquidationPrice - price) / price
  return {
    side,
    price,
    marketPrice,
    sizing,
    issue,
    maxContracts,
    liquidationGap,
    canSubmit: sizing.contracts > 0 && !sizing.issue,
  }
}

/**
 * Order ticket laid out like the OKX perpetual order panel (measured 2026-11-27): open / close, margin mode and leverage cells, limit / market tabs,
 * one shared form (price with BBO, size read as cost, contracts or risk, percent slider, take-profit / stop-loss), a buy and a sell button side by side,
 * and the figures under them in two columns. Colours are KatanaUI tokens.
 */
export function OrderTicket({
  instrument,
  account,
  market,
  maxLeverage,
  defaultLeverage = 1,
  marginModes,
  hedged = false,
  defaultSide = 'buy',
  defaultSizingMode = 'cost',
  defaultAmount = '',
  defaultExits,
  includeCloseFee = true,
  exitTemplates,
  triggerPriceTypes,
  stopCustody = 'venue',
  price,
  defaultPrice,
  onPriceChange,
  locked = false,
  lockedReason,
  labels,
  locale,
  onSubmit,
  onLeverageChange,
  onMarginModeChange,
  onOpenCalculator,
  onOpenPositionBuilder,
  onTransfer,
  onOpenHelp,
  className,
}: {
  /** Contract spec and display names. */
  instrument: OrderTicketInstrument
  /** Balance, fee rates, maintenance margin rate and any held position. */
  account: OrderTicketAccount
  /** Last price, best bid / ask and the price limits. */
  market: OrderTicketMarket
  /** Highest leverage allowed; leave out for spot and unlevered venues, which hides the leverage controls. */
  maxLeverage?: number
  /** Starting leverage. */
  defaultLeverage?: number
  /** Margin modes on offer; leave out to hide the selector. */
  marginModes?: readonly MarginMode[]
  /** Long / short (hedge) position mode: shows the Open / Close switch; Close orders are reduce-only. */
  hedged?: boolean
  /** The side the exit templates fill for (templates are percent distances, and take-profit sits above the entry only for a long). */
  defaultSide?: OrderSide
  /** How the size box is read at first: cost (default), quantity or risk. */
  defaultSizingMode?: SizingMode
  /** Starting text of the size box. */
  defaultAmount?: string
  /** Starting take-profit and stop-loss prices; giving either opens the exits section (the buy entry wins when both sides are given). */
  defaultExits?: Partial<Record<OrderSide, { takeProfit?: string; stopLoss?: string }>>
  /** Count the estimated closing fee in the cost. */
  includeCloseFee?: boolean
  /** Saved exit templates, as percent distances from the entry. */
  exitTemplates?: readonly ExitTemplate[]
  /** Where stops live: held by the venue, or triggered locally. */
  stopCustody?: StopCustody
  /** Trigger prices the venue accepts for TP / SL, first is the default; leave out to hide the selector. */
  triggerPriceTypes?: readonly TriggerPriceType[]
  /**
   * Limit price text (controlled), such as a level clicked in an order book. The ticket has one price box now: `buy` wins, then `sell`.
   * 受控价格：现在只有一个价格框，取 buy，没有就取 sell。
   */
  price?: Partial<Record<OrderSide, string>>
  /** Uncontrolled: starting limit price text; defaults to the last price on the tick. */
  defaultPrice?: Partial<Record<OrderSide, string>>
  /** Called with the new text when the price box is typed in, stepped or the best-price button is pressed (once per side, so callers that kept two prices stay in step). */
  onPriceChange?: (price: string, side: OrderSide) => void
  /** Trading is locked: both submit buttons are disabled, the panel still computes and keeps what was typed. */
  locked?: boolean
  /** Why trading is locked, written under the buttons and read as their description; shown only while locked. */
  lockedReason?: string
  /** All visible text and accessible names. */
  labels: OrderTicketLabels
  /** BCP 47 tag for number formatting, defaults to the browser language. */
  locale?: string
  /** Called with the order when a submit button is clicked. */
  onSubmit: (order: OrderDraft) => void
  /** Called when the leverage changes. */
  onLeverageChange?: (leverage: number) => void
  /** Called when the margin mode changes. */
  onMarginModeChange?: (mode: MarginMode) => void
  /** Called when the calculator button is clicked; leave out to hide the button. */
  onOpenCalculator?: () => void
  /** Called when the position builder button is clicked; leave out (or leave `labels.positionBuilder` out) to hide it. */
  onOpenPositionBuilder?: () => void
  /** Called when the plus next to the available balance is clicked (deposit / transfer); leave out to hide it. */
  onTransfer?: () => void
  /** Called when the help icon next to the order type tabs is clicked (explain limit and market orders); leave out (or leave `labels.help` out) to hide it. */
  onOpenHelp?: () => void
  /** Extra class name on the panel. */
  className?: string
}) {
  const [action, setAction] = useState<OrderAction>('open')
  const [type, setType] = useState<OrderType>('limit')
  const [leverage, setLeverage] = useState(maxLeverage ? defaultLeverage : 1)
  const [marginMode, setMarginMode] = useState<MarginMode | undefined>(marginModes?.[0])
  const [leverageOpen, setLeverageOpen] = useState(false)
  // 价格：受控与不受控照 OrderBook 的 tick，给了 price 就显示它。
  const [innerPriceText, setInnerPriceText] = useState(
    () => defaultPrice?.buy ?? defaultPrice?.sell ?? toTick(market.last, instrument.tickSize),
  )
  const priceText = price?.buy ?? price?.sell ?? innerPriceText
  const setPriceText = (text: string) => {
    setInnerPriceText(text)
    onPriceChange?.(text, 'buy')
    onPriceChange?.(text, 'sell')
  }
  const [mode, setMode] = useState<SizingMode>(defaultSizingMode)
  const [amountText, setAmountText] = useState(defaultAmount)
  const initialExits = defaultExits?.buy ?? defaultExits?.sell
  const [exitsOpen, setExitsOpen] = useState(Boolean(initialExits?.takeProfit || initialExits?.stopLoss))
  const [takeProfitText, setTakeProfitText] = useState(initialExits?.takeProfit ?? '')
  const [stopLossText, setStopLossText] = useState(initialExits?.stopLoss ?? '')
  const [templateId, setTemplateId] = useState('')
  const [exitUnit, setExitUnit] = useState<ExitUnit>('price')
  const [triggerPrice, setTriggerPrice] = useState<TriggerPriceType | undefined>(triggerPriceTypes?.[0])
  const ids = useId()
  const format = ticketFormat(locale, instrument.tickSize, instrument.lotSize)
  const percentFormat = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 3 })
  const levered = Boolean(maxLeverage)
  const closing = hedged && action === 'close'
  const quote = instrument.quote

  const sizingMode: SizingMode = closing ? 'quantity' : mode
  const amount = parseAmount(amountText)
  // 按风险的填法离不开止损价，所以这时止盈止损一栏强制展开。
  const exitsShown = !closing && (exitsOpen || mode === 'risk')
  const input = {
    type,
    priceText,
    market,
    instrument,
    account,
    leverage,
    levered,
    includeCloseFee,
    sizingMode,
    amount,
    takeProfit: Number.NaN,
    stopLoss: Number.NaN,
    closing,
  }
  // 按风险的填法要先有止损价才算得出张数，盈亏额又要先有张数，两头互等：这时盈亏额不给选，按价格读。
  const unitOptions = (['price', 'change', 'roe', 'pnl'] as const).filter(
    (unit) =>
      unit === 'price' ||
      (labels.exitUnits?.[unit] && !(unit === 'pnl' && mode === 'risk') && !(unit === 'roe' && !levered)),
  )
  const unit: ExitUnit = unitOptions.includes(exitUnit) ? exitUnit : 'price'
  // 先不带止盈止损算一遍拿入场价与张数（盈亏额换算要用），再按单位给两个方向各换出触发价。
  const bare: Record<OrderSide, SideFigures> = { buy: figuresFor('buy', input), sell: figuresFor('sell', input) }
  const exitPriceOf = (kind: 'tp' | 'sl', side: OrderSide) =>
    exitsShown
      ? resolveExitPrice({
          kind,
          side,
          value: parseAmount(kind === 'tp' ? takeProfitText : stopLossText),
          unit,
          entry: bare[side].price,
          leverage: levered ? leverage : 1,
          contracts: bare[side].sizing.contracts,
          spec: instrument,
          fees: account.fees,
        })
      : Number.NaN
  const figures: Record<OrderSide, SideFigures> = {
    buy: figuresFor('buy', { ...input, takeProfit: exitPriceOf('tp', 'buy'), stopLoss: exitPriceOf('sl', 'buy') }),
    sell: figuresFor('sell', { ...input, takeProfit: exitPriceOf('tp', 'sell'), stopLoss: exitPriceOf('sl', 'sell') }),
  }
  const sides = ['buy', 'sell'] as const

  // 滑杆按两个方向里较小的可开张数走：停在 100% 时两边都不超可用。
  const maxContracts = Math.min(figures.buy.maxContracts, figures.sell.maxContracts)
  const percent =
    sizingMode === 'cost'
      ? account.available > 0 && amount > 0
        ? Math.min(100, (amount / account.available) * 100)
        : 0
      : maxContracts > 0 && amount > 0
        ? Math.min(100, (amount / maxContracts) * 100)
        : 0

  function applyPercent(value: number) {
    if (sizingMode === 'cost') setAmountText(value === 0 ? '' : ((account.available * value) / 100).toFixed(2))
    else setAmountText(value === 0 ? '' : String(floorToStep((maxContracts * value) / 100, instrument.lotSize)))
  }

  function applyTemplate(id: string) {
    setTemplateId(id)
    const template = exitTemplates?.find((item) => item.id === id)
    const entry = figures[defaultSide].price
    if (!template || !(entry > 0)) return
    // 模板填的是价格：单位切回价格，免得把价格当百分比读。
    setExitUnit('price')
    const sign = defaultSide === 'buy' ? 1 : -1
    setTakeProfitText(template.takeProfit ? toTick(entry * (1 + sign * template.takeProfit), instrument.tickSize) : '')
    setStopLossText(template.stopLoss ? toTick(entry * (1 - sign * template.stopLoss), instrument.tickSize) : '')
  }

  function stepPrice(direction: 1 | -1) {
    const current = parseAmount(priceText)
    const base = Number.isNaN(current) ? figures.buy.marketPrice : current
    setPriceText(toTick(Math.max(instrument.tickSize, base + direction * instrument.tickSize), instrument.tickSize))
  }

  function setLeverageTo(next: number) {
    setLeverage(next)
    onLeverageChange?.(next)
  }

  const amountUnit = sizingMode === 'quantity' ? instrument.sizeUnit : quote
  const lockedId = `${ids}-locked`
  const exitsId = `${ids}-exits`
  // 问题行：止盈止损共用一份，止损在盈利一侧只会对一个方向成立（空头的止损本来就在上面），所以这类单向的问题不写成一直亮着的红字，
  // 只让对应方向的钮灰掉、钮上挂 title 说明；其余问题（数量太小、超可用、按风险缺止损）两个方向一样，写一行。
  const issues = sides.flatMap((side) => (figures[side].issue ? [{ side, issue: figures[side].issue }] : []))
  const shownIssues = issues.filter(
    (item) =>
      item.issue !== 'stop-wrong-side' || (issues.every((other) => other.issue === item.issue) && issues.length === 2),
  )
  const sameIssue = shownIssues.length === 2 && shownIssues[0]?.issue === shownIssues[1]?.issue
  const issueRows = sameIssue ? [shownIssues[0]!] : shownIssues
  const filled = sides.some((side) => figures[side].sizing.contracts > 0)
  const dash = '--'
  const fieldLabelNode = (text: string) => <span>{text}</span>
  const priceId = `${ids}-price`
  const amountId = `${ids}-amount`
  const takeProfitId = `${ids}-tp`
  const stopLossId = `${ids}-sl`
  const exitsSwitchId = `${ids}-exits-switch`

  return (
    <div
      data-slot="order-ticket"
      className={cn(
        'k-text-data box-border flex w-full min-w-0 flex-col bg-surface-1 px-4 pt-3 pb-[10px] font-normal',
        // 本件的三档灰（盘子里的框、格、分组底）：Graphite 的 editable 底（4% 白）比 OKX 的框（约 13% 白）浅得多，这里取最近的现成 token，集中在这三个变量，要换成专门的 token 只改这里。
        '[--ticket-field-hover:var(--k-selectable-bold-background)] [--ticket-field:var(--k-selectable-background-selected)] [--ticket-group:var(--k-container-subtle-background)] [--ticket-cell:var(--k-selectable-bold-background)]',
        className,
      )}
    >
      {hedged ? (
        // 开仓 / 平仓：灰底的两格，选中的整格填 --pnl-up（OKX 也是绿的），高 30、内边 3.5。
        <ToggleGroup
          data-slot="ticket-action"
          aria-label={labels.action}
          fullWidth
          value={action}
          onValueChange={(value) => setAction(value as OrderAction)}
          className="mb-2 box-border h-9 gap-0 rounded-[var(--radius-control)] border-0 bg-(--ticket-group) p-1"
        >
          {(['open', 'close'] as const).map((value) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="k-text-body h-full rounded-[var(--radius-inner)] font-normal text-ink-3 data-[state=on]:bg-(--pnl-up) data-[state=on]:font-medium data-[state=on]:text-(color:--k-surface-sunken-background)"
            >
              {labels.actions[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}

      {levered ? (
        // 保证金模式与杠杆：两个灰色的格，各带一个下拉箭头（OKX 同款；保证金模式是下拉，不再是分段）。
        <div className="mb-[11px] grid h-8 grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-inner)]">
          {marginModes && marginMode ? (
            <Select
              value={marginMode}
              onValueChange={(value) => {
                setMarginMode(value as MarginMode)
                onMarginModeChange?.(value as MarginMode)
              }}
            >
              <SelectTrigger
                data-slot="ticket-margin-mode"
                aria-label={labels.marginMode}
                className="k-text-body h-full min-w-0 justify-center rounded-none border-0 bg-(--ticket-cell) px-2 font-normal text-ink"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {marginModes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labels.marginModes[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span />
          )}
          <Popover open={leverageOpen} onOpenChange={setLeverageOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-slot="ticket-leverage-cell"
                aria-label={`${labels.leverage} ${leverage}×`}
                className={cn(
                  'k-text-body flex h-full min-w-0 cursor-pointer items-center justify-center gap-1.5 border-0 bg-(--ticket-cell) px-2 font-normal text-ink tabular-nums',
                  focusRing,
                )}
              >
                {leverage}×
                <ChevronDown aria-hidden="true" className="size-[10px] text-ink-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="flex flex-col gap-2">
                <TicketField
                  label={labels.leverage}
                  unit="×"
                  slot="ticket-leverage"
                  value={String(leverage)}
                  onValueChange={(text) => {
                    const next = clamp(Math.floor(parseAmount(text)), 1, maxLeverage ?? 1)
                    if (Number.isNaN(next)) return
                    setLeverageTo(next)
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {[1, 5, 10, 25, 50, 100, maxLeverage ?? 1]
                    .filter((value, index, all) => value <= (maxLeverage ?? 1) && all.indexOf(value) === index)
                    .map((value) => (
                      <Button key={value} size="sm" className="px-2" onClick={() => setLeverageTo(value)}>
                        {value}×
                      </Button>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ) : null}

      <Tabs value={type} onValueChange={(value) => setType(value as OrderType)} className="gap-0">
        <div className="relative">
          <TabsList
            variant="line"
            aria-label={labels.orderType}
            data-slot="ticket-type"
            className="h-9 w-full justify-start gap-4"
          >
            {(['limit', 'market'] as const).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="k-text-data h-full rounded-none px-0 font-normal text-ink-3 data-[state=active]:font-normal"
              >
                {labels.orderTypes[value]}
              </TabsTrigger>
            ))}
          </TabsList>
          {onOpenHelp && labels.help ? (
            <button
              type="button"
              aria-label={labels.help}
              onClick={onOpenHelp}
              className={cn(
                'absolute top-1/2 right-0 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink-3 hover:text-ink',
                focusRing,
              )}
            >
              <CircleHelp aria-hidden="true" className="size-[15px]" />
            </button>
          ) : null}
        </div>
        {/* 一个常驻的页签面板：两种委托类型共用同一份表单，换页签不重建，填过的数留着。 */}
        <TabsContent value={type} forceMount className="mt-[10px] flex flex-col">
          {type === 'limit' ? (
            <div className="flex flex-col gap-[6px]">
              <BoxLabel htmlFor={priceId}>{fieldLabelNode(`${labels.price} (${quote})`)}</BoxLabel>
              <BoxInput
                id={priceId}
                slot="ticket-price"
                value={priceText}
                onValueChange={setPriceText}
                stepper={
                  labels.stepUp && labels.stepDown
                    ? { up: labels.stepUp, down: labels.stepDown, onStep: stepPrice }
                    : undefined
                }
                trailing={
                  <BoxButton onClick={() => setPriceText(toTick(figures.buy.marketPrice, instrument.tickSize))}>
                    {labels.best}
                  </BoxButton>
                }
              />
            </div>
          ) : null}

          <div className={cn('flex flex-col gap-[6px]', type === 'limit' && 'mt-[6px]')}>
            <BoxLabel htmlFor={amountId}>
              {closing ? (
                `${labels.sizingModes.quantity} (${instrument.sizeUnit})`
              ) : (
                <Select
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as SizingMode)
                    setAmountText('')
                  }}
                >
                  <SelectTrigger
                    aria-label={labels.sizingMode}
                    className="k-text-data h-4 min-w-0 justify-start gap-1 rounded-none border-0 bg-transparent px-0 font-normal text-ink-2"
                  >
                    <SelectValue>
                      {labels.sizingModes[mode]} ({amountUnit})
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(['cost', 'quantity', 'risk'] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {labels.sizingModes[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </BoxLabel>
            <BoxInput
              id={amountId}
              slot="ticket-amount"
              label={labels.sizingModes[sizingMode]}
              placeholder={
                sizingMode === 'quantity' && labels.contractValue
                  ? `${labels.contractValue} ${instrument.contractValue} ${instrument.base}`
                  : '0'
              }
              invalid={sides.every((side) => {
                const issue = figures[side].issue
                return issue === 'below-min' || issue === 'exceeds-available'
              })}
              value={amountText}
              onValueChange={setAmountText}
            />
          </div>

          {sizingMode === 'risk' || closing ? null : (
            <div className="mt-[5px]">
              <PercentSlider value={percent} onValueChange={applyPercent} label={labels.percent} />
            </div>
          )}

          {closing ? null : (
            <div className="mt-[3px] flex flex-col">
              <div className="flex items-center justify-between">
                <InfoLine label={labels.available}>
                  <span data-slot="ticket-available">
                    {format.money(account.available)} {quote}
                  </span>
                </InfoLine>
                {onTransfer && labels.transfer ? (
                  <button
                    type="button"
                    aria-label={labels.transfer}
                    onClick={onTransfer}
                    className={cn(
                      'flex size-4 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink hover:text-ink-2',
                      focusRing,
                    )}
                  >
                    <CirclePlus aria-hidden="true" className="size-[14px]" />
                  </button>
                ) : null}
              </div>
              <div className="flex justify-between">
                {sides.map((side) => (
                  <InfoLine key={side} label={labels.maxOpen[side]} end={side === 'sell'} dashed={false}>
                    <span data-slot="ticket-max" data-side={side}>
                      {account.available > 0 || figures[side].maxContracts > 0
                        ? `${format.size(figures[side].maxContracts)} ${instrument.sizeUnit}`
                        : `${dash} ${instrument.sizeUnit}`}
                    </span>
                  </InfoLine>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {closing ? null : (
        // 止盈止损（用户 2026-11-27：方的勾选框丑、排版要重新设计）：标题行右边是拨动开关；展开后一排单位分段、
        // 止盈与止损各一个框（标签在框内左边，单位在框内右边，不占框外的行），框下一行按方向写换出来的触发价，最底下触发价类型与托管方式。
        <div className="mt-[14px] flex flex-col gap-[10px] border-t border-(color:--k-separable-bold-borderColor) pt-[10px]">
          <div className="flex h-7 items-center justify-between gap-2">
            <label htmlFor={exitsSwitchId} className="k-text-data cursor-pointer font-semibold text-ink">
              {labels.exits}
            </label>
            <div className="flex items-center gap-1">
              {exitsShown && exitTemplates?.length ? (
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger
                    aria-label={labels.exitTemplate}
                    className="k-text-data h-6 w-auto min-w-0 gap-1 rounded-none border-0 bg-transparent px-1 font-normal text-ink-3"
                  >
                    <SelectValue placeholder={labels.exitTemplate} />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {exitTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Switch
                id={exitsSwitchId}
                data-slot="ticket-exits-switch"
                aria-controls={exitsShown ? exitsId : undefined}
                checked={exitsShown}
                disabled={mode === 'risk'}
                onCheckedChange={(checked) => setExitsOpen(checked === true)}
              />
            </div>
          </div>
          {exitsShown ? (
            <div id={exitsId} className="flex flex-col gap-[10px]">
              {unitOptions.length > 1 ? (
                <ToggleGroup
                  data-slot="ticket-exit-unit"
                  aria-label={labels.exitUnit ?? labels.exits}
                  fullWidth
                  value={unit}
                  onValueChange={(value) => {
                    if (!value) return
                    setExitUnit(value as ExitUnit)
                    setTakeProfitText('')
                    setStopLossText('')
                  }}
                  className="box-border h-7 gap-0 rounded-[var(--radius-control)] border-0 bg-(--ticket-group) p-[3px]"
                >
                  {unitOptions.map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="k-text-data h-full rounded-[var(--radius-inner)] font-normal text-ink-3 data-[state=on]:bg-(--ticket-field-hover) data-[state=on]:font-medium data-[state=on]:text-ink"
                    >
                      {value === 'price' ? (labels.exitUnits?.price ?? quote) : labels.exitUnits?.[value]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}
              {(['tp', 'sl'] as const).map((kind) => {
                const id = kind === 'tp' ? takeProfitId : stopLossId
                const text = kind === 'tp' ? takeProfitText : stopLossText
                // 框下只写换出来的触发价（按价格填时不写，框里就是）；预计盈亏在下面的明细里有，这里不重复（同屏同一个数只出现一次）。
                const estimates = sides.map((side) => ({ side, price: exitPriceOf(kind, side) }))
                const shown = unit !== 'price' && text !== '' && estimates.some((item) => item.price > 0)
                return (
                  <div key={kind} className="flex flex-col gap-[4px]">
                    <BoxInput
                      id={id}
                      label={kind === 'tp' ? labels.takeProfit : labels.stopLoss}
                      slot={kind === 'tp' ? 'ticket-take-profit' : 'ticket-stop-loss'}
                      prefix={kind === 'tp' ? labels.takeProfit : labels.stopLoss}
                      suffix={unit === 'price' || unit === 'pnl' ? quote : '%'}
                      invalid={
                        kind === 'sl' &&
                        sides.every((side) => {
                          const issue = figures[side].issue
                          return issue === 'no-stop' || issue === 'stop-wrong-side'
                        })
                      }
                      value={text}
                      onValueChange={kind === 'tp' ? setTakeProfitText : setStopLossText}
                    />
                    {shown ? (
                      <div
                        data-slot={`ticket-${kind}-readout`}
                        className="k-text-caption grid grid-cols-2 gap-2 tabular-nums text-ink-3"
                      >
                        {estimates.map(({ side, price: exitPrice }) => (
                          <span key={side} className={cn('truncate', side === 'sell' && 'text-right')}>
                            {labels.exitSides?.[side] ?? labels[side]} {exitPrice > 0 ? format.price(exitPrice) : dash}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
              <div className="flex h-5 items-center justify-between gap-2">
                {triggerPriceTypes?.length && labels.triggerPrice && labels.triggerPrices && triggerPrice ? (
                  <Select value={triggerPrice} onValueChange={(value) => setTriggerPrice(value as TriggerPriceType)}>
                    <SelectTrigger
                      aria-label={labels.triggerPrice}
                      data-slot="ticket-trigger-price"
                      className="k-text-data h-5 w-auto min-w-0 gap-1 rounded-none border-0 bg-transparent px-0 font-normal text-ink-3"
                    >
                      <span>{labels.triggerPrice}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      {triggerPriceTypes.map((value) => (
                        <SelectItem key={value} value={value}>
                          {labels.triggerPrices?.[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span />
                )}
                <span
                  data-slot="ticket-custody"
                  data-custody={stopCustody}
                  className={cn(
                    'k-text-data',
                    stopCustody === 'venue' ? 'text-ink-3' : 'text-(color:--k-status-warn-foreground)',
                  )}
                >
                  {labels.custody[stopCustody]}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {issueRows.length ? (
        <div role="alert" data-slot="ticket-issue" className="k-text-caption mt-[8px] flex flex-col text-danger">
          {issueRows.map(({ side, issue }) => (
            <span key={side}>
              {sameIssue ? '' : `${labels[side]}: `}
              {labels.issues[issue!]}
            </span>
          ))}
        </div>
      ) : null}

      <div role="group" aria-label={labels.side} className="mt-[19px] grid grid-cols-2 gap-2">
        {sides.map((side) => (
          <button
            key={side}
            type="button"
            data-slot="ticket-submit"
            data-side={side}
            data-locked={locked || undefined}
            disabled={Boolean(figures[side].issue) || locked}
            title={figures[side].issue ? labels.issues[figures[side].issue] : undefined}
            aria-describedby={locked && lockedReason ? lockedId : undefined}
            onClick={() => {
              // 还没填数量：不下单，把光标带到数量框（OKX 在这里弹提示；我们的框已经在上面，指过去就够）。
              if (!figures[side].canSubmit) {
                document.getElementById(amountId)?.focus()
                return
              }
              onSubmit({
                side,
                type,
                price: type === 'limit' ? figures[side].price : undefined,
                contracts: figures[side].sizing.contracts,
                leverage,
                marginMode,
                reduceOnly: closing,
                takeProfit: figures[side].sizing.takeProfit?.price,
                stopLoss: figures[side].sizing.stopLoss?.price,
                triggerPrice:
                  figures[side].sizing.takeProfit || figures[side].sizing.stopLoss ? triggerPrice : undefined,
                sizing: figures[side].sizing,
              })
            }}
            className={cn(
              'h-10 min-w-0 cursor-pointer truncate rounded-full text-[14px] border-0 px-2 font-semibold text-(color:--k-surface-sunken-background)',
              'transition-[filter,scale] duration-150 disabled:cursor-not-allowed disabled:opacity-45 not-disabled:hover:brightness-110 not-disabled:active:scale-[0.97]',
              side === 'buy' ? 'bg-(--pnl-up)' : 'bg-(--pnl-down)',
              focusRing,
            )}
          >
            {closing ? labels.submitClose[side] : labels.submit[side]}
          </button>
        ))}
      </div>
      {locked && lockedReason ? (
        <p
          id={lockedId}
          data-slot="ticket-locked"
          className="k-text-caption m-0 mt-[6px] flex items-center gap-1 text-(color:--k-status-warn-foreground)"
        >
          <Lock aria-hidden="true" className="size-3 shrink-0" />
          {lockedReason}
        </p>
      ) : null}

      <dl data-slot="ticket-summary" aria-live="polite" className="m-0 mt-[3px] flex flex-col">
        {levered && !closing ? (
          <div className="grid grid-cols-2 gap-x-3">
            {sides.map((side) => (
              <InfoLine key={side} label={labels.margin} end={side === 'sell'}>
                <span data-slot="ticket-margin" data-side={side}>
                  {figures[side].sizing.contracts > 0 ? `${format.money(figures[side].sizing.margin)} ${quote}` : dash}
                </span>
              </InfoLine>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-x-3">
          {sides.map((side) => (
            <InfoLine key={side} label={labels.notional} end={side === 'sell'}>
              <span data-slot="ticket-notional" data-side={side}>
                {figures[side].sizing.contracts > 0 ? `${format.money(figures[side].sizing.notional)} ${quote}` : dash}
              </span>
            </InfoLine>
          ))}
        </div>
        {market.maxBuy !== undefined && market.minSell !== undefined && labels.maxBuyPrice && labels.minSellPrice ? (
          <div className="grid grid-cols-2 gap-x-3">
            <InfoLine label={labels.maxBuyPrice} dashed={false}>
              <span data-slot="ticket-max-buy">{format.price(market.maxBuy)}</span>
            </InfoLine>
            <InfoLine label={labels.minSellPrice} end dashed={false}>
              <span data-slot="ticket-min-sell">{format.price(market.minSell)}</span>
            </InfoLine>
          </div>
        ) : null}
        {filled ? (
          <TicketDetails
            figures={figures}
            labels={labels}
            format={format}
            quote={quote}
            instrument={instrument}
            locale={locale}
            closing={closing}
            account={account}
          />
        ) : null}
      </dl>

      <div className="k-text-data mt-[10px] flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 font-normal text-ink-3 tabular-nums">
        <span data-slot="ticket-fee-rate" className="whitespace-nowrap">
          <span className={dashedLabel}>{labels.feeRate}</span> {percentFormat.format(account.fees.open)} /{' '}
          {percentFormat.format(account.fees.close)}
        </span>
        {onOpenCalculator ? (
          <button
            type="button"
            onClick={onOpenCalculator}
            className={cn(
              'flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-ink hover:text-ink-2 whitespace-nowrap',
              focusRing,
            )}
          >
            <Calculator aria-hidden="true" className="size-[13px]" />
            {labels.calculator}
          </button>
        ) : null}
        {onOpenPositionBuilder && labels.positionBuilder ? (
          <button
            type="button"
            onClick={onOpenPositionBuilder}
            className={cn(
              'flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-ink hover:text-ink-2 whitespace-nowrap',
              focusRing,
            )}
          >
            <Layers aria-hidden="true" className="size-[13px]" />
            {labels.positionBuilder}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** 填了数量以后才出现的明细：两个方向的张数、手续费、总占用、强平价、保本价、止盈止损盈亏、盈亏比、成交后均价，三栏（标签 | 买 | 卖）。 */
function TicketDetails({
  figures,
  labels,
  format,
  quote,
  instrument,
  locale,
  closing,
  account,
}: {
  figures: Record<OrderSide, SideFigures>
  labels: OrderTicketLabels
  format: ReturnType<typeof ticketFormat>
  quote: string
  instrument: OrderTicketInstrument
  locale: string | undefined
  closing: boolean
  account: OrderTicketAccount
}) {
  const sides = ['buy', 'sell'] as const
  const row = (
    key: string,
    label: string,
    slot: string,
    cell: (side: OrderSide) => { text: string; tone?: 'up' | 'down'; strong?: boolean } | undefined,
    note?: string,
  ) => {
    const cells = sides.map((side) => cell(side))
    if (cells.every((item) => item === undefined)) return null
    return (
      <Fragment key={key}>
        <dt className="text-ink-3">
          {label}
          {note ? <span className="ml-1">{note}</span> : null}
        </dt>
        {sides.map((side, index) => (
          <dd
            key={side}
            data-slot={slot}
            data-side={side}
            className={cn(
              'm-0 text-right tabular-nums text-ink-2',
              cells[index]?.strong && 'text-ink',
              cells[index]?.tone === 'up' && 'text-(color:--pnl-up)',
              cells[index]?.tone === 'down' && 'text-(color:--pnl-down)',
            )}
          >
            {cells[index]?.text ?? ''}
          </dd>
        ))}
      </Fragment>
    )
  }
  return (
    <div
      data-slot="ticket-details"
      className="k-text-caption mt-[6px] grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-[3px] border-t border-(color:--k-separable-secondary-borderColor) pt-[6px] font-normal"
    >
      <span />
      {sides.map((side) => (
        <span key={side} className="text-right text-ink-3">
          {labels[side]}
        </span>
      ))}
      {row('size', labels.size, 'ticket-size', (side) => ({
        text: `${format.size(figures[side].sizing.contracts)} ${instrument.sizeUnit} ≈ ${figures[side].sizing.baseQuantity.toLocaleString(locale, { maximumFractionDigits: 6 })} ${instrument.base}`,
      }))}
      {row('fees', labels.fees, 'ticket-fees', (side) => ({
        text: closing
          ? `${format.money(figures[side].sizing.closeFee)} ${quote}`
          : `${format.money(figures[side].sizing.openFee)} + ${format.money(figures[side].sizing.closeFee)} ${quote}`,
      }))}
      {closing
        ? null
        : row('cost', labels.cost, 'ticket-cost', (side) => ({
            text: `${format.money(figures[side].sizing.cost)} ${quote}`,
            strong: true,
          }))}
      {closing
        ? null
        : row(
            'liq',
            labels.liquidation,
            'ticket-liquidation',
            (side) => {
              const { sizing, liquidationGap } = figures[side]
              return sizing.liquidationPrice === undefined || liquidationGap === undefined
                ? undefined
                : { text: `${format.price(sizing.liquidationPrice)} (${format.percent(liquidationGap)})` }
            },
            labels.estimate,
          )}
      {closing
        ? null
        : row('breakeven', labels.breakeven, 'ticket-breakeven', (side) =>
            figures[side].sizing.contracts > 0 ? { text: format.price(figures[side].sizing.breakeven) } : undefined,
          )}
      {row('tp', labels.takeProfit, 'ticket-tp-pnl', (side) => {
        const exit = figures[side].sizing.takeProfit
        return exit ? { text: `${format.signed(exit.pnl)} ${quote}`, tone: exit.pnl >= 0 ? 'up' : 'down' } : undefined
      })}
      {row('sl', labels.stopLoss, 'ticket-sl-pnl', (side) => {
        const exit = figures[side].sizing.stopLoss
        return exit ? { text: `${format.signed(exit.pnl)} ${quote}`, tone: exit.pnl >= 0 ? 'up' : 'down' } : undefined
      })}
      {row('rr', labels.rewardRisk, 'ticket-rr', (side) => {
        const ratio = figures[side].sizing.rewardRisk
        return ratio === undefined ? undefined : { text: `${ratio.toFixed(2)} : 1` }
      })}
      {account.position
        ? row('avg', labels.averageAfter, 'ticket-average', (side) => {
            const after = figures[side].sizing.after
            return after && after.size > 0
              ? { text: `${format.price(after.entryPrice)} · ${format.size(after.size)} ${instrument.sizeUnit}` }
              : undefined
          })
        : null}
    </div>
  )
}
