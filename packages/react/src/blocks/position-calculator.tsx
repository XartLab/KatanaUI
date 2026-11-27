// SPDX-License-Identifier: MIT
// 仓位计算器（#96，简化版，用户 2026-11-19 定：单独弹窗可以，做简化）。OKX 的计算器要从头手填；这里打开时带入当前品种的
// 价格、杠杆、数量与调用方给的费率，只答三件事：平在这个价赚或亏多少、强平价在哪、保本价多少。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '../primitives/dialog.tsx'
import { ReadoutRow, SideSwitch, TicketField, parseAmount, ticketFormat, toTick } from './order-ticket-parts.tsx'
import {
  breakevenPrice,
  exitPnl,
  liquidationPrice,
  type FeeRates,
  type InstrumentSpec,
  type OrderSide,
} from './sizing-model.ts'

export type PositionCalculatorLabels = {
  side: string
  buy: string
  sell: string
  entry: string
  exit: string
  size: string
  leverage: string
  pnl: string
  /** Return on the margin put up. */
  roe: string
  liquidation: string
  /** Appended to figures that are approximations. */
  estimate: string
  breakeven: string
}

export type PositionCalculatorProps = {
  /** Contract spec plus tick size and unit names. */
  instrument: InstrumentSpec & { tickSize: number; quote: string; sizeUnit: string }
  /** Fee rates as fractions. */
  fees: FeeRates
  /** Maintenance margin rate as a fraction; without it no liquidation price is shown. */
  maintenanceMarginRate?: number
  /** Starting side. */
  defaultSide?: OrderSide
  /** Starting entry price, normally the current price. */
  defaultEntry: number
  /** Starting exit price. */
  defaultExit?: number
  /** Starting size in contracts. */
  defaultContracts?: number
  /** Starting leverage. */
  defaultLeverage?: number
  /** All visible text and accessible names. */
  labels: PositionCalculatorLabels
  /** BCP 47 tag for number formatting, defaults to the browser language. */
  locale?: string
  /** Extra class name on the panel. */
  className?: string
}

/** The calculator body, for placing inline; PositionCalculator wraps it in a dialog. */
export function PositionCalculatorPanel({
  instrument,
  fees,
  maintenanceMarginRate,
  defaultSide = 'buy',
  defaultEntry,
  defaultExit,
  defaultContracts = 1,
  defaultLeverage = 1,
  labels,
  locale,
  className,
}: PositionCalculatorProps) {
  const [side, setSide] = useState<OrderSide>(defaultSide)
  const [entryText, setEntryText] = useState(() => toTick(defaultEntry, instrument.tickSize))
  const [exitText, setExitText] = useState(() =>
    defaultExit === undefined ? '' : toTick(defaultExit, instrument.tickSize),
  )
  const [sizeText, setSizeText] = useState(String(defaultContracts))
  const [leverageText, setLeverageText] = useState(String(defaultLeverage))
  const format = ticketFormat(locale, instrument.tickSize, instrument.lotSize)

  const entry = parseAmount(entryText)
  const exit = parseAmount(exitText)
  const contracts = parseAmount(sizeText)
  const leverage = parseAmount(leverageText)
  const ready = entry > 0 && contracts > 0 && leverage > 0
  const margin = ready ? (entry * contracts * instrument.contractValue) / leverage : 0
  const pnl = ready && exit > 0 ? exitPnl(side, entry, exit, contracts, instrument, fees) : undefined
  const liquidation =
    ready && maintenanceMarginRate !== undefined
      ? liquidationPrice(side, entry, leverage, maintenanceMarginRate, fees.close)
      : undefined

  return (
    <div data-slot="position-calculator" className={cn('k-text-body flex w-full max-w-sm flex-col gap-2', className)}>
      <SideSwitch side={side} onSideChange={setSide} buy={labels.buy} sell={labels.sell} label={labels.side} />
      <TicketField label={labels.entry} unit={instrument.quote} value={entryText} onValueChange={setEntryText} />
      <TicketField label={labels.exit} unit={instrument.quote} value={exitText} onValueChange={setExitText} />
      <div className="grid grid-cols-2 gap-1">
        <TicketField label={labels.size} unit={instrument.sizeUnit} value={sizeText} onValueChange={setSizeText} />
        <TicketField label={labels.leverage} unit="×" value={leverageText} onValueChange={setLeverageText} />
      </div>
      <dl aria-live="polite" className="k-text-caption m-0 flex flex-col gap-1 border-t border-line pt-2">
        <ReadoutRow
          label={labels.pnl}
          slot="calculator-pnl"
          tone={pnl === undefined ? undefined : pnl >= 0 ? 'up' : 'down'}
          value={pnl === undefined ? '—' : `${format.signed(pnl)} ${instrument.quote}`}
        />
        <ReadoutRow
          label={labels.roe}
          slot="calculator-roe"
          tone={pnl === undefined ? undefined : pnl >= 0 ? 'up' : 'down'}
          value={pnl === undefined || !(margin > 0) ? '—' : format.percent(pnl / margin)}
        />
        <ReadoutRow
          label={labels.liquidation}
          note={labels.estimate}
          slot="calculator-liquidation"
          value={liquidation === undefined ? '—' : format.price(liquidation)}
        />
        <ReadoutRow
          label={labels.breakeven}
          slot="calculator-breakeven"
          value={entry > 0 ? format.price(breakevenPrice(side, entry, fees)) : '—'}
        />
      </dl>
    </div>
  )
}

/** Position calculator in a dialog: prefilled from the current ticket, it answers profit or loss, liquidation and breakeven. */
export function PositionCalculator({
  open,
  onOpenChange,
  title,
  closeLabel,
  ...panel
}: PositionCalculatorProps & {
  /** Whether the dialog is open. */
  open: boolean
  /** Called when the dialog asks to open or close. */
  onOpenChange: (open: boolean) => void
  /** Dialog title. */
  title: string
  /** Accessible name of the close button. */
  closeLabel: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <PositionCalculatorPanel {...panel} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
