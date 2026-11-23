# Card

通用卡片容器：圆角 --radius-control、1px container-subtle 边、内距 12；头部（标题、说明、右上角动作）、内容、底部几个部件。四档底：secondary（默认）、primary、tertiary、ghost（无底无边）。interactive 配 asChild 让整张卡就是一个链接或按钮。部件划分取自 shadcn/ui（MIT），变体照 Salt Card（Apache-2.0）。

## Provide

`*` marks a required prop.

### Card

其余属性透传给 div（asChild 时给子元素）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "ghost" \| "secondary" \| "tertiary"` | — | Fill of the card: secondary (default), primary, tertiary, or ghost (no fill, no edge). |
| `interactive` | `false \| true` | — | Hover and press feedback for a card that is itself a link or a button (use with asChild). |
| `asChild` | `boolean` | `false` | Render the single child (an a or a button, so the whole card is one target) with the card skin. |

### CardHeader / CardTitle / CardDescription / CardAction / CardContent / CardFooter

都是 div。CardHeader 里有 CardAction 时自动排成两栏，动作在右上角。

### cardVariants

返回类名的函数，给不是 Card 的元素画成卡。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@katana-ui/react'

export function CardUsage() {
  return (
    <Card style={{ width: 280 }}>
      <CardHeader>
        <CardTitle>Account A</CardTitle>
        <CardDescription>Cash account</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Switch
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Available 182,400.00</CardContent>
      <CardFooter>
        <Button size="sm">Deposit</Button>
      </CardFooter>
    </Card>
  )
}
```

## States

- variant：secondary（默认）、primary（最亮）、tertiary、ghost（透明、无边，只用来排版）。
- interactive：悬停换 actionable 的 hover 底、边提到 container-bold，按下缩到 0.99，键盘焦点画焦点环。
- 标题 600 粗 primary 色，说明 caption、secondary 色。

## Don't

- 指标与读数用 MetricCard，工作台面板用 PanelFrame；这一件只是通用的框。
- 可点的卡用 asChild 包一个 a 或 button：不要在 div 上挂 onClick。
- 可点的卡里不要再放按钮或链接：整张卡已经是一个目标。

## Composition

```
Card
  CardHeader
    CardTitle
    CardDescription
    CardAction（可选）
  CardContent
  CardFooter
```
