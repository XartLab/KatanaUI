# CompsTable

一行一家公司、一列一个指标的同业对比（KATANAview #2395）：本公司置顶、左侧一条竖线并写「本公司」，排序时不动；表尾中位数、均值两行（对全部行算原数）；每格按相对中位数好多少着强度底色，方向由指标的 better 定（PE 越低越好），没写方向的只写数不着色。指标分组用表上方的列集页签切换（估值 / 增长 / 盈利）。表本身是 DataGrid，页签是 ColumnSetTabs。功能参照 Koyfin Comps 与 Bloomberg RV。

## Provide

`*` marks a required prop.

### CompsTable

数与文字全由 props 传；颜色只由 token 给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `CompsRow[]` | — | id、symbol、name、subject（本公司）、values（指标 id → 数）。 |
| `metrics` | `CompsMetric[]` | — | id、label、sub（口径小字）、group、better（higher / lower）、format、width。 |
| `groups` | `{ id, label }[]` | — | 列集页签；第一组默认选中。不给就一次显示全部列。 |
| `labels` | `CompsTableLabels` | — | 表名、公司列头、页签读屏名、中位数、均值、本公司、空态。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CompsTable } from '@katana-ui/react/quant'
import { DEMO_COMPS_GROUPS, DEMO_COMPS_METRICS, DEMO_COMPS_ROWS } from '../fundamentals-data'

export function CompsTableUsage() {
  return (
    <div className="gal-wide" data-gallery-comps="main" style={{ maxWidth: 760 }}>
      <CompsTable
        rows={DEMO_COMPS_ROWS}
        metrics={DEMO_COMPS_METRICS}
        groups={DEMO_COMPS_GROUPS}
        labels={{
          table: '示例：同业对比',
          symbol: '公司',
          groups: '指标组',
          median: '中位数',
          mean: '均值',
          subject: '本公司',
          empty: '没有同业',
        }}
        source="来源 / 演示数据（虚构公司，固定种子合成）"
      />
    </div>
  )
}
```

## States

- 默认：第一组列，原次序，本公司在最上。
- 按列排序：本公司仍在最上，其余按这一列，没数的排最后。
- 缺数的格写「—」，不进中位数与均值。
- 没写 better 的指标：只写数，不着色（字段语义推不出不自动给方向）。

## Don't

- 不要给本公司行换底色：底色留给好坏强度。
- 不要猜指标的好坏方向。
- 不要用表尾的中位数去算底色以外的东西：底色是相对中位数，表尾写的是原数。

## Composition

```
CompsTable
  列集页签（估值/增长/盈利）
  DataGrid（公司列粘左 · 指标列 · 表尾中位数 / 均值）
  来源行
```

## Keyboard

- `Tab`：进页签、进表
- `方向键`：在页签间、格间走
- `Enter`：在列头上：排序
