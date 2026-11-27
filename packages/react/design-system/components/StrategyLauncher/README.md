# StrategyLauncher

一列策略与工具的入口卡（照 OKX 永续页的「工具」组件，2026-11-26 实测）：顶上一条可关的风险提示（文字由调用方给，点关闭钮收起并回调），下面每张卡是图标、名字、可选的「新」角标、标签串（默认用「 / 」连成一行，tagStyle="chips" 画成小标签）、右箭头。点卡回调 onOpen(id)。件只列入口，入口指向什么（下单策略、运行中心、信号）由宿主定，包里不带任何策略。

## Provide

`*` marks a required prop.

### StrategyLauncher

entries 是 { id, name, icon?, isNew?, tags? }[]；labels 必填：整件的读屏名、关闭钮的读屏名、角标文字。notice 不给就没有提示条。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entries` * | `readonly StrategyEntry[]` | — | The entry cards, in order. |
| `onOpen` * | `(id: string) => void` | — | Called with the entry id when a card is clicked or opened with Enter or Space. |
| `notice` | `ReactNode` | — | Risk notice above the cards; nothing is drawn when omitted or after it is closed. |
| `onNoticeDismiss` | `() => void` | — | Called when the risk notice is closed. |
| `tagStyle` | `'text' \| 'chips'` | `'text'` | How tags are drawn: joined with " / " in one line (default) or as small outlined tags. |
| `labels` * | `StrategyLauncherLabels` | — | Accessible names and the New badge text. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GaugeIcon, Grid3x3Icon, RadioIcon, RepeatIcon } from 'lucide-react'
import { useState } from 'react'
import { StrategyLauncher, type StrategyEntry } from '@katana-ui/react/blocks'

// 演示入口（不是库自带的策略）：入口指向什么由宿主定。
const ENTRIES: readonly StrategyEntry[] = [
  { id: 'grid', name: '网格策略', icon: <Grid3x3Icon />, tags: ['震荡行情', '自动低买高卖', '区间可调'] },
  { id: 'dca', name: '定投加仓', icon: <RepeatIcon />, tags: ['分批建仓', '摊低成本'], isNew: true },
  { id: 'signal', name: '信号策略', icon: <RadioIcon />, tags: ['外部信号', '自动下单', '风控额度'] },
  { id: 'runs', name: '运行中心', icon: <GaugeIcon />, tags: ['查看运行', '暂停与停止'] },
]

export function StrategyLauncherUsage() {
  const [opened, setOpened] = useState('')
  return (
    <div style={{ width: 360 }}>
      <StrategyLauncher
        entries={ENTRIES}
        notice="策略会按设定自动下单，行情剧烈时可能亏损；运行前先确认风控额度。"
        labels={{ region: '策略工具', dismiss: '关闭风险提示', new: '新' }}
        onOpen={setOpened}
      />
      <p data-gallery-opened={opened} style={{ margin: '8px 0 0', fontSize: 12 }}>
        {opened ? `打开：${opened}` : '点一张卡'}
      </p>
    </div>
  )
}
```

## States

- 有 notice：顶上一条 warn 语气的提示条，右上角关闭钮；关了就不再画（件内记住，同时回调 onNoticeDismiss）。
- 卡悬停：底色提亮、箭头变主文字色；键盘聚焦画内缩焦点环。
- 带 isNew：名字后面一个 ok 语气的小角标。
- 没有 icon 的卡：不留图标位，文字顶到左边。

## Don't

- 不要把风险提示写在卡里：它在整列顶上，关掉以后不再回来。
- 不要每张卡写超过四个标签：一行放不下就是写多了。
- 不要在包里放策略名单：入口全由宿主传。

## Composition

```
StrategyLauncher section[aria-label]
  Alert（warn，role=note）：图标 · 说明 · 关闭钮
  ul > li > button 卡：图标块 · 名字 + 角标 · 标签串 | 右箭头
```

## Keyboard

- `Tab`：关闭钮、各张卡，依次走
- `Enter / 空格`：打开聚焦的卡；在关闭钮上收起提示
