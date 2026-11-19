# Tag

小标签的底座：语气（Severity：neutral、ok、warn、danger）× 尺寸（sm、md）× 填充或描边。BadgeGroup 的上标徽标、EstimateBadge 的估算标记都是它；颜色只读 --k-status-*。

## Provide

`*` marks a required prop.

### Tag

其余属性透传给 span。填充：字取 foreground、底取 background；outlined：底透明、1px 边取字色。sm 是 micro 字号、行高 1，md 是 caption 500。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `Severity` | `'neutral'` | Tone of the text, and of the fill or the edge: neutral (default), ok, warn or danger. |
| `size` | `TagSize` | `'md'` | sm is micro text with line height 1 (marks after a symbol name); md is caption text (inline marks). |
| `outlined` | `boolean` | `false` | Draw a 1px edge in the text color on a transparent fill instead of a tinted fill. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Tag } from '@katana-ui/react'

export function TagUsage() {
  return (
    <>
      <Tag>Delayed</Tag>
      <Tag tone="ok">Filled</Tag>
      <Tag tone="warn" outlined>
        Estimated
      </Tag>
      <Tag tone="danger" size="sm">
        ST
      </Tag>
    </>
  )
}
```

## States

- neutral（默认）、ok、warn、danger 四种语气。
- 填充（默认）或描边（outlined）。
- sm：品种名后的上标；md：行内标记。

## Don't

- 不要只靠颜色说语气：字本身要说清（「估算」「停牌」）。
- 不要拿它做按钮或可删的筛选项：它不可交互，可点的用 Button、可删的用 ChipGroup。
- 不要写死颜色：只有四种语气，要别的颜色说明语气不对。

## Composition

```
Tag（span）
```
