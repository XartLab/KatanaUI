# AiBranch

同一个问题重答出的几个版本，用上一个 / 下一个翻，到头绕回；换分支时新的从下面淡入上来；只有一个版本时翻页条不画。复合件。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiBranch

容器，其余属性透传给 div。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `defaultBranch` | `number` | `0` | Index of the branch shown first. |
| `onBranchChange` | `(index: number) => void` | — | Called with the new index whenever the reader changes branch. |

### AiBranchMessages

每个子元素是一个分支；只渲染当前那个。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | One child per branch. |

### AiBranchSelector

from 指翻页条靠哪一侧；只有一个分支时不画。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `from` * | `'user' \| 'assistant'` | — | Which side the bar sits on, matching the message it belongs to. |

### AiBranchPrevious

label 必传，读屏名。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the button (required). |
| `children` | `ReactNode` | — | Replaces the default chevron. |
| `className` | `string` | — | Extra class name. |

### AiBranchNext

label 必传，读屏名。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the button (required). |
| `children` | `ReactNode` | — | Replaces the default chevron. |
| `className` | `string` | — | Extra class name. |

### AiBranchPage

format(位置, 总数) 写页码文字，如「第 1 个，共 3 个」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `format` * | `(position: number, total: number) => string` | — | Writes the page text from the 1-based position and the total, such as `(n, total) => \`${n} / ${total}\``. |
| `className` | `string` | — | Extra class name. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  AiBranch,
  AiBranchMessages,
  AiBranchNext,
  AiBranchPage,
  AiBranchPrevious,
  AiBranchSelector,
} from '@katana-ui/react'

export function AiBranchUsage() {
  return (
    <AiBranch>
      <AiBranchMessages>
        <p>第一个回答</p>
        <p>第二个回答</p>
      </AiBranchMessages>
      <AiBranchSelector from="assistant">
        <AiBranchPrevious label="上一个回答" />
        <AiBranchPage format={(at, total) => `${at} / ${total}`} />
        <AiBranchNext label="下一个回答" />
      </AiBranchSelector>
    </AiBranch>
  )
}
```

## States

- 多个分支：翻页条出现，到头绕回。
- 只有一个分支：翻页条不画。

## Don't

- 不要在 AiBranch 之外用它的子件。
- 分支内容变长时别用固定高度。

## Composition

```
AiBranch
  AiBranchMessages（每个子元素一个分支）
  AiBranchSelector
    AiBranchPrevious
    AiBranchPage
    AiBranchNext
```

## Keyboard

- `Tab`：上一个、下一个
- `Enter / Space`：翻页
