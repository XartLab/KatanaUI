# AnimatedTags

上面是「已选」，下面是「可选」，点一个标签它就飞到另一边（布局动画加模糊淡出淡入）。拿来选关注板块、策略标签、自选分组。与 ChipGroup 的分工：ChipGroup 是原地开关的筛选芯片，选中不换位置；AnimatedTags 把选中的拎出来单独放，适合要看清「我选了哪几个」。

## Provide

`*` marks a required prop.

### AnimatedTags

selected 受控；labels 五项必填（两个区的小标题、空态、移除与添加的读屏名）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tags` * | `readonly string[]` | — | Every tag that can be picked. |
| `selected` | `readonly string[]` | — | Chosen tags (controlled); omit to let the component keep them. |
| `defaultSelected` | `readonly string[]` | `[]` | Chosen tags at first render when uncontrolled. |
| `onChange` | `(selected: string[]) => void` | — | Called with the chosen tags after every add or remove. |
| `labels` * | `AnimatedTagsLabels` | — | All the text the picker needs; the package ships none. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AnimatedTags } from '@katana-ui/react'

export function AnimatedTagsUsage() {
  return (
    <AnimatedTags
      tags={['Semiconductors', 'AI compute', 'Banks']}
      defaultSelected={['Banks']}
      labels={{
        selected: 'Following',
        available: 'Available',
        empty: 'Nothing followed yet',
        remove: (tag) => `Remove ${tag}`,
        add: (tag) => `Follow ${tag}`,
      }}
    />
  )
}
```

## States

- 已选区：标签带 ×，点一下移走；空时显示 empty。
- 可选区：标签带 +，点一下加入。

## Don't

- 不要超过 20 个标签：两个区都会换行成一堆；多的用 MultiSelect 带搜索。
- 不要拿它做互斥选择：互斥用 ToggleGroup 或 RadioGroup。

## Composition

```
AnimatedTags
  div
    div（已选）
      motion.button
    div（可选）
      motion.button
```

## Keyboard

- `Tab`：在标签间走
- `Enter / Space`：加入或移除
