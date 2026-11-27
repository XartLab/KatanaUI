# InfiniteSlider

无限滚动条，行情跑马灯（Ticker tape）的底座：内容复制一份首尾相接，匀速平移，没有接缝。速度按像素每秒，悬停可减速或停住，暂停与恢复都是平滑的变速，不跳。内容放 RollingText 价格与涨跌色，价格变了数字滚、整串闪一下。

## Provide

`*` marks a required prop.

### InfiniteSlider

只给一份内容，件自己复制第二份；第二份 aria-hidden，读屏只读一遍。paused 是受控的，接 LiveToggle 或页面可见性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | One copy of the content; the slider repeats it. |
| `label` * | `string` | — | Accessible name of the strip, for example "Index quotes". |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Scroll axis. |
| `speed` | `number` | `60` | Speed in pixels per second. |
| `speedOnHover` | `number` | — | Speed while the pointer is over the strip; stops it when 0, omitted keeps the speed. |
| `reverse` | `boolean` | `false` | Scroll the other way (left to right, or top to bottom). |
| `paused` | `boolean` | `false` | Hold still; the strip slows to a stop and resumes from the same spot. |
| `className` | `string` | — | Extra class name on the clipping box; give it the height for the vertical direction. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { InfiniteSlider } from '@katana-ui/react'

export function InfiniteSliderUsage() {
  return (
    <InfiniteSlider label="Index quotes" speed={60} speedOnHover={15}>
      <span>BTC 106,977.4 +1.20%</span>
      <span>ETH 3,814.2 +0.63%</span>
      <span>NVDA 148.62 -1.71%</span>
    </InfiniteSlider>
  )
}
```

## States

- 滚动：按 speed 像素每秒匀速，reverse 反向，direction=vertical 竖向。
- 悬停：减速到 speedOnHover（0 就是停住），移开恢复，速度平滑趋近，不跳。
- paused：减速到停，恢复时从原位继续。

## Don't

- 不要在里面放要点击的小控件：它一直在动，目标不好点；要点的用 Watchlist 或 QuoteTable。
- 不要用它承载唯一的重要信息：读屏用户读到的是静态的一份。
- 速度别超过 100 像素每秒：读不清。

## Composition

```
InfiniteSlider
  div（role=group）
    motion.div（轨）
      div（第一份）
      div（第二份，aria-hidden）
```
