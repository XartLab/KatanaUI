# LinkGroup

同一联动组的件共用品种、周期、十字线时刻、可见区间（#22 G8）：自选点一行，同组的图换品种；一张图上移动十字线，同组的图跟着画。照 TradingView 多图布局的同步（品种、周期、十字线、时间、日期区间）与自选联动。组 id 一般是面板头色点的 LinkGroup（A–D），null 不联动。纯 context，不带宿主、不存盘。标题栏里放 LinkGroupPicker 选组（A–D 或不联动，#150）。

## Provide

`*` marks a required prop.

### useLinkGroup(group, { fields?, initial? })

返回 [状态, 改]：状态是 { symbol?, interval?, crosshairTime?, range? }，改是合并几个字段。group 为 null 时不联动，状态只在这个件里（initial 起头）；联动时组里没设过的字段取 initial（件自己的默认品种、周期）。fields 只订阅这几个字段：十字线一直在变，只订阅 symbol 的自选不跟着重画。

### createLinkHub(initial?) / LinkGroupProvider / useLinkHub

联动表：get、set（值没变的字段不算改，什么都没变不通知；range 按 from / to 比）、select（订阅的字段没变时返回同一个对象）、subscribe（回调拿到改了哪些字段）。没有 Provider 时整个应用一张默认表；测试、多窗口、要隔开两套联动时自己建一张包上。

### LinkGroupPicker

标题栏里 22×22 的小按钮，中间是联动灯；点开是 A–D 四组加「不联动」的单选菜单，每组行尾写联动表里这组现在的品种。不存组，value / onValueChange 由调用方接（同 useLinkGroup 的 group）；carry 传 useLinkGroup 返回的状态，进组时交给组里还没设过的字段。文字经 labels 传，组没给名字时写字母。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `LinkGroup \| null` | — | Group of the panel; null is unlinked. |
| `onValueChange` * | `(group: LinkGroup \| null) => void` | — | Called with the chosen group, or null when the user unlinks the panel. |
| `carry` | `LinkGroupState` | — | What the panel shows now (the state from useLinkGroup). |
| `labels` * | `LinkGroupPickerLabels` | — | Texts written by the caller. |
| `className` | `string` | — | Extra class name of the button. |

### joinLinkGroup(hub, group, carry)

选组件进组时调的那一步，自己做选组界面时也用它：组里还没设过的品种、周期、可见区间取 carry（经 hub.set），设过的不动；十字线时刻不交。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import { ToggleGroup, ToggleGroupItem, useLinkGroup, type LinkGroup } from '@katana-ui/react'

// 示例数据：四个品种、一段固定的 60 分钟窗口，不是行情。
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'NVDA', 'QQQ']
const T0 = Date.UTC(2026, 10, 20, 1, 30)
const SPAN = 60 * 60_000
const clock = (time: number) => new Date(time).toISOString().slice(11, 16)

/** 联动组的选择：A、B 两组，或不联动。 */
function GroupPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: LinkGroup | null
  onChange: (next: LinkGroup | null) => void
}) {
  return (
    <ToggleGroup
      size="sm"
      aria-label={label}
      value={value ?? 'none'}
      onValueChange={(next) => next && onChange(next === 'none' ? null : (next as LinkGroup))}
    >
      <ToggleGroupItem value="A">A</ToggleGroupItem>
      <ToggleGroupItem value="B">B</ToggleGroupItem>
      <ToggleGroupItem value="none">不联动</ToggleGroupItem>
    </ToggleGroup>
  )
}

/** 自选：点一个品种写进组里（只订阅 symbol，十字线变了不重画）。 */
function Watch({ group }: { group: LinkGroup | null }) {
  const [link, set] = useLinkGroup(group, { fields: ['symbol'], initial: { symbol: SYMBOLS[0] } })
  return (
    <ToggleGroup
      size="sm"
      aria-label="自选"
      value={link.symbol ?? ''}
      onValueChange={(next) => next && set({ symbol: next })}
    >
      {SYMBOLS.map((symbol) => (
        <ToggleGroupItem key={symbol} value={symbol}>
          {symbol}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** 一张「图」：品种与周期跟组走，指针在条上移动时把十字线时刻写进组里，同组的另一张跟着画竖线。 */
function Chart({
  name,
  group,
  onGroup,
}: {
  name: string
  group: LinkGroup | null
  onGroup: (g: LinkGroup | null) => void
}) {
  const [link, set] = useLinkGroup(group, { initial: { symbol: SYMBOLS[0], interval: '5' } })
  const at = link.crosshairTime ?? null
  return (
    <PanelFrame aria-label={name} data-link-chart={name} style={{ width: 280 }}>
      <PanelFrameHeader
        heading={name}
        object={link.symbol}
        linkGroup={group}
        labels={{ link: `联动组 ${group ?? '无'}` }}
      />
      <PanelFrameBody>
        <div style={{ display: 'grid', gap: 8, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <ToggleGroup
              size="sm"
              aria-label={`${name} 周期`}
              value={link.interval ?? ''}
              onValueChange={(next) => next && set({ interval: next })}
            >
              <ToggleGroupItem value="1">1m</ToggleGroupItem>
              <ToggleGroupItem value="5">5m</ToggleGroupItem>
              <ToggleGroupItem value="60">1h</ToggleGroupItem>
            </ToggleGroup>
            <GroupPicker label={`${name} 联动组`} value={group} onChange={onGroup} />
          </div>
          <div
            data-slot="crosshair-strip"
            style={{ position: 'relative', height: 40, borderRadius: 4, background: 'var(--alpha-white-5)' }}
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              set({ crosshairTime: T0 + Math.round(((event.clientX - box.left) / box.width) * SPAN) })
            }}
            onPointerLeave={() => set({ crosshairTime: null })}
          >
            {at === null ? null : (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${((at - T0) / SPAN) * 100}%`,
                  width: 1,
                  background: 'var(--k-content-secondary-foreground)',
                }}
              />
            )}
          </div>
          <span className="gal-note" data-slot="crosshair-readout" style={{ margin: 0 }}>
            {at === null ? '十字线：—' : `十字线：${clock(at)}`}
          </span>
        </div>
      </PanelFrameBody>
    </PanelFrame>
  )
}

// 自选与两张图默认都在 A 组：点品种两张图一起换；在一张图的条上移动指针，另一张同时画十字线。把一张图换到 B 或「不联动」，它就各走各的。
export function LinkGroupUsage() {
  const [watchGroup, setWatchGroup] = useState<LinkGroup | null>('A')
  const [left, setLeft] = useState<LinkGroup | null>('A')
  const [right, setRight] = useState<LinkGroup | null>('A')
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} data-slot="link-watch">
        <Watch group={watchGroup} />
        <GroupPicker label="自选 联动组" value={watchGroup} onChange={setWatchGroup} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Chart name="图 1" group={left} onGroup={setLeft} />
        <Chart name="图 2" group={right} onGroup={setRight} />
      </div>
    </div>
  )
}
```

## States

- 联动：同组的件读写同一份状态，一边改另一边马上跟。
- 不联动（group 为 null）：件自己记，跟谁都不同步；面板头的色点画熄灭的环。
- 换组：读到新组的状态；新组没设过的字段用 initial。
- 选组件：在组里灯是组色（8px，带同色光晕）；不联动是一圈 3:1 的空环；菜单开着按钮底色深一档，当前那组打勾。
- 从选组件进组：进有品种的组改看组的；进空组时组取这件的品种与周期，件不跳回 initial；不联动时件回到自己记的状态。

## Don't

- 不要把十字线时刻存进存档：它只活在指针移动的这一会儿（离开图写 null）。
- 不要让只关心品种的件订阅全部字段：十字线每帧都在变，会跟着重画。
- 不要拿它传下单参数：联动只管看什么，不管交易（下单走执行网关）。
- 不要在同一个标题栏里既放 LinkGroupPicker 又给 PanelFrameHeader 传 linkGroup：两个灯会重复。
- 不要自己造组色：只有 link-a…d 四色；要第五组先问用户。

## Composition

```
LinkGroupProvider（可省）
  件 × n（useLinkGroup(组, 字段)）
    标题栏：LinkGroupPicker（button · Led）
      DropdownMenu（单选：A · B · C · D ｜ 不联动）
联动表：组 → { symbol, interval, crosshairTime, range }
```

## Keyboard

- `Enter / Space / ↓`：在选组件上：打开组菜单
- `↑ / ↓`：菜单里换项；Home / End 到头尾
- `Enter / Space`：选中这一组（或不联动），菜单收起，焦点回到按钮
- `Esc`：收起菜单，不换组
