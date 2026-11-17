// SPDX-License-Identifier: MIT
// 改自 SmoothUI swap-panel（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：上面「付出」、下面「收到」两栏，中间一个翻转钮；
// 收到的数额报价中带扫光、数字换了会往上滚，报价有效期画成倒计时圆环。我们的版本不写死文案（全部走 labels），颜色与尺寸走 token，按钮用我们的 Button。
import { ArrowLeftRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { Button } from '../primitives/button.tsx'
import { inputVariants } from '../primitives/input.tsx'

/** 一边的资产（币种、品种）：symbol 是代码，name 给读屏与提示，balance 是可用余额。 */
export type SwapAsset = {
  symbol: string
  name?: string
  icon?: ReactNode
  balance?: number
}

export type SwapQuote = {
  /** Amount received for the current input. */
  output: number
  /** Price of one unit of the pay asset in the receive asset. */
  rate: number
  /** Fee, in the receive asset. */
  fee?: number
  /** Price impact as a fraction (0.0123 is 1.23%). */
  priceImpact?: number
  /** Epoch milliseconds at which the quote lapses; draws the countdown ring. */
  expiresAt?: number
}

export type SwapStatus = 'idle' | 'quoting' | 'ready' | 'submitting' | 'error'

/** 面板里所有可见文字与读屏名，由调用方传（语言、术语随产品）。带 {symbol} 的是模板。 */
export type SwapPanelLabels = {
  pay: string
  receive: string
  /** Prefix of the balance line, for example "Balance". */
  balance: string
  max: string
  /** Accessible name of the flip button. */
  flip: string
  /** Accessible name of an asset chip, with {side} (pay or receive) and {symbol}. */
  chooseAsset: string
  rate: string
  fee: string
  impact: string
  slippage: string
  /** Submit button text per state. */
  submit: string
  submitting: string
  retry: string
  /** Accessible name of the countdown ring. */
  expires: string
}

const RING = { size: 20, radius: 8, stroke: 2 } as const
const CIRCUMFERENCE = 2 * Math.PI * RING.radius
// 报价扫光：一道淡亮带从左扫到右，一轮 1.4 秒（原件 SHIMMER_DURATION），线性匀速。
const SHIMMER_SECONDS = 1.4

/** 数字滚动：值变了，旧的往上滚走、新的从下面滚上来（原件 RollingFigure，弹簧换成 snappy）。 */
function RollingFigure({ value }: { value: string }) {
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={unit(snappy)}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * 报价倒计时圆环：从满走到空，走完正好是 expiresAt。用 Web Animations 一次性排好整段线性的描边动画（不用定时器逐格刷新），
 * expiresAt 变了（拿到新报价）就从头再排。
 */
function CountdownRing({ expiresAt, label }: { expiresAt: number; label: string }) {
  const arc = useRef<SVGCircleElement>(null)
  useEffect(() => {
    const total = expiresAt - Date.now()
    const animation = arc.current?.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: CIRCUMFERENCE }], {
      duration: Math.max(total, 0),
      easing: 'linear',
      fill: 'forwards',
    })
    return () => animation?.cancel()
  }, [expiresAt])
  const c = RING.size / 2
  return (
    <svg
      data-slot="swap-countdown"
      role="img"
      aria-label={label}
      className="shrink-0"
      width={RING.size}
      height={RING.size}
      viewBox={`0 0 ${RING.size} ${RING.size}`}
    >
      <circle cx={c} cy={c} r={RING.radius} fill="none" stroke="var(--alpha-white-10)" strokeWidth={RING.stroke} />
      <circle
        ref={arc}
        cx={c}
        cy={c}
        r={RING.radius}
        fill="none"
        stroke="var(--ink-100)"
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        style={{ rotate: '-90deg', transformOrigin: '50% 50%' }}
      />
    </svg>
  )
}

function AssetChip({
  asset,
  side,
  labels,
  onSelect,
}: {
  asset: SwapAsset
  side: 'pay' | 'receive'
  labels: SwapPanelLabels
  onSelect?: () => void
}) {
  return (
    <Button
      size="sm"
      className="shrink-0 rounded-full"
      onClick={onSelect}
      aria-label={labels.chooseAsset
        .replace('{side}', side === 'pay' ? labels.pay : labels.receive)
        .replace('{symbol}', asset.symbol)}
      title={asset.name}
    >
      {asset.icon ?? (
        <span
          aria-hidden="true"
          className="grid size-4 place-items-center rounded-full bg-alpha-white-10 text-[10px] font-semibold text-ink"
        >
          {asset.symbol.charAt(0)}
        </span>
      )}
      <RollingFigure value={asset.symbol} />
      <ChevronDown aria-hidden="true" className="text-ink-3" />
    </Button>
  )
}

/**
 * 兑换面板：付出一栏（输入、余额、Max）、收到一栏（报价算出的数额）、中间翻转钮、报价明细与提交钮。
 * 状态由调用方管：amount、quote、status 都受控；quoting 时收到栏扫光，submitting 时提交钮转为禁用。
 * 数字格式用 locale（默认浏览器语言）；文案全部走 labels。
 */
export function SwapPanel({
  amount,
  onAmountChange,
  from,
  to,
  quote,
  slippage,
  status,
  error,
  labels,
  locale,
  onFlip,
  onSelectAsset,
  onSubmit,
  className,
}: {
  /** The pay amount as typed (text, so "1." and "" are possible). */
  amount: string
  /** Called with the new text on every edit of the pay amount. */
  onAmountChange: (value: string) => void
  /** The asset paid. */
  from: SwapAsset
  /** The asset received. */
  to: SwapAsset
  /** Current quote; leave out before the first one arrives. */
  quote?: SwapQuote
  /** Maximum slippage as a fraction. */
  slippage?: number
  /** Drives the shimmer on the receive row and the submit button. */
  status: SwapStatus
  /** Error text shown under the quote (role=alert). */
  error?: string
  /** All visible text and accessible names. */
  labels: SwapPanelLabels
  /** BCP 47 tag for number formatting, defaults to the browser language. */
  locale?: string
  /** Called when the flip button is clicked; swap `from` and `to` yourself. */
  onFlip: () => void
  /** Called when an asset chip is clicked, to open your asset picker. */
  onSelectAsset?: (side: 'pay' | 'receive') => void
  /** Called when the submit button is clicked. */
  onSubmit: () => void
  /** Extra class name on the panel. */
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)
  const inputId = useId()
  const receiveId = useId()
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 })
  const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, style: 'percent' })
  const busy = status === 'quoting' || status === 'submitting'
  const submitText = status === 'submitting' ? labels.submitting : status === 'error' ? labels.retry : labels.submit

  return (
    <div
      data-slot="swap-panel"
      data-status={status}
      className={cn(
        'flex w-full max-w-sm flex-col gap-3 rounded-[var(--radius-control)] border border-line bg-surface-1 p-3',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div>
          <label htmlFor={inputId} className="k-text-caption mb-1 block px-1 text-ink-3">
            {labels.pay}
          </label>
          <div className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-alpha-white-7 bg-alpha-white-3 px-2 py-2">
            <input
              id={inputId}
              data-slot="swap-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              className={cn(inputVariants(), 'h-8 border-0 bg-transparent px-0 text-[20px] font-semibold')}
            />
            <AssetChip asset={from} side="pay" labels={labels} onSelect={() => onSelectAsset?.('pay')} />
          </div>
          {typeof from.balance === 'number' ? (
            <div className="k-text-caption mt-1 flex items-center gap-2 px-1 text-ink-3">
              <span>
                {labels.balance} {decimal.format(from.balance)}
              </span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => onAmountChange(String(from.balance))}
              >
                {labels.max}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex justify-center">
          <Button
            size="icon"
            variant="default"
            className="z-10 -my-3 rounded-full bg-surface-3"
            aria-label={labels.flip}
            onClick={() => {
              setFlipped((v) => !v)
              onFlip()
            }}
          >
            {/* 转的是图标不是按钮：按钮是圆的，转它什么也看不出。 */}
            <motion.span animate={{ rotate: flipped ? 180 : 0 }} transition={unit(snappy)} className="flex">
              <ArrowLeftRight aria-hidden="true" />
            </motion.span>
          </Button>
        </div>

        <div>
          <span id={receiveId} className="k-text-caption mb-1 block px-1 text-ink-3">
            {labels.receive}
          </span>
          <div className="relative flex items-center justify-between gap-2 overflow-hidden rounded-[var(--radius-control)] border border-alpha-white-7 bg-alpha-white-3 px-2 py-2">
            {status === 'quoting' ? (
              <div
                aria-hidden="true"
                data-slot="swap-shimmer"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <motion.div
                  className="h-full w-1/3 bg-[linear-gradient(90deg,transparent,var(--alpha-white-8),transparent)]"
                  initial={{ x: '-100%' }}
                  animate={{ x: '320%' }}
                  transition={{ duration: SHIMMER_SECONDS, ease: 'linear', repeat: Infinity }}
                />
              </div>
            ) : null}
            <div
              aria-labelledby={receiveId}
              aria-live="polite"
              data-slot="swap-output"
              className="k-text-body relative flex min-h-8 flex-1 items-center text-[20px] font-semibold tabular-nums text-ink"
            >
              <RollingFigure value={decimal.format(quote?.output ?? 0)} />
            </div>
            <AssetChip asset={to} side="receive" labels={labels} onSelect={() => onSelectAsset?.('receive')} />
          </div>
        </div>
      </div>

      {quote ? (
        <div
          data-slot="swap-quote"
          className="k-text-caption flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-ink-3 tabular-nums"
        >
          {quote.expiresAt ? <CountdownRing expiresAt={quote.expiresAt} label={labels.expires} /> : null}
          <span>
            {labels.rate} 1 {from.symbol} = {decimal.format(quote.rate)} {to.symbol}
          </span>
          {typeof quote.fee === 'number' ? (
            <span>
              {labels.fee} {decimal.format(quote.fee)} {to.symbol}
            </span>
          ) : null}
          {typeof quote.priceImpact === 'number' ? (
            <span>
              {labels.impact} {percent.format(quote.priceImpact)}
            </span>
          ) : null}
          {typeof slippage === 'number' ? (
            <span>
              {labels.slippage} {percent.format(slippage)}
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="k-text-caption m-0 px-1 text-danger">
          {error}
        </p>
      ) : null}

      <Button variant="primary" className="w-full" disabled={busy} onClick={onSubmit}>
        {submitText}
      </Button>
    </div>
  )
}
