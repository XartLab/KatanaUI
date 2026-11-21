# LayoutRules

排版（结构、表现形式）的四条规则：数字用等宽数字；数字右对齐、文字左对齐；块与块之间靠细线和留白、不加框；字号随分量走、不随位置乱改。后面六个排版原语（Stack、Cluster、Sidebar、Switcher、Grid、Reel）管「放在哪、隔多远」，分量（EmphasisProvider）管「这一块多重」，这四条管剩下的细节。

## Provide

`*` marks a required prop.

### 四条规则

没有属性：这一页是规则，不是组件。每条都配了一个小样，样子都是用本页之后的件与 token 摆出来的。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Cluster, EmphasisProvider, PriceTag, Stack } from '@katana-ui/react'

// 块与块之间留白（Stack 的 gap）；字号跟分量走。
export function LayoutRulesUsage() {
  return (
    <Stack gap="space-4">
      <EmphasisProvider value="hero">
        <PriceTag name="Alpha" price="11.80" change="+18.00%" tone="up" />
      </EmphasisProvider>
      <Cluster gap="space-3">
        <PriceTag name="Beta" price="10.20" change="-15.00%" tone="down" />
        <PriceTag name="Gamma" price="9.99" change="0.00%" />
      </Cluster>
    </Stack>
  )
}
```

## States

- 等宽数字：数字列、读数、价格都开 tabular-nums（件里已经开了），自己写的数字也要开。
- 对齐：表里数字列靠右、文字列靠左，列头跟着本列；卡片里的读数单列，靠左。
- 分组：块与块之间用 Stack、Cluster 的 gap 留白，必要时一条 1px 细线（--line-100），不套框、不上底色。
- 字号：由 EmphasisProvider 的分量决定（hero 用 display 档，standard 用 data 档，compact 降一档），不因为它摆在哪一格而改。

## Don't

- 不要给原语加边框或底色去「分块」：要分就加间距，或一条细线。
- 不要用比例数字写数字列：位数对不齐，读串价位。
- 不要居中对齐数字列，也不要把文字列靠右。
- 不要在件外面单独写 font-size 去放大或缩小它：调分量。

## Composition

```
Stack
  四条规则各一段（标题、小样、一句说明）
```
