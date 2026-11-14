# UptimeBars

一格一天或一小时的可用条，用于数据源与连接健康：颜色加高度一起表达状态（绿满格可用、琥珀半高降级、红满格中断、虚线底无数据）；悬停或聚焦一格，条下的读数行写那一格的整句（如断流次数）。功能参照 Arc Uptime status，实现原创。

## Provide

### UptimeBars

文字全由 props 传：每一格的整句在 cell.label 里，包里没有文案。组是一个 role=group，每格一个带名字的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cells` | `UptimeCell[]` | — | 从旧到新；{ id, status: up | degraded | down | none, label }。 |
| `label` | `string` | — | 这一条的读屏名（整句）。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么，常是可用率。 |
| `onSelect` | `(cell) => void` | — | 给了格子才可点（Enter / Space 也触发）。 |
| `className` | `string` | — | 加在最外层。 |

### uptimeShare(cells)

可用格（up）占有数据的格的比例；degraded 与 down 都不算可用，不另给权重；none 不进分母；全是 none 返回 null。

## States

- up 满格绿、degraded 六成高琥珀、down 满格红、none 一条细虚底；状态靠颜色与高度两路表达。
- 悬停或聚焦一格：加描边，读数行换成那一格的整句；离开后回到 idle。
- 只有一格在 Tab 序里（默认最新一格），左右键在格间走。

## Don't

- 不要用它画连续的数值（延迟、用量）：它只有四种离散状态。
- 不要省掉每格的 label：悬停读数与读屏都靠它。

## Composition

```
UptimeBars
  div role=group
    span role=img（一格，带 data-status）
  output（读数行）
```

## Keyboard

- `← / →`：焦点在格间移动，到头不绕回
- `Home / End`：跳到最早 / 最新一格
- `Enter / Space`：给了 onSelect 时选中当前格
