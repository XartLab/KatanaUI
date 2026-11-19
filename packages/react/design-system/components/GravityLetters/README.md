# GravityLetters

文字的每个字被放开后受重力掉到容器底、弹几下、静下来；再触发就被弹簧拉回原位。物理（掉落与回位）是纯函数。用于空状态、熔断提示这类带一点玩笑的场合。

## Provide

`*` marks a required prop.

### GravityLetters

trigger 为 click 时根是 role=button，aria-pressed 表示是否已掉下；整句放在 sr-only。可以用 collapsed 受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bounce` | `number` | `DEFAULT_BOUNCE` | Fraction of vertical speed kept after hitting the floor or a wall, from 0 to 1. |
| `className` | `string` | — | Extra class names for the root element. |
| `collapsed` | `boolean` | — | Controls whether the letters have fallen; leave out to let `trigger` decide. |
| `friction` | `number` | `DEFAULT_FRICTION` | Fraction of horizontal speed lost on each floor hit, from 0 to 1. |
| `gravity` | `number` | `DEFAULT_GRAVITY` | Downward acceleration in pixels per second squared. |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | Called when the letters fall or return. |
| `spread` | `number` | `DEFAULT_SPREAD` | Largest sideways speed a letter is thrown with, in pixels per second. |
| `stagger` | `number` | `DEFAULT_STAGGER` | Milliseconds between one letter being released and the next. |
| `text` * | `string` | — | The text to drop. |
| `trigger` | `GravityLettersTrigger` | `'hover'` | hover or click drops and restores the letters, inView drops them once on entering the view, manual leaves it to `collapsed`. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GravityLetters } from '@katana-ui/react'

export function GravityLettersUsage() {
  return <GravityLetters text="Circuit breaker" trigger="click" />
}
```

## States

- 静止：字排在原位。
- 掉落：按 stagger 一个个放开，落地后反弹、摩擦，静止。
- 回位：弹簧把每个字拉回原位。

## Don't

- 不要用在需要读的警告上：字掉下去后就读不了了，警告用 Alert。

## Composition

```
GravityLetters
  div（容器）
    span.sr-only
    div（隐藏的测量层）
    div（可见层，每个字绝对定位）
```

## Keyboard

- `Enter / Space`：trigger 为 click 时掉下或收回
- `Tab`：hover 与 click 时可聚焦；hover 时聚焦即掉下，失焦收回
