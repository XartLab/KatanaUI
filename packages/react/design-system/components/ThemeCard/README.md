# ThemeCard

卡头是序号、题材名与两枚小胶囊（几只涨停、最高几板），一行催化（省略号截断，悬停看全文与来源），成员表（涨停时间、名称、连板徽标），卡脚「查看 n 只涨停」。ThemeCards 把多张卡横排；按涨停家数 / 时间 / 连板 / 涨幅排，由调用方排。信息结构取自复盘吧的题材异动，样子是 Graphite 的。

## Provide

`*` marks a required prop.

### ThemeCard

渲染一个 section；成员行与卡脚在给了回调时才是按钮。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `theme` * | `ThemeCardData` | — | The theme to show: name, counts, catalyst and members. |
| `index` | `number` | — | Position number shown before the name (written 01, 02…); omit for none. |
| `onOpen` | `(key: string) => void` | — | Called by the footer button with the theme key; without it the footer is plain text. |
| `onSelectMember` | `(member: ThemeMember, theme: ThemeCardData) => void` | — | Called when a member row is picked; without it the rows are plain. |
| `labels` | `ThemeCardLabels` | `cnLabelsZh.themeCard` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### ThemeCards

横排的容器：一行排不下就横向滚动，卡最窄 220px，有空就均分。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `themes` * | `readonly ThemeCardData[]` | — | The themes in display order; the caller sorts (by limit-up count, time, boards or change). |
| `onOpen` | `(key: string) => void` | — | Called by each card's footer button with the theme key. |
| `onSelectMember` | `(member: ThemeMember, theme: ThemeCardData) => void` | — | Called when a member row is picked. |
| `labels` | `ThemeCardLabels` | `cnLabelsZh.themeCard` | Text pack shared by the cards; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### ThemeCardData

题材：key、name、可选 limitUpCount / highestBoard / catalyst / catalystReason，成员 members。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` * | `string` | — | Stable key of the theme. |
| `name` * | `string` | — | Theme name. |
| `limitUpCount` | `number \| null` | — | Number of limit-up stocks; counted from the members when omitted, null writes a dash. |
| `highestBoard` | `number \| null` | — | Highest board; taken from the members when omitted, and nothing is drawn below two boards. |
| `catalyst` | `ThemeCatalyst \| null` | — | The catalyst line with its source; null or empty writes a dash. |
| `catalystReason` | `string` | — | Why the catalyst is unavailable (shown on hover). |
| `members` * | `readonly ThemeMember[]` | — | Member stocks in display order. |

### themeCardFigures(theme)

纯函数：涨停家数（不给就数成员）与最高板（两板以下是 null，不画胶囊）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ThemeCards } from '@katana-ui/react/cn'

export function ThemeCardUsage() {
  return (
    <ThemeCards
      themes={[
        {
          key: 'robot',
          name: 'Robotics',
          catalyst: { text: 'New humanoid model announced', source: 'Exchange notice' },
          members: [
            { code: '000001', name: 'Alpha', time: '10:14', streak: 1 },
            { code: '000002', name: 'Beta', time: '10:34', streak: 2 },
          ],
        },
      ]}
      onOpen={(key) => console.log(key)}
    />
  )
}
```

## States

- 催化有内容：一行省略号，悬停写全文与来源；没有：写「—」，悬停写原因。
- 涨停家数取不到（null）：胶囊与卡脚写「—」，不写 0。
- 最高板不到两板：不画「n板」胶囊。
- 没有成员：写「暂无涨停成员」。
- 给了 onOpen：卡脚是按钮；给了 onSelectMember：成员行是按钮，可 Tab、Enter。

## Don't

- 不要在包里排序：多张卡的次序由调用方给。
- 不要传色值或固定卡宽：卡宽跟容器走。

## Composition

```
ThemeCards
  ThemeCard
    卡头（序号 · 题材名 · 涨停数 · 最高板）
    催化
    成员行（时间 · 名称 · StreakBadge）
    卡脚
```

## Keyboard

- `Tab`：到成员行与卡脚按钮（给了回调时）
- `Enter / Space`：触发
