# Avatar

圆形头像：图片没到或失败时显示缩写，右下角可挂在线状态点，AvatarGroup 叠放并把多出的折成 +N；三档尺寸 24 / 32 / 40。

## Provide

`*` marks a required prop.

### Avatar

其余属性透传给 Radix Avatar.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | — | Image URL; leave it out to show only the fallback. |
| `alt` * | `string` | — | Alt text of the image and the accessible name (required). |
| `fallback` * | `ReactNode` | — | Shown while the image loads or when it fails, usually initials. |
| `size` | `AvatarSize` | — | Diameter: sm 24, md 32, lg 40. |
| `status` | `AvatarStatusValue` | — | Presence dot at the bottom right. |
| `statusLabel` | `string` | — | Spoken name of the presence dot (required when status is set). |

### AvatarGroup

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | The avatars. |
| `label` * | `string` | — | What screen readers call the group (required). |
| `max` | `number` | — | Show at most this many, then a +N chip. |
| `size` | `AvatarSize` | `'md'` | Size for every avatar inside. |
| `overflowLabel` | `(count: number) => string` | — | Spoken name of the +N chip, e.g. |
| `className` | `string` | — | Extra classes for the root element. |

### useAvatarSize

返回最近一个头像的尺寸，给放在头像里的自定义部件用。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Avatar, AvatarGroup } from '@katana-ui/react'

export function AvatarUsage() {
  return (
    <AvatarGroup label="Strategy reviewers" max={3} size="md" overflowLabel={(count) => `${count} more`}>
      <Avatar alt="Alice Chen" fallback="AC" status="online" statusLabel="Online" />
      <Avatar alt="Bo Wang" fallback="BW" />
      <Avatar alt="Cai Li" fallback="CL" status="away" statusLabel="Away" />
      <Avatar alt="Dan Zhao" fallback="DZ" />
    </AvatarGroup>
  )
}
```

## States

- 图片加载中或失败：显示 fallback（缩写），7% 白底、ink-200 字（ink-300 在 Console 下只有 4.42:1）。
- 有 status：右下角一个状态点（在线、离开、忙碌、离线），读屏名由 statusLabel 给。
- 在 AvatarGroup 里：叠放、环形描边，超过 max 的折成 +N。

## Don't

- 不要单靠状态点的颜色传达在线与否：statusLabel 要给，旁边有文字更好。
- 不要在头像里放超过两个字符的缩写。
- 要显示一个人的完整信息用 RichPopover 或 HoverCard，不要塞进头像。

## Composition

```
AvatarGroup
  Avatar
    Radix Avatar.Image（有 src）
    Radix Avatar.Fallback
    span（status 点）
  span（+N）
```
