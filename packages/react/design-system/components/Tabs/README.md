# Tabs

页签的选中块是一块跟着滑的底（弹簧）；default 是药丸底，line 是下划线。

## Provide

`*` marks a required prop.

### Tabs

其余属性透传给 Radix Tabs.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bare` | `boolean` | — | Skip the skin. |

### TabsList

其余属性透传给 Radix Tabs.List。tabsListVariants 是它的类名函数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"line" \| "default" \| "bare"` | `'default'` | Skin: line, default, or bare (no skin, the caller's class names style it). |

### TabsTrigger

其余属性透传给 Radix Tabs.Trigger。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bare` | `boolean` | — | Skip the skin. |

### TabsContent

其余属性透传给 Radix Tabs.Content。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@katana-ui/react'

export function TabsUsage() {
  return (
    <Tabs defaultValue="gainers">
      <TabsList>
        <TabsTrigger value="gainers">Gainers</TabsTrigger>
        <TabsTrigger value="volume">Volume</TabsTrigger>
      </TabsList>
      <TabsContent value="gainers">Top gainers</TabsContent>
      <TabsContent value="volume">Top by volume</TabsContent>
    </Tabs>
  )
}
```

## States

- 选中、未选、禁用页签。
- 默认与 line 两种样式。

## Don't

- 页签名保持短，一行放得下。
- 只切换一个值、不换内容时用 ToggleGroup。
- 页签多到放不下时不要折两行，收进下拉或改导航。

## Composition

```
Tabs
  TabsList
    TabsTrigger
  TabsContent
```

## Keyboard

- `← →`：在页签间走并选中
- `Home / End`：跳到首、末页签
- `Tab`：从页签列表跳进当前内容
