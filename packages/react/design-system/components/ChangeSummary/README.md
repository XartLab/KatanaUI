# ChangeSummary

周报、日报、看板顶上的「这段时间变了什么」：灰底托盘，头一行图标、标题、区间；每个指标一行写名字与变化的文字（调用方写好，如「1.12 → 1.38」）和方向箭头。好坏与涨跌分开：回撤变大是 bad，箭头照样朝上，颜色走状态色（ok / danger），不用涨跌色。用 dl，读屏把变化和指标名一起读，箭头是装饰。功能参照 affectUI 的 Change Summary（affectui.com/components/change-summary，2026-11-23 读；页上标 MIT，这里也只学功能，代码原创）。演示数据是示例。

## Provide

`*` marks a required prop.

### ChangeSummary

每行的 tone 定颜色（good / bad / neutral），direction 定箭头（up / down，不给是平的）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `changes` * | `readonly ChangeItem[]` | — | Rows, at most about six. |
| `title` * | `ReactNode` | — | Heading. |
| `period` | `ReactNode` | — | Small period text on the right of the heading (「11-16 → 11-22」). |
| `icon` | `ReactNode` | — | Icon in front of the heading; omit for none. |
| `empty` | `string` | — | Text when there are no changes. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { HistoryIcon } from 'lucide-react'
import { ChangeSummary } from '@katana-ui/react/quant'

// 示例数据：一周的策略指标变化，文字由调用方写好；回撤变大是「坏」，箭头照样朝上。
export function ChangeSummaryUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 360 }} data-gallery-changes="main">
      <ChangeSummary
        title="本周变化（示例）"
        period="11-16 → 11-22"
        icon={<HistoryIcon />}
        changes={[
          { id: 'pnl', label: '周盈亏', change: '+1.8%', tone: 'good', direction: 'up' },
          { id: 'sharpe', label: '滚动夏普', change: '1.12 → 1.38', tone: 'good', direction: 'up' },
          { id: 'mdd', label: '最大回撤', change: '8.1% → 9.4%', tone: 'bad', direction: 'up' },
          { id: 'turnover', label: '换手', change: '持平', tone: 'neutral' },
        ]}
      />
    </div>
  )
}
```

## States

- good：ok 色字与箭头。
- bad：danger 色。
- neutral：正文色。
- 没有变化：给了 empty 就写它，不给不画列表。

## Don't

- 不要超过六行：长了用表。
- 不要拿它比精确数值的走势：用 KpiChart 或表。

## Composition

```
ChangeSummary
  头（图标 · 标题 · 区间）
  dl（每行：dt 指标名 · dd 变化文字与箭头）
```
