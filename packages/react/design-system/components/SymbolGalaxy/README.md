# SymbolGalaxy

持仓、自选、筛选结果按行业、市场、因子分位或状态聚成一团团的圆：面积是市值或仓位，圆面用发散色 div-*：正负各两档，-200 只给涨跌幅绝对值在前 20% 的点，中点灰，涨跌色不上面积；团名放在团的外接圆上方的留白里。上面一排切换分组方式，点在团间平滑迁移；悬停读详情，点击选中；Tab 在团间走、方向键在团内走。点多时自动改画 canvas。布局用 d3-hierarchy 的 pack，同样的数据永远同样的位置。功能参照 Arc Customer galaxy，实现原创。

## Provide

`*` marks a required prop.

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
| `legendText` | `(step: number) => string` | — | 色例每一档（-2 到 +2）写的字。 |
| `tooltip` | `(node) => { title, rows }` | — | 悬停时的 LCD 提示（标题与「名字 / 数值」几行）；不给就只有读数行。涨跌色只许上数字。 |
| `onSelect / selectedId` | `(node) => void / string \| null` | — | 点击或 Enter 选中；selectedId 画一圈强调色的标记。 |
| `canvasFrom` | `number` | `2000` | 点数达到它就改画 canvas。2000 出自 issue #1918 的设想，没有实测依据，待测量（测量票 #1923）。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### layoutGalaxy(nodes, groupBy, frame) / hitNode / stepNode

布局：先按团做圆堆积、团内的点也按大小做圆堆积（输入按大小与 id 定序，不用随机），返回各团的圆与每个点的位置；hitNode 找包含某个坐标的最小的圆；stepNode 在一团里按方向键挑最近的点。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolGalaxy, type GalaxyNode } from '@katana-ui/react/blocks'

const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */

function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

const SECTORS = ['金融', '科技', '消费', '能源', '医药']

const MARKETS = ['主板', '创业板', '科创板']

const STATES = ['持仓', '自选']

/** 示例品种：大小取对数正态（均值 3、标准差 0.9，再取指数，单位「亿」，只为画出有大有小），涨跌取正态（均值 0、标准差 2.5%）；行业、市场、因子分位、状态由序号与种子定。 */

function galaxyNodes(count: number, seed: number): GalaxyNode[] {
  const next = seeded(seed)
  const sizes = gaussians(seed + 1, count, 3, 0.9)
  const changes = gaussians(seed + 2, count, 0, 0.025)
  return Array.from({ length: count }, (_, i) => ({
    id: `s${String(i).padStart(4, '0')}`,
    label: `示例 ${String(i + 1).padStart(4, '0')}`,
    size: Math.exp(sizes[i]!),
    change: changes[i]!,
    groups: {
      sector: SECTORS[Math.floor(next() * SECTORS.length)]!,
      market: MARKETS[Math.floor(next() * MARKETS.length)]!,
      quantile: `第 ${1 + Math.floor(next() * 5)} 层`,
      state: STATES[next() < 0.3 ? 0 : 1]!,
    },
  }))
}

const GALAXY_NODES = galaxyNodes(48, 7)

const GALAXY_MANY = galaxyNodes(2400, 9)

const GROUPINGS = [
  { id: 'sector', label: '行业' },
  { id: 'market', label: '市场' },
  { id: 'quantile', label: '因子分位' },
  { id: 'state', label: '状态' },
]

export function SymbolGalaxyUsage() {
  const [picked, setPicked] = useState<GalaxyNode | null>(null)
  const shared = {
    groupings: GROUPINGS,
    groupingLabel: '分组方式',
    ...view(['名称', '分组', '详情'], '品种表'),
    describe: (node: GalaxyNode) =>
      `${node.label}：市值 ${node.size.toFixed(1)} 亿，涨跌 ${node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}`,
    groupText: (group: string, count: number) => `${group}，${count} 只`,
    legendText: (step: number) => ['大跌', '跌', '平', '涨', '大涨'][step + 2] ?? '',
    tooltip: (node: GalaxyNode) => ({
      title: node.label,
      rows: [
        { key: 'size', label: '市值', value: `${node.size.toFixed(1)} 亿` },
        {
          key: 'change',
          label: '涨跌',
          // 涨跌色只上数字（dataviz §2）。
          value: (
            <span style={{ color: (node.change ?? 0) >= 0 ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>
              {node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}
            </span>
          ),
        },
      ],
    }),
  }
  return (
    <>
      <div className="gal-wide" data-gallery-galaxy="svg">
        <SymbolGalaxy
          {...shared}
          nodes={GALAXY_NODES}
          label="示例：品种星系"
          onSelect={setPicked}
          selectedId={picked?.id ?? null}
          idle="悬停看详情，点一个点选中；Tab 在团间走，方向键在团内走"
        />
        <p data-gallery-galaxy-picked>{picked ? picked.label : ''}</p>
      </div>

      {/* canvas 是浏览器里画的，设计系统包的静态预览（服务端渲染）里画不出来，所以只在浏览器里摆这一行。 */}
      {typeof document !== 'undefined' && (
        <div className="gal-wide" data-gallery-galaxy="canvas">
          <SymbolGalaxy {...shared} nodes={GALAXY_MANY} label="示例：品种星系（2400 个）" defaultGroupBy="market" />
        </div>
      )}
    </>
  )
}

/** 5 层 31 期（2024-01 到 2026-07，每月一期）的示例累计超额收益（%）：期末值照卡 QuantileLayers 的量级（最高层约 +32、最低层约 -22）；第三层在「未通过」那一行故意压低到第二层之下。 */
```

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
