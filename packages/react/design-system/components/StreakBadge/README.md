# StreakBadge

首板 / 2板 / 「5天3板」，或晋级口径「一进二」；高度越高越醒目（只靠语义色调升四档，不传色值），涨色跟 data-updown。也是 DataGrid 的列类型 streak，可按板数排序。文字由 labels 给（默认简体中文，可整份换），取不到写「—」并可带原因（悬停）。

## Provide

`*` marks a required prop.

### StreakBadge

渲染一个 span，不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `streak` * | `number \| StreakValue \| null \| undefined` | — | Boards in a row (1 is the first board); a number, or an object with days, yesterday's boards and a reason. |
| `form` | `'boards' \| 'promotion'` | `'boards'` | Writes first board, N boards or N days M boards; `promotion` writes the promotion form (one-to-two) when the previous boards are known. |
| `labels` | `StreakLabels` | `cnLabelsZh.streak` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### StreakValue

连板：{ boards, days?, promotedFrom?, reason? }；也可以直接传数字当板数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `boards` * | `number \| null` | — | Boards in a row; null means unavailable. |
| `days` | `number` | — | Days since the run started (writes N days M boards when larger than boards). |
| `promotedFrom` | `number` | — | Boards yesterday, for the promotion form. |
| `reason` | `string` | — | Why the number is unavailable (shown on hover). |

### streakText(streak, labels, form)

屏幕上的字：首板、2板、5天3板、一进二；取不到「—」。

### streakLevel(boards)

醒目程度 0–4（0 取不到，4 是四板及以上）。

### streakSortKey(streak)

排序值：板数为主、天数为次；取不到 undefined。

### normalizeStreak(streak)

数字或对象规整成 StreakValue；小于 1 或非有限数当取不到。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { StreakBadge } from '@katana-ui/react/cn'

export function StreakBadgeUsage() {
  return (
    <>
      <StreakBadge streak={1} />
      <StreakBadge streak={{ boards: 3, days: 5 }} />
      <StreakBadge streak={{ boards: 2, promotedFrom: 1 }} form="promotion" />
    </>
  )
}
```

## States

- 首板：弱灰底；2 板：涨色淡底；3 板：加描边；4 板及以上：更深的底加涨色描边、字加粗。
- 晋级口径：form="promotion" 且给了 promotedFrom 才写「一进二」，否则退回板数写法。
- 几天几板：days 大于 boards 才写「5天3板」。
- 取不到：写「—」，悬停写 reason（没给就写默认文案里的说明）。

## Don't

- 不要传色值：醒目程度由件按板数定。
- 不要在调用处拼「x板」：走 labels，换语言时整份换。

## Composition

```
StreakBadge
```
