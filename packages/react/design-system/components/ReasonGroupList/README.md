# ReasonGroupList

复盘啦「涨停原因」对照（#11）：顶上一排原因芯片（ChipGroup，多选，不选是全部，芯片写家数）；下面是 DataGrid（treegrid）：组头行（展开箭头、粗体原因、次要灰的家数与「最高 N 板」，底色 selectable 组底色），展开后是组内个股（徽标 + 代码 + 名称、连板、涨跌幅、首封、封单、成交额、其他原因 Tag）。分组与次序照调用方给的，件不归类、不排序。

## Provide

`*` marks a required prop.

### ReasonGroupList

分组 ReasonGroup { id, reason, items }，个股 ReasonStock 见类型；金额写法 formatAmount 由调用方传（亿 / 万）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` * | `readonly ReasonGroup[]` | — | Groups in the caller's order. |
| `labels` * | `ReasonGroupListLabels` | — | Texts. |
| `formatAmount` | `(value: number) => string` | `formatVolume` | How an amount (seal, turnover) is written; defaults to the short volume form (520.00 M). |
| `filter` | `readonly string[]` | — | Reason ids kept by the chips (controlled); empty keeps all. |
| `onFilterChange` | `(filter: string[]) => void` | — | Called when the chips change. |
| `defaultCollapsed` | `readonly string[]` | `[]` | Group ids that start collapsed. |
| `onSelect` | `(stock: ReasonStock, group: ReasonGroup) => void` | — | Open a stock row (click or Enter). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ReasonGroupList, type ReasonGroup } from '@katana-ui/react/blocks'

// 演示数据：原因、代码、名称、封单与成交额都是编出来的，不是真实行情。
export const REASON_GROUPS: readonly ReasonGroup[] = [
  {
    id: 'robot',
    reason: '机器人',
    items: [
      {
        code: '300101',
        name: '示例减速器',
        board: 4,
        change: 20.0,
        firstSeal: '09:31',
        sealAmount: 3.2e8,
        turnover: 1.8e9,
        tags: ['人形'],
      },
      {
        code: '002102',
        name: '示例伺服',
        board: 2,
        change: 10.02,
        firstSeal: '09:45',
        sealAmount: 1.1e8,
        turnover: 9.2e8,
      },
      {
        code: '603103',
        name: '示例丝杠',
        board: 1,
        change: 10.0,
        firstSeal: '10:12',
        sealAmount: 4.6e7,
        turnover: 5.1e8,
        tags: ['汽车零部件'],
      },
    ],
  },
  {
    id: 'compute',
    reason: '算力',
    items: [
      {
        code: '000201',
        name: '示例光模块',
        board: 3,
        change: 10.01,
        firstSeal: '09:35',
        sealAmount: 2.4e8,
        turnover: 2.6e9,
        tags: ['CPO'],
      },
      {
        code: '600202',
        name: '示例服务器',
        board: 1,
        change: 9.99,
        firstSeal: '13:05',
        sealAmount: 3.0e7,
        turnover: 1.2e9,
      },
    ],
  },
  {
    id: 'lowalt',
    reason: '低空经济',
    items: [
      {
        code: '002301',
        name: '示例飞控',
        board: 1,
        change: 10.03,
        firstSeal: '10:40',
        sealAmount: 6.5e7,
        turnover: 4.4e8,
      },
    ],
  },
]

export function ReasonGroupListUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ReasonGroupList
        groups={REASON_GROUPS}
        labels={{
          list: '涨停原因分组（演示数据）',
          filter: '按原因筛选',
          clear: '清除筛选',
          count: (n) => `${n} 家`,
          highest: (n) => `最高 ${n} 板`,
          board: (n) => (n === 1 ? '首板' : `${n} 板`),
          columns: {
            name: '名称',
            board: '连板',
            change: '涨跌幅',
            firstSeal: '首封',
            sealAmount: '封单',
            turnover: '成交额',
            tags: '其他原因',
          },
          empty: '没有涨停',
        }}
      />
    </div>
  )
}
```

## States

- 展开 / 收起：点组头或在组头上按 Enter；箭头朝右是收起，展开转 90°（snappy 弹簧）；组头带 aria-expanded。
- 筛选：选了芯片只留这些原因的组；清除钮在有选中时出现。
- 涨跌幅走 ChangeText（跟 data-updown 换红绿）；没有封单、成交额写「—」。
- 空：筛完没有组时画空态文字。

## Don't

- 不要在件里按原因归类个股；一只票属于几个原因由调用方定，别的原因放 tags。
- 金额不要写死「亿」，由 formatAmount 传。

## Composition

```
ReasonGroupList
  ChipGroup（原因筛选）
  DataGrid（treegrid，presorted）
    组头行（level 1）：箭头 | 原因 | 家数 | 最高板
      个股行（level 2）：徽标 + 代码 + 名称 | 连板 | 涨跌幅 | 首封 | 封单 | 成交额 | 其他原因
```

## Keyboard

- `↑ / ↓`：在行间移动（DataGrid）
- `Enter`：组头：收起 / 展开；个股：打开（onSelect）
- `← / →`：在芯片间移动（ChipGroup）
