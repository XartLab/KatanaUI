// SPDX-License-Identifier: MIT
// 下单面板（#96，用户 2026-11-19 定）。功能参照 OKX 永续交易页的下单面板（2026-11-19 实际打开看的，未登录：买卖切换、保证金模式与杠杆、
// 限价 / 市价、最优价、百分比滑杆、勾选后原地展开的止盈止损、按钮下的保证金与订单价值）与 ATAS 的出场策略、按风险金额算仓位
// （https://start.atas.net/step-3.-start-trading-with-atas/exit-strategies 、https://feedback.atas.net/de/changelog Beta 8.0.16，同日读）；
// 只取「给用户看什么、怎么交互」，实现原创。TradingView 的下单面板不参照（用户定）。
// 面板只算和显示：账户、费率、合约规格由调用方传，下单是 onSubmit 回调；文字全走 labels。
import { Calculator } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { Button } from '../primitives/button.tsx'
import { Checkbox } from '../primitives/checkbox.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { Slider } from '../primitives/slider.tsx'
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

/** 出场模板（ATAS 的 Exit Strategy）：止盈、止损各是离入场价的百分比（0.02 是 2%），选了就按当前方向填进两个框。 */
export type ExitTemplate = { id: string; name: string; takeProfit?: number; stopLoss?: number }

export type OrderDraft = {
  side: OrderSide
  type: OrderType
  /** Limit price; undefined for a market order. */
  price?: number
  contracts: number
  leverage: number
  marginMode?: MarginMode
  takeProfit?: number
  stopLoss?: number
  sizing: SizingResult
}

/** 面板里所有可见文字与读屏名。 */
export type OrderTicketLabels = {
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
  calculator: string
}

const PERCENT_STOPS = [0, 25, 50, 75, 100] as const

/**
 * Order ticket: side, margin mode and leverage, limit or market, a size box read as cost, contracts or risk,
 * take-profit / stop-loss, and a live summary of size, margin, fees, liquidation and breakeven.
 */
export function OrderTicket({
  instrument,
  account,
  market,
  maxLeverage,
  defaultLeverage = 1,
  marginModes,
  defaultSide = 'buy',
  defaultSizingMode = 'cost',
  defaultAmount = '',
  defaultExits,
  includeCloseFee = true,
  exitTemplates,
  stopCustody = 'venue',
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
  /** Starting side. */
  defaultSide?: OrderSide
  /** How the size box is read at first: cost (default), quantity or risk. */
  defaultSizingMode?: SizingMode
  /** Starting text of the size box. */
  defaultAmount?: string
  /** Starting take-profit and stop-loss prices; giving either opens the exits section. */
  defaultExits?: { takeProfit?: string; stopLoss?: string }
  /** Count the estimated closing fee in the cost. */
  includeCloseFee?: boolean
  /** Saved exit templates, as percent distances from the entry. */
  exitTemplates?: readonly ExitTemplate[]
  /** Where stops live: held by the venue, or triggered locally. */
  stopCustody?: StopCustody
  /** All visible text and accessible names. */
  labels: OrderTicketLabels
  /** BCP 47 tag for number formatting, defaults to the browser language. */
  locale?: string
  /** Called with the order when the submit button is clicked. */
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
  const [side, setSide] = useState<OrderSide>(defaultSide)
  const [type, setType] = useState<OrderType>('limit')
  const [leverage, setLeverage] = useState(maxLeverage ? defaultLeverage : 1)
  const [marginMode, setMarginMode] = useState<MarginMode | undefined>(marginModes?.[0])
  const [priceText, setPriceText] = useState(() => toTick(market.last, instrument.tickSize))
  const [mode, setMode] = useState<SizingMode>(defaultSizingMode)
  const [amountText, setAmountText] = useState(defaultAmount)
  const [exitsOpen, setExitsOpen] = useState(Boolean(defaultExits?.takeProfit || defaultExits?.stopLoss))
  const [takeProfitText, setTakeProfitText] = useState(defaultExits?.takeProfit ?? '')
  const [stopLossText, setStopLossText] = useState(defaultExits?.stopLoss ?? '')
  const [templateId, setTemplateId] = useState('')
  const exitsId = useId()
  const format = ticketFormat(locale, instrument.tickSize, instrument.lotSize)

  // 市价单按对手价算：买看卖一，卖看买一，没有盘口就用最新价。
  const marketPrice = (side === 'buy' ? market.ask : market.bid) ?? market.last
  const price = type === 'market' ? marketPrice : parseAmount(priceText)
  const amount = parseAmount(amountText)
  // 按风险的填法离不开止损价，所以这时止盈止损一栏强制展开。
  const exitsShown = exitsOpen || mode === 'risk'
  const takeProfit = exitsShown ? parseAmount(takeProfitText) : Number.NaN
  const stopLoss = exitsShown ? parseAmount(stopLossText) : Number.NaN

  const sizing = computeSizing({
    side,
    price,
    leverage,
    fees: account.fees,
    includeCloseFee,
    spec: instrument,
    mode,
    amount,
    takeProfit: Number.isNaN(takeProfit) ? undefined : takeProfit,
    stopLoss: Number.isNaN(stopLoss) ? undefined : stopLoss,
    maintenanceMarginRate: maxLeverage ? account.maintenanceMarginRate : undefined,
    available: account.available,
    position: account.position,
  })
  const issue = sizing.issue === 'no-price' || sizing.issue === 'no-amount' ? undefined : sizing.issue

  const maxContracts = contractsForCost(account.available, price, leverage, account.fees, instrument, includeCloseFee)
  const percent =
    mode === 'cost'
      ? account.available > 0 && amount > 0
        ? Math.min(100, (amount / account.available) * 100)
        : 0
      : maxContracts > 0 && amount > 0
        ? Math.min(100, (amount / maxContracts) * 100)
        : 0

  function applyPercent(value: number) {
    if (mode === 'cost') setAmountText(value === 0 ? '' : ((account.available * value) / 100).toFixed(2))
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

  function changeSide(next: OrderSide) {
    setSide(next)
    // 换方向后止盈止损在价格的另一边，旧的数不再成立：有模板按模板重算，没有就清空。
    setTakeProfitText('')
    setStopLossText('')
    setTemplateId('')
  }

  const amountUnit = mode === 'quantity' ? instrument.sizeUnit : instrument.quote
  const canSubmit = sizing.contracts > 0 && !sizing.issue
  const liquidationGap =
    sizing.liquidationPrice === undefined ? undefined : Math.abs(sizing.liquidationPrice - price) / price

  return (
    <div
      data-slot="order-ticket"
      data-side={side}
      className={cn(
        'k-text-body flex w-full max-w-sm flex-col gap-2 rounded-[var(--radius-control)] border border-line bg-surface-1 p-3',
        className,
      )}
    >
      <SideSwitch side={side} onSideChange={changeSide} buy={labels.buy} sell={labels.sell} label={labels.side} />

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

      <ToggleGroup
        size="sm"
        aria-label={labels.orderType}
        value={type}
        onValueChange={(value) => setType(value as OrderType)}
      >
        {(['limit', 'market'] as const).map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {labels.orderTypes[value]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <TicketField
        label={labels.price}
        unit={instrument.quote}
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
        label={labels.sizingModes[mode]}
        labelNode={
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
        }
        unit={amountUnit}
        slot="ticket-amount"
        placeholder="0"
        invalid={issue === 'below-min' || issue === 'exceeds-available'}
        value={amountText}
        onValueChange={setAmountText}
      />

      {mode === 'risk' ? null : (
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

      <div className="k-text-caption flex justify-between text-ink-3 tabular-nums">
        <span>{labels.available}</span>
        <span data-slot="ticket-available">
          {format.money(account.available)} {instrument.quote}
        </span>
      </div>

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
              unit={instrument.quote}
              slot="ticket-take-profit"
              value={takeProfitText}
              onValueChange={setTakeProfitText}
            />
            <TicketField
              label={labels.stopLoss}
              unit={instrument.quote}
              slot="ticket-stop-loss"
              invalid={issue === 'no-stop' || issue === 'stop-wrong-side'}
              value={stopLossText}
              onValueChange={setStopLossText}
            />
          </div>
        ) : null}
      </div>

      <dl
        data-slot="ticket-summary"
        aria-live="polite"
        className="k-text-caption m-0 flex flex-col gap-1 border-t border-line pt-2"
      >
        <ReadoutRow
          label={labels.size}
          slot="ticket-size"
          value={`${format.size(sizing.contracts)} ${instrument.sizeUnit} ≈ ${sizing.baseQuantity.toLocaleString(locale, { maximumFractionDigits: 6 })} ${instrument.base}`}
        />
        <ReadoutRow
          label={labels.notional}
          slot="ticket-notional"
          value={`${format.money(sizing.notional)} ${instrument.quote}`}
        />
        {maxLeverage ? (
          <ReadoutRow
            label={labels.margin}
            slot="ticket-margin"
            value={`${format.money(sizing.margin)} ${instrument.quote}`}
          />
        ) : null}
        <ReadoutRow
          label={labels.fees}
          slot="ticket-fees"
          value={`${format.money(sizing.openFee)} + ${format.money(sizing.closeFee)} ${instrument.quote}`}
        />
        <ReadoutRow
          label={labels.cost}
          slot="ticket-cost"
          value={<span className="text-ink">{`${format.money(sizing.cost)} ${instrument.quote}`}</span>}
        />
        {sizing.liquidationPrice !== undefined && liquidationGap !== undefined ? (
          <ReadoutRow
            label={labels.liquidation}
            note={labels.estimate}
            slot="ticket-liquidation"
            value={`${format.price(sizing.liquidationPrice)} (${format.percent(liquidationGap)})`}
          />
        ) : null}
        {sizing.contracts > 0 ? (
          <ReadoutRow label={labels.breakeven} slot="ticket-breakeven" value={format.price(sizing.breakeven)} />
        ) : null}
        {sizing.takeProfit ? (
          <ReadoutRow
            label={labels.takeProfit}
            slot="ticket-tp-pnl"
            tone={sizing.takeProfit.pnl >= 0 ? 'up' : 'down'}
            value={`${format.signed(sizing.takeProfit.pnl)} ${instrument.quote}`}
          />
        ) : null}
        {sizing.stopLoss ? (
          <ReadoutRow
            label={labels.stopLoss}
            slot="ticket-sl-pnl"
            tone={sizing.stopLoss.pnl >= 0 ? 'up' : 'down'}
            value={`${format.signed(sizing.stopLoss.pnl)} ${instrument.quote}`}
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

      {issue ? (
        <div role="alert" data-slot="ticket-issue" className="k-text-caption text-danger">
          {labels.issues[issue]}
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        <button
          type="button"
          data-slot="ticket-submit"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              side,
              type,
              price: type === 'limit' ? price : undefined,
              contracts: sizing.contracts,
              leverage,
              marginMode,
              takeProfit: sizing.takeProfit?.price,
              stopLoss: sizing.stopLoss?.price,
              sizing,
            })
          }
          className={cn(
            'k-text-body h-(--k-size-base) min-w-0 flex-1 cursor-pointer rounded-[6px] border-0 font-bold text-(color:--k-surface-sunken-background)',
            focusRing,
            'disabled:cursor-not-allowed disabled:opacity-45 not-disabled:hover:brightness-110',
            side === 'buy' ? 'bg-(--side-buy)' : 'bg-(--side-sell)',
          )}
        >
          {labels.submit[side]}
        </button>
        {onOpenCalculator ? (
          <Button size="icon" variant="icon" aria-label={labels.calculator} onClick={onOpenCalculator}>
            <Calculator aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
