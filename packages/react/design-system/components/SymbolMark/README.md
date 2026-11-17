# SymbolMark

品种名前的小圆标（学 TradingView 列表里企业 / 币种标志）：有图显示圆形裁切的图片，加载失败退回字母；没有图就是字母圆标，底 bg-400、字 ink-200，不按代码随机上色。尺寸两档：sm 18（行高 28 的一行，默认）、md 28（卡片）；热力图格子这类要别的直径的仍可传数。字号跟直径走（28 以上 16，其余 12），在 css 里按 data-size 取字号 token，不内联。

## Provide

`*` marks a required prop.

### SymbolMark

图片从哪来由调用方给；件里不带任何企业或币种的标志（商标）。读屏名用 name，没有就用 symbol。旧名 code 照认一个版本（@deprecated）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `symbol` | `string` | — | 品种代码；字母圆标取其中的拉丁字母前 2 个（旧名 code）。 |
| `name` | `string` | — | 名称：读屏名；代码里没有字母（600519、00700）时取名称首字。 |
| `src` | `string` | — | 图片地址；不给或加载失败就画字母。 |
| `size` | `'sm' \| 'md' \| number` | `'sm'` | sm 18px（列表行）、md 28px（卡片）；数是自定直径（像素）。 |

### symbolMarkLetters

字母圆标上写什么的纯函数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `(code, name?)` | `string` | — | 代码里的拉丁字母前 2 个（大写）；没有就取名称首字，再没有取代码首字符。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SymbolMark } from '@katana-ui/react'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

export function SymbolMarkUsage() {
  return (
    <>
      <SymbolMark symbol="AAPL" name="Apple" />
      <SymbolMark symbol="600519" name="贵州茅台" />
      <SymbolMark symbol="00700" name="腾讯控股" />
      <SymbolMark symbol="BTCUSDT" name="Bitcoin" />

      <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} />
      <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} size="md" />

      <SymbolMark symbol="ETH" name="Ethereum" src="data:image/png;base64,broken" />
    </>
  )
}
```

## States

- 字母圆标：底 surface-overlay（bg-400）、字 content-body（ink-200），中性，不按代码上色。
- 有图：圆形裁切、铺满；图加载失败退回字母，换了 src 会重新尝试。
- 代码里没有拉丁字母（600519、00700）：取名称首字，再没有取代码首字符。
- sm（18）字号 12，md（28）及以上字号 16；data-size 标出档位。

## Don't

- 不要按代码随机上色：颜色留给数据。
- 不要在件里内置真实公司或币种的标志。
- 不要拿它当按钮：它是 role=img 的徽标，可点的是它所在的行或卡。

## Composition

```
SymbolMark
  span[role=img][aria-label][data-size]
    img（有图且没失败）| span 字母
```
