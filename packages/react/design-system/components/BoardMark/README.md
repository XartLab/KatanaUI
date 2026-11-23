# BoardMark

主板 / 创业板（20cm）/ 科创板（20cm）/ 北交所（30cm）/ ST。默认只标有特殊涨跌幅限制的写「20cm」「30cm」「ST」，主板不画；display 选写板块名或都写。boardKindOf 从代码（与名称）判断板块。取不到写「—」。也是 DataGrid 的列类型 board：值给板块名、六位代码或 { code, name }，format.boardDisplay 选写法，按涨跌幅限制排序。

## Provide

`*` marks a required prop.

### BoardMark

渲染一个 span，不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `kind` * | `BoardKind \| null \| undefined` | — | The board; null or missing means unavailable. |
| `display` | `'cm' \| 'name' \| 'both'` | `'cm'` | Writes the price-limit width (and nothing for the main board), the board name, or both. |
| `labels` | `BoardMarkLabels` | `cnLabelsZh.board` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### boardKindOf(code, name?)

ST 优先；300/301/302 创业板，688/689 科创板，4/8 开头与 920 北交所，其余主板；不是六位数字返回 null。

### BOARD_LIMIT_PERCENT

各板块涨跌幅限制（%）：主板 10、ST 5、创业板与科创板 20、北交所 30。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BoardMark, boardKindOf } from '@katana-ui/react/cn'

export function BoardMarkUsage() {
  return <BoardMark kind={boardKindOf('300750')} />
}
```

## States

- cm（默认）：创业板、科创板写「20cm」，北交所「30cm」，ST 写「ST」；主板什么都不画。
- name：写板块名；both：「创业板 20cm」。
- 取不到：写「—」。
- board 列：默认 cm，主板格子空着；复制、导出的字跟格子上一致。

## Don't

- 不要把主板也标上：卡片上的标记是为了提醒涨跌幅限制不同。

## Composition

```
BoardMark
```
