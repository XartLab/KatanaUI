# Splitter

一条 role=separator 的分割线：拖动零延迟、方向键 8px（Shift 32px）、Home / End、双击或 Enter 复位、靠近 1/3 1/2 2/3 吸附、两边最小尺寸。宿主只管排版，线只管比例。

## Provide

`*` marks a required prop.

### Splitter

线放在它分开的两块之间，量父元素的宽高换算比例（父元素是 grid，线占中间一条轨道）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `axis` | `'row' \| 'column'` | — | row = 左右两块（竖线）；column = 上下两块（横线）。 |
| `ratio` | `number` | — | 第一块占可用长度的比例，0 到 1。 |
| `defaultRatio` | `number` | `0.5` | 双击与 Enter 回到的比例。 |
| `minFirst / minSecond` | `number` | `0` | 两边最小尺寸（px）。 |
| `snapPoints / snapThresholdPx` | `number[] / number` | `1/3 1/2 2/3 / 6` | 吸附点与半径；传空数组或 0 关掉吸附。 |
| `keyStepPx / fastStepPx` | `number` | `8 / 32` | 方向键一步与 Shift 加速的一步。 |
| `onPreview` | `(ratio) => void` | — | 拖动中每次移动：宿主直接写样式改布局（不要 setState）。 |
| `onChange` | `(ratio) => void` | — | 提交：松手、方向键、双击、Enter。 |
| `onDraggingChange` | `(dragging: boolean) => void` | — | 开始 / 结束拖动。 |
| `label / valueText` | `string / (ratio) => string` | — | 线的名字与读屏念的值（说明第一块占几成）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Splitter } from '@katana-ui/react'

export function SplitterUsage() {
  const [ratio, setRatio] = useState(0.4)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <div
        data-testid="splitter-demo"
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, ${ratio}fr) 8px minmax(0, ${1 - ratio}fr)`,
          height: 120,
        }}
      >
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {Math.round(ratio * 100)}%
          </p>
        </div>
        <Splitter
          axis="row"
          ratio={ratio}
          minFirst={80}
          minSecond={80}
          onPreview={() => {}}
          onChange={setRatio}
          label="Resize panes"
          valueText={(value) => `First pane ${Math.round(value * 100)}%`}
        />
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {100 - Math.round(ratio * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}
```

## States

- 默认：1px line-100 的线，中央 16×2 的把手。
- 悬停：线变 line-200，把手提亮。
- 拖动中：线 2px signal-orange 加发光，把手同色；两侧实时重排。
- 键盘焦点：2px 焦点环。

## Don't

- 不要拿它拖出新面板或拖到边缘分裂（不是 docking）。
- 拖动中不要触发面板内部的重渲染。
- 不要让松手改掉用户拖到的精确位置（吸附只在半径内）。

## Composition

```
Splitter（role=separator）
  把手
```

## Keyboard

- `← →（或 ↑ ↓）`：挪 8px；Shift 挪 32px
- `Home / End`：第一块缩到最小 / 放到最大
- `Enter`：回到默认位置（APG 里 Enter 是折叠，这里没有折叠）
