# ChipGroup

分面筛选用的一排可开关小标签：多选或单选，可带命中数与清除钮。筛选器、自选分组的快速过滤用它。功能参照 Arc，实现原创。

## Provide

### ChipGroup

每个芯片是 aria-pressed 的开关，整组 role=group；底座是 Radix ToggleGroup。受控：value 与 onValueChange。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ value: string; label: string; count?: number; disabled?: boolean }[]` | — | 芯片：count 是命中数，写在字右边（等宽数字），由调用方算好。 |
| `value` | `string[]` | — | 选中的 value。 |
| `onValueChange` | `(value: string[]) => void` | — | 选中项变了。 |
| `label` | `string` | — | 整组的读屏名。 |
| `selection` | `'multiple' \| 'single'` | `'multiple'` | single 最多选一个，点已选的就取消（取消 = 不筛）。 |
| `clearLabel` | `string` | — | 给了，有选中项时末尾出现清除钮，读屏名与提示用它。 |

## States

- 未选：4% 白底。
- 选中：实心浅底深字（同分段切换）。
- 禁用：降到 35% 不透明度。
- 有选中项且给了 clearLabel：末尾出现 ×。

## Don't

- 不要拿它当导航：它筛数据，不换页面。
- 选项很多（几十个）时用 MultiSelect 或 Combobox，别摆成一面芯片墙。
- 命中数由调用方算：件不碰数据。

## Composition

```
ChipGroup
  ToggleGroup（Radix，type=multiple）
    Item × n（字 + 命中数）
  button.k-chip-clear
```

## Keyboard

- `← →`：在芯片间移动焦点
- `Space / Enter`：切换焦点所在的芯片
- `Tab`：进出整组（组内只停一个）
