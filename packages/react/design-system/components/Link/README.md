# Link

行内文字链接：下划线一直在（颜色 separable-primary、偏移 3px），悬停字提亮、下划线换成字色；external 时新窗口打开、末尾一个 12px 外链图标并让读屏另读 externalLabel。数值与 Button 的 link 变体一样。照 Salt Link（Apache-2.0，只取结构）。

## Provide

`*` marks a required prop.

### Link

其余属性透传给 a；external 时 target 默认 _blank、rel 默认 noopener noreferrer。asChild 把样子交给唯一的子元素（路由库的 Link），不加外链图标。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `'primary' \| 'secondary'` | `'primary'` | primary (default): the primary text color; secondary: the secondary text color (footnotes, captions). |
| `external` | `boolean` | `false` | Opens in a new tab (target=_blank, rel=noopener noreferrer) and ends with an external-link icon. |
| `externalLabel` | `string` | — | Read after the text when external, for example "(opens in a new tab)"; the package ships no text. |
| `asChild` | `boolean` | `false` | Render the single child (a router's Link) with this skin instead of an a. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Link } from '@katana-ui/react'

export function LinkUsage() {
  return (
    <p style={{ margin: 0 }}>
      Reserve ratio cut by 0.5 points (
      <Link href="#/link" external externalLabel="(opens in a new tab)">
        source
      </Link>
      ), see <Link href="#/link">sector flows</Link>.
    </p>
  )
}
```

## States

- primary（默认）：primary 字色；secondary：secondary 字色（脚注、说明）。
- 悬停：字 primary、下划线换成字色。
- external：末尾外链图标，读屏多读一句 externalLabel。
- 焦点：2px 焦点环贴着字。

## Don't

- 不要拿它做动作（提交、删除）：动作用 Button，链接只做跳转。
- 不要去掉下划线：正文里只靠颜色认不出链接（WCAG 1.4.1）。
- 外链要给 externalLabel，告诉读屏会开新窗口。

## Composition

```
Link（a | 子元素）
  文字
  外链图标（external 时）
```

## Keyboard

- `Tab`：聚焦
- `Enter`：跳转
