// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type SeatTableLabels } from './labels.ts'
import { amountTone, rankSeats, seatNet, seatTotal, type Seat, type SeatSide } from './seat-model.ts'
import { DASH } from './value.ts'

// 龙虎榜席位（#110，信息结构取自复盘吧的龙虎榜席位表，样子是 Graphite 的）：一只票上榜当日的买入前五与卖出前五席位，左右并排；
// 每行是名次、席位名、游资标签（调用方给）、买入额、卖出额、净额（万 / 亿写法，净额正涨负跌，跟 data-updown）；每侧一行合计。
// 件里没有排序以外的口径：席位清单与金额由调用方给，件只负责按侧取前几名、算净额与合计。取不到写「—」，不写 0。文字走 labels。

export type SeatTableProps = {
  /**
   * Seats that bought, in any order; the table keeps the top `limit` by buy amount.
   * 买入侧的席位（次序随意）；表里按买入额取前 limit 个。
   */
  buy: readonly Seat[]
  /**
   * Seats that sold, in any order; the table keeps the top `limit` by sell amount.
   * 卖出侧的席位；按卖出额取前 limit 个。
   */
  sell: readonly Seat[]
  /**
   * How many seats each side shows; 5 by default.
   * 每侧最多几个席位；默认 5。
   */
  limit?: number
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: SeatTableLabels
  /** Extra class names. */
  className?: string
}

function SeatSideTable({
  side,
  seats,
  title,
  labels,
}: {
  side: SeatSide
  seats: readonly Seat[]
  title: string
  labels: SeatTableLabels
}) {
  const { columns } = labels
  const net = seatTotal(seats, 'net')
  return (
    <section className="k-seat-side" data-slot="seat-side" data-side={side}>
      <h4 className="k-seat-title">{title}</h4>
      <table className="k-seat-table" aria-label={labels.tableAria(title)}>
        <thead>
          <tr>
            <th scope="col" className="k-seat-rank" aria-label="#" />
            <th scope="col" className="k-seat-name">
              {columns.seat}
            </th>
            <th scope="col" className="k-seat-num">
              {columns.buy}
            </th>
            <th scope="col" className="k-seat-num">
              {columns.sell}
            </th>
            <th scope="col" className="k-seat-num">
              {columns.net}
            </th>
          </tr>
        </thead>
        <tbody>
          {seats.map((seat, index) => {
            const rowNet = seatNet(seat)
            return (
              <tr key={`${seat.name}-${index}`} data-slot="seat-row" data-rank={index + 1}>
                <td className="k-seat-rank">{index + 1}</td>
                <td className="k-seat-name">
                  <span className="k-seat-name-text" title={seat.name}>
                    {seat.name}
                  </span>
                  {seat.tag && (
                    <span className="k-cn-chip" data-slot="seat-tag">
                      {seat.tag}
                    </span>
                  )}
                </td>
                <td className="k-seat-num" data-slot="seat-buy" data-main={side === 'buy' || undefined}>
                  {formatCnAmount(seat.buy)}
                </td>
                <td className="k-seat-num" data-slot="seat-sell" data-main={side === 'sell' || undefined}>
                  {formatCnAmount(seat.sell)}
                </td>
                <td className="k-seat-num k-seat-net" data-slot="seat-net" data-tone={amountTone(rowNet)}>
                  {formatCnAmount(rowNet, { signed: true })}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr data-slot="seat-total">
            <th scope="row" colSpan={2} className="k-seat-name">
              {labels.total}
            </th>
            <td className="k-seat-num">{formatCnAmount(seatTotal(seats, 'buy'))}</td>
            <td className="k-seat-num">{formatCnAmount(seatTotal(seats, 'sell'))}</td>
            <td className="k-seat-num k-seat-net" data-tone={amountTone(net)} title={labels.netTotal}>
              {formatCnAmount(net, { signed: true })}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

export function SeatTable({ buy, sell, limit = 5, labels = cnLabelsZh.seatTable, className }: SeatTableProps) {
  const top = { buy: rankSeats(buy, 'buy', limit), sell: rankSeats(sell, 'sell', limit) }
  const empty = top.buy.length === 0 && top.sell.length === 0
  // 买入前几合计 − 卖出前几合计：一行字报在表下面。
  const bought = seatTotal(top.buy, 'buy')
  const sold = seatTotal(top.sell, 'sell')
  const spread = bought === null || sold === null ? null : bought - sold
  return (
    <section className={cn('k-seat', className)} data-slot="seat-table" aria-label={labels.region}>
      {empty ? (
        <p className="k-seat-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <>
          <div className="k-seat-sides">
            <SeatSideTable side="buy" seats={top.buy} title={labels.buyTitle} labels={labels} />
            <SeatSideTable side="sell" seats={top.sell} title={labels.sellTitle} labels={labels} />
          </div>
          <p className="k-seat-spread" data-slot="seat-spread" data-tone={amountTone(spread)}>
            <span>{labels.netTotal}</span>
            <strong>{spread === null ? DASH : formatCnAmount(spread, { signed: true })}</strong>
          </p>
        </>
      )}
    </section>
  )
}
