# Emphasis

分量：同一个组件放在看板顶上当主角、放在中间当正文、放在边栏当一行，该画成什么样。三档：hero（主角：大数用 display 档，配迷你线；一个区里最多一处）、standard（正文，默认：完整的表、图、列表，数据用 data 档）、compact（一行：标签加读数并排，表只留前几行且不出表头，列表一行一条）。用 EmphasisProvider 包一层，里面的件各自读 useEmphasis()，往下继承，里层盖住外层。分量只改字号档、显示多少、要不要表头；不改颜色，不改密度（密度仍由 data-density 管）。现在认分量的：QuoteCard、PriceTag、GaugeBar、DataGrid、NewsFeed；别的件照 standard 画。

## Provide

`*` marks a required prop.

### EmphasisProvider

只渲染 context，不渲染元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `Emphasis` | — | The emphasis of everything inside. |
| `children` | `ReactNode` | — | The content. |

### useEmphasis

钩子：读最近一层 EmphasisProvider 给的分量（hero、standard 或 compact），没有就是 standard。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { EmphasisProvider, GaugeBar, QuoteCard, useEmphasis } from '@katana-ui/react'

function Current() {
  return <small>当前分量：{useEmphasis()}</small>
}

export function EmphasisUsage() {
  return (
    <EmphasisProvider value="hero">
      <QuoteCard name="Alpha" symbol="AAA" price="11.80" change="+1.80" percent="+18.00%" tone="up" />
      <EmphasisProvider value="compact">
        <GaugeBar label="Ratio" value="72.00%" share={0.72} />
        <Current />
      </EmphasisProvider>
    </EmphasisProvider>
  )
}
```

## States

- hero：QuoteCard、PriceTag、GaugeBar 的数用 display 档（QuoteCard 的迷你图加高）；DataGrid、NewsFeed 内容不变、字上一档。
- standard：不包 Provider 时的样子。
- compact：QuoteCard 名字、价格、涨跌并排，不画迷你图与下面一行；GaugeBar 只留名字、数、档位词；DataGrid 不出表头、只留排好序之后的前 5 行，表下面写「另有 N 行」（文案由宿主 texts.moreRows 给，不静默截断），列只留名称与主数两列（列声明标 compact: true 的列；一列都没标就留前两个可见列），名称列吃掉剩下的宽度、超长省略号截断；NewsFeed 一行一条（时间加标题），不画标题行、频道、搜索、过滤、来源、品种、快捷操作。

## Don't

- 不要在一个区里放两个 hero：主角只有一个。
- 不要用分量去改颜色或密度：颜色看语义 token，密度看 data-density。
- 不要给件单独传「小一点」之类的样式：包一层 EmphasisProvider。

## Composition

```
EmphasisProvider（value）
  认分量的件（读 useEmphasis）
  EmphasisProvider（里层盖住外层）
```
