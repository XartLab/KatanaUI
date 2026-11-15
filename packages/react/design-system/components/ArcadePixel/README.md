# ArcadePixel

街机式像素屏：5x7 点阵字体或自带精灵画在 canvas 上，可选打字、擦除、闪烁、跑马灯四种进场，再叠扫描线、CRT 暗角与荧光。取自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### ArcadePixel

画布 aria-hidden，文字另放 sr-only 给读屏；屏外与标签页隐藏时动画暂停。文字与精灵二选一，都给时精灵优先。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | — | 用内置 5x7 字体画的文字；只认拉丁字母、数字与 - , : ! ? . * 空格，其余画成空格。 |
| `sprite` | `number[][]` | — | 二维数组，值是色板下标，0 为空。内置 ARCADE_SPRITES：alien、alienAlt、arrow、heart。 |
| `palette` | `string[]` | `['transparent', 'var(--signal-orange)']` | 下标对应的颜色，CSS 颜色或 var(--token)；下标 0 是底。 |
| `pixelSize` | `number` | `8` | 一个像素格的边长（CSS 像素）。 |
| `gap` | `number` | `1` | 像素格之间的间隔。 |
| `columns` | `number` | — | 显示窗口的宽（格数），默认等于内容宽；跑马灯用它定窗口。 |
| `animate` | `'none' \| 'type' \| 'wipe' \| 'blink' \| 'marquee'` | `'none'` | 进场动画；marquee 一直滚。 |
| `loop` | `boolean` | `false` | 进场动画是否反复；blink 在 loop 下一直闪。 |
| `speed` | `number` | `1` | 动画速度倍数。 |
| `glow` | `boolean \| number` | `false` | 荧光外溢；数字是强度 0 到 1，true 为 0.65。 |
| `scanlines` | `boolean` | `false` | 缓慢上漂的扫描线。 |
| `crt` | `boolean` | `false` | 暗角、红蓝边色散、滚动亮带与轻微闪烁。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ARCADE_SPRITES, ArcadePixel, Button, type ArcadePixelAnimate } from '@katana-ui/react'

const ARCADE_ANIMATES: ArcadePixelAnimate[] = ['none', 'type', 'wipe', 'blink', 'marquee']

export function ArcadePixelUsage() {
  const [run, setRun] = useState(0)
  return (
    <>
      <div data-gallery-arcade>
        <ArcadePixel text="KATANA" pixelSize={6} />
      </div>
      <ArcadePixel text="READY 01" pixelSize={4} />
      <ArcadePixel text="GAME OVER" pixelSize={4} palette={['transparent', 'var(--ink-100)']} />

      {Object.entries(ARCADE_SPRITES).map(([name, sprite]) => (
        <ArcadePixel
          key={name}
          sprite={sprite}
          pixelSize={5}
          palette={['transparent', 'var(--signal-orange)', 'var(--ink-100)']}
        />
      ))}

      {ARCADE_ANIMATES.map((animate) => (
        <ArcadePixel
          key={run}
          text={animate === 'marquee' ? 'KATANA READY' : 'READY'}
          animate={animate}
          columns={animate === 'marquee' ? 36 : undefined}
          loop={animate === 'blink' || animate === 'marquee'}
          pixelSize={3}
        />
      ))}
      <Button onClick={() => setRun((n) => n + 1)}>重播</Button>

      <ArcadePixel text="KATANA" pixelSize={4} glow />

      <ArcadePixel text="KATANA" pixelSize={4} scanlines />

      <ArcadePixel text="KATANA" pixelSize={4} crt glow scanlines />
    </>
  )
}
```

## States

- 静态（animate=none）：画好就停，不占动画帧。
- type / wipe / blink：播完停在整屏；loop 时反复。
- marquee：一直滚；屏外或标签页隐藏时暂停。

## Don't

- 没有中日韩字：5x7 字体只有拉丁字母、数字与几个标点，中文要用别的件。
- 不要拿它画行情数字或价格；它是装饰与状态牌，读数用 Lcd。
- 它不是可读的文本控件：文字在 sr-only 里，别指望复制画布上的字。

## Composition

```
ArcadePixel
  canvas（aria-hidden）
  CRT 叠层（扫描线、暗角、色散、闪烁）
  span.sr-only
```
