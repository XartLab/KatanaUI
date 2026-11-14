# SymbolGalaxy

持仓、自选、筛选结果按行业、市场、因子分位或状态聚成一团团的圆：面积是市值或仓位，颜色是涨跌（七档，跟涨跌配色走）。上面一排切换分组方式，点在团间平滑迁移；悬停读详情，点击选中；Tab 在团间走、方向键在团内走。点多时自动改画 canvas。布局用 d3-hierarchy 的 pack，同样的数据永远同样的位置。功能参照 Arc Customer galaxy，实现原创。

## Provide

### SymbolGalaxy

文字全由 props 传：团名取自每个点 groups 里的值，一个点与一团的整句在 describe 与 groupText 里，包里没有文案。每团是一个 Tab 停靠点（role=group）；SVG 与 canvas 两种画法的键盘与读屏一样（团的圈、标签与标记都是 SVG）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nodes` | `GalaxyNode[]` | — | { id, label, size, change, groups: { 分组方式 id: 团名 } }；size 不是正的有限数的点不画；change 是涨跌幅（小数），null 用中性色。 |
| `groupings` | `{ id, label }[]` | — | 可切换的分组方式，每个点的 groups 里要有这些 id。 |
| `groupBy / defaultGroupBy / onGroupByChange` | `string` | — | 当前分组方式；不给 groupBy 就是不受控。 |
| `label / groupingLabel` | `string` | — | 整张图与分组开关的读屏名（必填）。 |
| `describe` | `(node) => string` | — | 一个点的整句详情（读数行）。 |
| `groupText` | `(group, count) => string` | — | 一团的读屏名，含个数。 |
| `legendText` | `(step: number) => string` | — | 色例每一档（−3 到 +3）写的字。 |
| `limit` | `number` | `0.03` | 色例两端的涨跌幅（小数），同 Treemap。 |
| `onSelect / selectedId` | `(node) => void / string \| null` | — | 点击或 Enter 选中；selectedId 画一圈强调色的标记。 |
| `canvasFrom` | `number` | `2000` | 点数达到它就改画 canvas。2000 出自 issue #1918 的设想，没有实测依据，待测量。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### layoutGalaxy(nodes, groupBy, frame) / hitNode / stepNode

布局：先按团做圆堆积、团内的点也按大小做圆堆积（输入按大小与 id 定序，不用随机），返回各团的圆与每个点的位置；hitNode 找包含某个坐标的最小的圆；stepNode 在一团里按方向键挑最近的点。

## States

- 默认：一团一个虚线圈，圈上方写团名，圈里是各点的圆，面积跟大小成正比。
- 悬停一个点：描一圈，读数行写它的详情；点击选中后留一圈强调色。
- 切换分组方式：点在团间平滑迁移（SVG 用 CSS 过渡，canvas 自己插值，时长同 --dur-snappy）。
- 点数达到 canvasFrom：点改画在 canvas 上，团的圈、标签与标记仍是 SVG。
- 键盘聚焦一团：圈加粗成焦点环，团内当前点描一圈，读数行写它的详情。

## Don't

- 不要拿它比精确的数：面积与位置只给一个大概，要读数看读数行或表格。
- 不要放没有分组意义的数据：分组方式切到只有一团时它就是一个普通的圆堆。
- 不要把 canvasFrom 调得很大还指望流畅：SVG 每点一个节点，点多了迁移会卡。

## Composition

```
SymbolGalaxy
  ToggleGroup（分组方式）
  div
    canvas（点多时，aria-hidden）
    svg role=group
      circle（一个点，SVG 画法）
      g role=group tabindex=0（一团：圈 · 团名）
      circle（选中 / 键盘 / 悬停的标记）
  ol（色例，七档）
  output（读数行）
```

## Keyboard

- `Tab`：在团间走（每团一个停靠点）
- `← ↑ ↓ →`：在团内跳到那个方向最近的点，那一侧没有点就不动
- `Enter / Space`：给了 onSelect 时选中团内当前点
