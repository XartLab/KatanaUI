// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { auctionBarShares, auctionPending, auctionRatio } from './auction-bar-model.ts'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type AuctionBarLabels } from './labels.ts'

// 竞价量比条（KatanaUI #11 第 5 项）：表格里的一格，放进 DataGrid 列的 cell。一条细轨：实心段是今日竞价额，一根竖刻度是昨日同期竞价额（量比的分母，实心过了刻度就是比昨天多），
// 轨下一条涨色细线是涨停委买额；右边写量比（两位小数，≥ 1 加亮）。09:25 撮合之前（09:15–09:25 是虚拟匹配）整格变淡、字写「未出结果」。
// 功能参照开盘啦「竞价」与「竞价涨停委买」（App Store 介绍与官网教程 kaipanla.com/article/42660，2026-11-15 读：按资金看竞价、列出竞价涨停委买的票），条的画法开盘啦没写，是我们定的。
// 满刻度 max 由调用方给一列共用的一把（行与行可比）；不给就取这一格里最大的那个。数据由调用方给，取不到的段不画、不当 0。
// 颜色只用语义色调：实心段中性灰，涨停委买读 --pnl-up（根上 data-updown 互换）。

export type AuctionBarCellProps = {
  /**
   * Today's opening-auction turnover in yuan; null when not available.
   * 今日竞价额（元）。
   */
  amount: number | null
  /**
   * Yesterday's opening-auction turnover at the same time in yuan, the base of the ratio.
   * 昨日同期竞价额（元），量比的分母。
   */
  previous?: number | null
  /**
   * Bids queued at the limit-up price in yuan; no line when omitted.
   * 涨停委买额（元）；不给不画。
   */
  limitBid?: number | null
  /**
   * Full scale in yuan shared by the whole column so rows compare; the largest value in this cell when omitted.
   * 满刻度（元），一列共用一把；不给取这一格里最大的。
   */
  max?: number
  /**
   * Clock time of the data, such as "09:22"; before 09:25 the cell reads as pending.
   * 数据的时刻；09:25 之前写「未出结果」。
   */
  time?: string
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: AuctionBarLabels
  /** Extra class names. */
  className?: string
}

const pct = (share: number) => `${share * 100}%`

export function AuctionBarCell({
  amount,
  previous = null,
  limitBid = null,
  max,
  time,
  labels = cnLabelsZh.auctionBar,
  className,
}: AuctionBarCellProps) {
  const pending = auctionPending(time)
  const ratio = auctionRatio(amount, previous)
  const shares = auctionBarShares(amount, previous, limitBid, max)
  const ratioText = ratio === null ? '—' : ratio.toFixed(2)
  const aria = labels.aria({
    amount: formatCnAmount(amount),
    previous: formatCnAmount(previous),
    ratio: ratioText,
    limitBid: shares.limitBid === null ? null : formatCnAmount(limitBid),
    pending,
  })
  return (
    <span
      className={cn('k-abc', className)}
      data-slot="auction-bar-cell"
      data-pending={pending || undefined}
      role="img"
      aria-label={aria}
      title={aria}
    >
      <span className="k-abc-track" aria-hidden="true">
        {shares.amount !== null && (
          <span className="k-abc-fill" data-slot="auction-bar-fill" style={{ width: pct(shares.amount) }} />
        )}
        {shares.previous !== null && (
          <span className="k-abc-mark" data-slot="auction-bar-mark" style={{ left: pct(shares.previous) }} />
        )}
        {shares.limitBid !== null && (
          <span className="k-abc-bid" data-slot="auction-bar-bid" style={{ width: pct(shares.limitBid) }} />
        )}
      </span>
      <span
        className="k-abc-text"
        data-slot="auction-bar-text"
        data-above={(!pending && ratio !== null && ratio >= 1) || undefined}
        aria-hidden="true"
      >
        {pending ? labels.pending : ratioText}
      </span>
    </span>
  )
}
