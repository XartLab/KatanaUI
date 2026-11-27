# AuctionBarCell

表格里的一格（放进 DataGrid 列的 cell）：一条细轨，实心段是今日竞价额，一根竖刻度是昨日同期竞价额（量比的分母，实心过了刻度就是比昨天多），轨下一条涨色细线是涨停委买额；右边写量比（两位小数，≥ 1 加亮）。09:25 撮合之前（09:15–09:25 是虚拟匹配）整格变淡、字写「未出结果」。满刻度 max 给一列共用的一把，行与行就能比长短；不给按这一格里最大的。功能参照开盘啦「竞价」与「竞价涨停委买」，条的画法是我们定的。

## Provide

`*` marks a required prop.

### AuctionBarCell

渲染一个 span（role=img，读屏名写全竞价额、昨日同期、量比与涨停委买）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` * | `number \| null` | — | Today's opening-auction turnover in yuan; null when not available. |
| `previous` | `number \| null` | `null` | Yesterday's opening-auction turnover at the same time in yuan, the base of the ratio. |
| `limitBid` | `number \| null` | `null` | Bids queued at the limit-up price in yuan; no line when omitted. |
| `max` | `number` | — | Full scale in yuan shared by the whole column so rows compare; the largest value in this cell when omitted. |
| `time` | `string` | — | Clock time of the data, such as "09:22"; before 09:25 the cell reads as pending. |
| `labels` | `AuctionBarLabels` | `cnLabelsZh.auctionBar` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### auctionRatio(amount, previous)

纯函数：量比；昨日取不到或不是正数返回 null。排序用它。

### auctionPending(time)

纯函数：时刻早于 09:25 返回 true。

### auctionBarShares(amount, previous, limitBid, max)

纯函数：三段长度（0 到 1），取不到的是 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AuctionBarCell } from '@katana-ui/react/cn'

export function AuctionBarCellUsage() {
  return (
    <div style={{ width: 200 }}>
      <AuctionBarCell amount={312_000_000} previous={96_000_000} limitBid={185_000_000} max={320_000_000} />
    </div>
  )
}
```

## States

- 结果出了：量比两位小数；≥ 1（比昨日同期多）加亮加粗。
- 09:25 之前：整格变淡，字写「未出结果」，读屏名前面补一句。
- 给了 limitBid：轨下画一条涨色细线（跟 data-updown）。
- 昨日取不到：量比写「—」，不画刻度。

## Don't

- 不要一行一把满刻度去比行与行：一列传同一个 max。
- 不要拿它画竞价价格：价格怎么走用 AuctionStep 或 DataGrid 的 auctionStep 列。
- 不要在包里取竞价数据：金额由调用方给。

## Composition

```
AuctionBarCell
  轨（今日竞价额实心段 · 昨日同期刻度 · 涨停委买细线）
  量比读数 / 未出结果
```
