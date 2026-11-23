// SPDX-License-Identifier: MIT
// 下单面板（#96，用户 2026-11-19 定）。版式照 OKX 永续交易页的下单面板（2026-11-19 两次实际打开看，未登录）：
// 顶上开仓 / 平仓，一条「保证金模式 | 杠杆」，文字页签的委托类型；下面买、卖各一栏并排，每栏自己的价格（带最优价）、数量、
// 0–100% 滑杆、可用与可开、勾选后原地展开的止盈止损、一个整宽的下单钮（买绿卖红），钮下是保证金与订单价值；底部费率与计算器。
// 面板窄于 560px 时两栏并不下，改成顶上买 / 卖切换、一次只显示一栏。
// OKX 没有、我们加的：仓位框可按成本 / 数量 / 风险三种填法（按风险取自 ATAS Beta 8.0.16，https://feedback.atas.net/de/changelog ），
// 出场模板（ATAS Exit Strategy，https://start.atas.net/step-3.-start-trading-with-atas/exit-strategies ），钮下多列手续费、总占用、预估强平价、保本价、盈亏比。
// 只取「给用户看什么、怎么交互」，实现原创。TradingView 的下单面板不参照（用户定）。
// 受控价格（#176）：price / onPriceChange 让订单簿点一档回填限价。交互照 TradingView 的 DOM：点一档就是按这档价下限价单、默认先弹确认
// （帮助中心「Depth of market (DOM)」，2026-11-23 读）；这里点档只回填两栏的限价，下单仍走下单钮与调用方的确认。
// 点档时是否顺带切回限价页签，TradingView 页面没写，待核对；这里不切。
// 锁住态（#176）：locked 时两个下单钮都灰掉，lockedReason 写在钮下（警示色加锁形图标），钮经 aria-describedby 读到它；面板照样算数。
// 面板只算和显示：账户、费率、合约规格由调用方传，下单是 onSubmit 回调；文字全走 labels。
import { Calculator, Lock } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { Button } from '../primitives/button.tsx'
import { Checkbox } from '../primitives/checkbox.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { Slider } from '../primitives/slider.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { ReadoutRow, SideSwitch, TicketField, parseAmount, ticketFormat, toTick } from './order-ticket-parts.tsx'
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

export type OrderTicketMarket = { last: number; bid?: number; ask?: number }

/** 出场模板（ATAS 的 Exit Strategy）：止盈、止损各是离入场价的百分比（0.02 是 2%），选了就按这一栏的方向填进两个框。 */
export type ExitTemplate = { id: string; name: string; takeProfit?: number; stopLoss?: number }

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
}

const PERCENT_STOPS = [0, 25, 50, 75, 100] as const

type SharedProps = {
  instrument: OrderTicketInstrument
  account: OrderTicketAccount
  market: OrderTicketMarket
  type: OrderType
  action: OrderAction
  leverage: number
  levered: boolean
  marginMode?: MarginMode
  includeCloseFee: boolean
  exitTemplates?: readonly ExitTemplate[]
  stopCustody: StopCustody
  defaultSizingMode: SizingMode
  locked: boolean
  lockedReason?: string
  labels: OrderTicketLabels
  locale?: string
  onSubmit: (order: OrderDraft) => void
  onPriceChange?: (price: string, side: OrderSide) => void
}

/** 一栏：这个方向的价格、数量、滑杆、止盈止损、下单钮与钮下的读数。两栏各管各的输入（OKX 两栏也是各填各的）。 */
function TicketSide({
  side,
  hidden,
  defaultAmount,
  defaultExits,
  instrument,
  account,
  market,
  type,
  action,
  leverage,
  levered,
  marginMode,
  includeCloseFee,
  exitTemplates,
  stopCustody,
  defaultSizingMode,
  locked,
  lockedReason,
  labels,
  locale,
  onSubmit,
  onPriceChange,
  price: priceProp,
  defaultPrice,
}: SharedProps & {
  side: OrderSide
  hidden: boolean
  defaultAmount: string
  defaultExits?: { takeProfit?: string; stopLoss?: string }
  price?: string
  defaultPrice?: string
}) {
  // 受控与不受控照 OrderBook 的 tick：给了 price 就显示它，自己的那份只在不受控时用。
  const [innerPriceText, setInnerPriceText] = useState(() => defaultPrice ?? toTick(market.last, instrument.tickSize))
  const priceText = priceProp ?? innerPriceText
  const setPriceText = (text: string) => {
    setInnerPriceText(text)
    onPriceChange?.(text, side)
  }
  const [mode, setMode] = useState<SizingMode>(defaultSizingMode)
  const [amountText, setAmountText] = useState(defaultAmount)
  const [exitsOpen, setExitsOpen] = useState(Boolean(defaultExits?.takeProfit || defaultExits?.stopLoss))
  const [takeProfitText, setTakeProfitText] = useState(defaultExits?.takeProfit ?? '')
  const [stopLossText, setStopLossText] = useState(defaultExits?.stopLoss ?? '')
  const [templateId, setTemplateId] = useState('')
  const exitsId = useId()
  const lockedId = useId()
  const format = ticketFormat(locale, instrument.tickSize, instrument.lotSize)
  const closing = action === 'close'

  // 市价单按对手价算：买看卖一，卖看买一，没有盘口就用最新价。
  const marketPrice = (side === 'buy' ? market.ask : market.bid) ?? market.last
  const price = type === 'market' ? marketPrice : parseAmount(priceText)
  const amount = parseAmount(amountText)
  // 平仓单不占新的保证金，只按数量填。
  const sizingMode: SizingMode = closing ? 'quantity' : mode
  // 按风险的填法离不开止损价，所以这时止盈止损一栏强制展开。
  const exitsShown = !closing && (exitsOpen || mode === 'risk')
  const takeProfit = exitsShown ? parseAmount(takeProfitText) : Number.NaN
  const stopLoss = exitsShown ? parseAmount(stopLossText) : Number.NaN

  const sizing = computeSizing({
    side,
    price,
    leverage,
    fees: account.fees,
    includeCloseFee,
    spec: instrument,
    mode: sizingMode,
    amount,
    takeProfit: Number.isNaN(takeProfit) ? undefined : takeProfit,
    stopLoss: Number.isNaN(stopLoss) ? undefined : stopLoss,
    maintenanceMarginRate: levered ? account.maintenanceMarginRate : undefined,
    available: closing ? undefined : account.available,
    position: account.position,
  })
  const issue = sizing.issue === 'no-price' || sizing.issue === 'no-amount' ? undefined : sizing.issue

  const maxContracts = contractsForCost(account.available, price, leverage, account.fees, instrument, includeCloseFee)
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
    if (!template || !(price > 0)) return
    const sign = side === 'buy' ? 1 : -1
    setTakeProfitText(template.takeProfit ? toTick(price * (1 + sign * template.takeProfit), instrument.tickSize) : '')
    setStopLossText(template.stopLoss ? toTick(price * (1 - sign * template.stopLoss), instrument.tickSize) : '')
  }

  const amountUnit = sizingMode === 'quantity' ? instrument.sizeUnit : instrument.quote
  const canSubmit = sizing.contracts > 0 && !sizing.issue
  const liquidationGap =
    sizing.liquidationPrice === undefined ? undefined : Math.abs(sizing.liquidationPrice - price) / price
  const quote = instrument.quote

  return (
    <div
      data-slot="ticket-form"
      data-side={side}
      className={cn('min-w-0 flex-col gap-2', hidden ? 'hidden @min-[560px]:flex' : 'flex')}
    >
      <TicketField
        label={labels.price}
        unit={quote}
        slot="ticket-price"
        disabled={type === 'market'}
        value={type === 'market' ? labels.marketPrice : priceText}
        onValueChange={setPriceText}
        trailing={
          <Button
            size="md"
            disabled={type === 'market'}
            onClick={() => setPriceText(toTick(marketPrice, instrument.tickSize))}
          >
            {labels.best}
          </Button>
        }
      />

      <TicketField
        label={labels.sizingModes[sizingMode]}
        labelNode={
          closing ? undefined : (
            <Select
              value={mode}
              onValueChange={(value) => {
                setMode(value as SizingMode)
                setAmountText('')
              }}
            >
              <SelectTrigger
                aria-label={labels.sizingMode}
                className="k-text-caption h-6 w-auto shrink-0 gap-1 border-0 bg-transparent px-0 text-ink-3"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['cost', 'quantity', 'risk'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {labels.sizingModes[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        unit={amountUnit}
        slot="ticket-amount"
        placeholder="0"
        invalid={issue === 'below-min' || issue === 'exceeds-available'}
        value={amountText}
        onValueChange={setAmountText}
      />

      {sizingMode === 'risk' || closing ? null : (
        <div className="px-1 pt-1">
          <Slider
            value={[percent]}
            min={0}
            max={100}
            step={1}
            thumbLabels={[labels.percent]}
            onValueChange={([value]) => applyPercent(value ?? 0)}
          />
          <div className="k-text-caption mt-1 flex justify-between text-ink-4 tabular-nums">
            {PERCENT_STOPS.map((stop) => (
              <button
                key={stop}
                type="button"
                tabIndex={-1}
                className="cursor-pointer border-0 bg-transparent p-0 text-inherit hover:text-ink-2"
                onClick={() => applyPercent(stop)}
              >
                {stop}%
              </button>
            ))}
          </div>
        </div>
      )}

      {closing ? null : (
        <div className="k-text-caption flex flex-col gap-0.5 text-ink-3 tabular-nums">
          <div className="flex justify-between">
            <span>{labels.available}</span>
            <span data-slot="ticket-available">
              {format.money(account.available)} {quote}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{labels.maxOpen[side]}</span>
            <span data-slot="ticket-max">
              {format.size(maxContracts)} {instrument.sizeUnit}
            </span>
          </div>
        </div>
      )}

      {closing ? null : (
        <div className="flex flex-col gap-2 border-t border-line pt-2">
          <div className="flex items-center justify-between gap-2">
            <label className="k-text-body flex cursor-pointer items-center gap-2 text-ink-2">
              <Checkbox
                aria-controls={exitsId}
                checked={exitsShown}
                disabled={mode === 'risk'}
                onCheckedChange={(checked) => setExitsOpen(checked === true)}
              />
              {labels.exits}
            </label>
            {exitsShown ? (
              <span
                data-slot="ticket-custody"
                data-custody={stopCustody}
                className={cn(
                  'k-text-caption',
                  stopCustody === 'venue' ? 'text-ink-3' : 'text-(color:--k-status-warn-foreground)',
                )}
              >
                {labels.custody[stopCustody]}
              </span>
            ) : null}
          </div>
          {exitsShown ? (
            <div id={exitsId} className="flex flex-col gap-2">
              {exitTemplates?.length ? (
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger aria-label={labels.exitTemplate}>
                    <SelectValue placeholder={labels.noTemplate} />
                  </SelectTrigger>
                  <SelectContent>
                    {exitTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <TicketField
                label={labels.takeProfit}
                unit={quote}
                slot="ticket-take-profit"
                value={takeProfitText}
                onValueChange={setTakeProfitText}
              />
              <TicketField
                label={labels.stopLoss}
                unit={quote}
                slot="ticket-stop-loss"
                invalid={issue === 'no-stop' || issue === 'stop-wrong-side'}
                value={stopLossText}
                onValueChange={setStopLossText}
              />
            </div>
          ) : null}
        </div>
      )}

      {issue ? (
        <div role="alert" data-slot="ticket-issue" className="k-text-caption text-danger">
          {labels.issues[issue]}
        </div>
      ) : null}

      <button
        type="button"
        data-slot="ticket-submit"
        data-locked={locked || undefined}
        disabled={!canSubmit || locked}
        aria-describedby={locked && lockedReason ? lockedId : undefined}
        onClick={() =>
          onSubmit({
            side,
            type,
            price: type === 'limit' ? price : undefined,
            contracts: sizing.contracts,
            leverage,
            marginMode,
            reduceOnly: closing,
            takeProfit: sizing.takeProfit?.price,
            stopLoss: sizing.stopLoss?.price,
            sizing,
          })
        }
        className={cn(
          'k-text-body h-8 w-full cursor-pointer rounded-full border-0 font-bold text-(color:--k-surface-sunken-background)',
          'disabled:cursor-not-allowed disabled:opacity-45 not-disabled:hover:brightness-110',
          side === 'buy' ? 'bg-(--pnl-up)' : 'bg-(--pnl-down)',
          focusRing,
        )}
      >
        {closing ? labels.submitClose[side] : labels.submit[side]}
      </button>
      {locked && lockedReason ? (
        <p
          id={lockedId}
          data-slot="ticket-locked"
          className="k-text-caption m-0 flex items-center gap-1 text-(color:--k-status-warn-foreground)"
        >
          <Lock aria-hidden="true" className="size-3 shrink-0" />
          {lockedReason}
        </p>
      ) : null}

      <dl data-slot="ticket-summary" aria-live="polite" className="k-text-caption m-0 flex flex-col gap-1">
        <ReadoutRow
          label={labels.size}
          slot="ticket-size"
          value={`${format.size(sizing.contracts)} ${instrument.sizeUnit} ≈ ${sizing.baseQuantity.toLocaleString(locale, { maximumFractionDigits: 6 })} ${instrument.base}`}
        />
        {levered && !closing ? (
          <ReadoutRow label={labels.margin} slot="ticket-margin" value={`${format.money(sizing.margin)} ${quote}`} />
        ) : null}
        <ReadoutRow
          label={labels.notional}
          slot="ticket-notional"
          value={`${format.money(sizing.notional)} ${quote}`}
        />
        <ReadoutRow
          label={labels.fees}
          slot="ticket-fees"
          value={
            closing
              ? `${format.money(sizing.closeFee)} ${quote}`
              : `${format.money(sizing.openFee)} + ${format.money(sizing.closeFee)} ${quote}`
          }
        />
        {closing ? null : (
          <ReadoutRow
            label={labels.cost}
            slot="ticket-cost"
            value={<span className="text-ink">{`${format.money(sizing.cost)} ${quote}`}</span>}
          />
        )}
        {!closing && sizing.liquidationPrice !== undefined && liquidationGap !== undefined ? (
          <ReadoutRow
            label={labels.liquidation}
            note={labels.estimate}
            slot="ticket-liquidation"
            value={`${format.price(sizing.liquidationPrice)} (${format.percent(liquidationGap)})`}
          />
        ) : null}
        {!closing && sizing.contracts > 0 ? (
          <ReadoutRow label={labels.breakeven} slot="ticket-breakeven" value={format.price(sizing.breakeven)} />
        ) : null}
        {sizing.takeProfit ? (
          <ReadoutRow
            label={labels.takeProfit}
            slot="ticket-tp-pnl"
            tone={sizing.takeProfit.pnl >= 0 ? 'up' : 'down'}
            value={`${format.signed(sizing.takeProfit.pnl)} ${quote}`}
          />
        ) : null}
        {sizing.stopLoss ? (
          <ReadoutRow
            label={labels.stopLoss}
            slot="ticket-sl-pnl"
            tone={sizing.stopLoss.pnl >= 0 ? 'up' : 'down'}
            value={`${format.signed(sizing.stopLoss.pnl)} ${quote}`}
          />
        ) : null}
        {sizing.rewardRisk !== undefined ? (
          <ReadoutRow label={labels.rewardRisk} slot="ticket-rr" value={`${sizing.rewardRisk.toFixed(2)} : 1`} />
        ) : null}
        {account.position && sizing.after && sizing.after.size > 0 ? (
          <ReadoutRow
            label={labels.averageAfter}
            slot="ticket-average"
            value={`${format.price(sizing.after.entryPrice)} · ${format.size(sizing.after.size)} ${instrument.sizeUnit}`}
          />
        ) : null}
      </dl>
    </div>
  )
}

/**
 * Order ticket laid out like an exchange panel: open / close, margin mode and leverage, limit or market, then a buy column and a
 * sell column, each with its own price, size (read as cost, contracts or risk), take-profit / stop-loss, submit button and figures.
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
  className,
}: {
  /** Contract spec and display names. */
  instrument: OrderTicketInstrument
  /** Balance, fee rates, maintenance margin rate and any held position. */
  account: OrderTicketAccount
  /** Last price and best bid / ask. */
  market: OrderTicketMarket
  /** Highest leverage allowed; leave out for spot and unlevered venues, which hides the leverage controls. */
  maxLeverage?: number
  /** Starting leverage. */
  defaultLeverage?: number
  /** Margin modes on offer; leave out to hide the selector. */
  marginModes?: readonly MarginMode[]
  /** Long / short (hedge) position mode: shows the Open / Close switch; Close orders are reduce-only. */
  hedged?: boolean
  /** The column shown first when the panel is too narrow for two. */
  defaultSide?: OrderSide
  /** How the size box is read at first: cost (default), quantity or risk. */
  defaultSizingMode?: SizingMode
  /** Starting text of both size boxes. */
  defaultAmount?: string
  /** Starting take-profit and stop-loss prices per side; giving either opens that column's exits section. */
  defaultExits?: Partial<Record<OrderSide, { takeProfit?: string; stopLoss?: string }>>
  /** Count the estimated closing fee in the cost. */
  includeCloseFee?: boolean
  /** Saved exit templates, as percent distances from the entry. */
  exitTemplates?: readonly ExitTemplate[]
  /** Where stops live: held by the venue, or triggered locally. */
  stopCustody?: StopCustody
  /** Limit price text per column (controlled), such as a level clicked in an order book; a column left out keeps its own. */
  price?: Partial<Record<OrderSide, string>>
  /** Uncontrolled: starting limit price text per column; defaults to the last price on the tick. */
  defaultPrice?: Partial<Record<OrderSide, string>>
  /** Called with the new text when a column's price box is typed in or its best-price button is pressed. */
  onPriceChange?: (price: string, side: OrderSide) => void
  /** Trading is locked: both submit buttons are disabled, the panel still computes and keeps what was typed. */
  locked?: boolean
  /** Why trading is locked, written under each submit button and read as its description; shown only while locked. */
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
  /** Extra class name on the panel. */
  className?: string
}) {
  const [action, setAction] = useState<OrderAction>('open')
  const [side, setSide] = useState<OrderSide>(defaultSide)
  const [type, setType] = useState<OrderType>('limit')
  const [leverage, setLeverage] = useState(maxLeverage ? defaultLeverage : 1)
  const [marginMode, setMarginMode] = useState<MarginMode | undefined>(marginModes?.[0])
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 3 })

  const shared: SharedProps = {
    instrument,
    account,
    market,
    type,
    action: hedged ? action : 'open',
    leverage,
    levered: Boolean(maxLeverage),
    marginMode,
    includeCloseFee,
    exitTemplates,
    stopCustody,
    defaultSizingMode,
    locked,
    lockedReason,
    labels,
    locale,
    onSubmit,
    onPriceChange,
  }

  return (
    <div
      data-slot="order-ticket"
      className={cn(
        'k-text-body @container flex w-full flex-col gap-2 rounded-[var(--radius-control)] border border-line bg-surface-1 p-3',
        className,
      )}
    >
      {hedged ? (
        <ToggleGroup
          data-slot="ticket-action"
          aria-label={labels.action}
          fullWidth
          value={action}
          onValueChange={(value) => setAction(value as OrderAction)}
        >
          {(['open', 'close'] as const).map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {labels.actions[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}

      {maxLeverage ? (
        <div className="flex items-center gap-1">
          {marginModes && marginMode ? (
            <Select
              value={marginMode}
              onValueChange={(value) => {
                setMarginMode(value as MarginMode)
                onMarginModeChange?.(value as MarginMode)
              }}
            >
              <SelectTrigger aria-label={labels.marginMode} className="min-w-0 flex-1">
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
          ) : null}
          <div className="min-w-0 flex-1">
            <TicketField
              label={labels.leverage}
              unit="×"
              slot="ticket-leverage"
              value={String(leverage)}
              onValueChange={(text) => {
                const next = Math.min(maxLeverage, Math.max(1, Math.floor(parseAmount(text))))
                if (Number.isNaN(next)) return
                setLeverage(next)
                onLeverageChange?.(next)
              }}
            />
          </div>
        </div>
      ) : null}

      <Tabs value={type} onValueChange={(value) => setType(value as OrderType)}>
        <TabsList variant="line" aria-label={labels.orderType} data-slot="ticket-type">
          {(['limit', 'market'] as const).map((value) => (
            <TabsTrigger key={value} value={value}>
              {labels.orderTypes[value]}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* 一个常驻的页签面板：两种委托类型共用同一份表单，换页签不重建，填过的数留着。 */}
        <TabsContent value={type} forceMount className="flex flex-col gap-2">
          <div className="@min-[560px]:hidden">
            <SideSwitch side={side} onSideChange={setSide} buy={labels.buy} sell={labels.sell} label={labels.side} />
          </div>
          <div className="grid gap-x-6 gap-y-2 @min-[560px]:grid-cols-2">
            {(['buy', 'sell'] as const).map((value) => (
              <TicketSide
                key={value}
                side={value}
                hidden={side !== value}
                defaultAmount={defaultAmount}
                defaultExits={defaultExits?.[value]}
                price={price?.[value]}
                defaultPrice={defaultPrice?.[value]}
                {...shared}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="k-text-caption flex items-center gap-3 border-t border-line pt-2 text-ink-3 tabular-nums">
        <span data-slot="ticket-fee-rate">
          {labels.feeRate} {percent.format(account.fees.open)} / {percent.format(account.fees.close)}
        </span>
        {onOpenCalculator ? (
          <Button variant="link" size="sm" className="h-auto gap-1 p-0" onClick={onOpenCalculator}>
            <Calculator aria-hidden="true" />
            {labels.calculator}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
