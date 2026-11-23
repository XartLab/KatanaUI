# CompanyProfile

对 TradingView 的 Company Profile 小组件（KatanaUI #147；它的页面写「公司简介加 sector 与 industry」）：公司名，下面几项事实（行业、细分行业、员工数、总部、网站…，标签与值由调用方写），再下面是简介正文，超过 collapsedLines 行时截断并出「展开」按钮。没有事实也没有正文时画空态（未连接 / 未实装），不画假数据。

## Provide

`*` marks a required prop.

### CompanyProfile

facts 是 { id, label, value? }，value 可以是任何节点（链接也行）；没给 value 画「—」。按钮与空态的字在 labels。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `string` | — | Company name; the heading and the accessible name of the card. |
| `facts` | `readonly CompanyProfileFact[]` | `[]` | Facts under the name, in reading order (sector and industry first, as in TradingView). |
| `description` | `string` | — | Plain-text company description. |
| `collapsedLines` | `number` | `4` | Lines of the description shown before it is expanded; 4 by default. |
| `defaultExpanded` | `boolean` | `false` | Expanded at first render (uncontrolled). |
| `source` | `ReactNode` | — | Small line at the bottom (source, as-of date), written by the caller. |
| `labels` * | `CompanyProfileLabels` | — | Button and empty-state texts, written by the caller (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CompanyProfile } from '@katana-ui/react/quotes'

export function CompanyProfileUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <CompanyProfile
        name="Alpha Devices"
        facts={[
          { id: 'sector', label: 'Sector', value: 'Electronic technology' },
          { id: 'industry', label: 'Industry', value: 'Telecommunications equipment' },
        ]}
        description="Designs and sells consumer electronics, computing hardware and related services."
        labels={{ more: 'Show more', less: 'Show less', empty: 'Not connected' }}
      />
    </div>
  )
}
```

## States

- 折叠：正文只留 collapsedLines 行（line-clamp），真被截断时才出「展开」按钮（量 scrollHeight，宽度变了重量）。
- 展开：正文全显，按钮换成「收起」，aria-expanded 跟着变。
- 没有数据：只有公司名与 labels.empty。
- 事实的值过长：省略号截断。

## Don't

- 不要拿它放长篇报告：正文是纯文字，长文用 Markdown 件。
- 不要在没接数据源时塞样本文字：给空态。

## Composition

```
CompanyProfile section[aria-label]
  h3（公司名）
  dl（div × n：dt 标签 · dd 值）
  div（p 正文 · button 展开 / 收起）
  p（来源）
```

## Keyboard

- `Tab / Enter / Space`：到「展开 / 收起」按钮、切换
