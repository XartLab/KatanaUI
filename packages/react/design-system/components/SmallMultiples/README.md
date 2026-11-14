# SmallMultiples

自选、组合里多个品种并排各一张小折线，同一个十字线：指针在任一张上移动，所有张的竖线与读数一起走；每张标题写名字与那一格的值。功能参照 Arc 的 Small multiples。

## Provide

### SmallMultiples

一行放几张由容器宽与 minWidth 定。各张点数应当相同，短的张在超出的格上不画竖线。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ key, label, values }[]` | — | 每张一个品种：名字与从旧到新的值。 |
| `label` | `string` | — | 整个阵列的读屏名（必填）。 |
| `formatValue` | `(value: number) => string` | — | 标题右边的值写成什么字：没选中写最新值，选中后写那一格。 |
| `formatX` | `(index: number) => string` | — | 读数行写第几个点是什么时间；不给没有读数行。 |
| `yScale` | `'each' \| 'shared'` | `'each'` | each：每张用自己的上下范围（看形状）；shared：所有张同一把（可比）。 |
| `minWidth` | `number` | `160` | 每张的最小宽（px）。 |
| `height` | `number` | `56` | 折线区高（px）。 |
| `onSelect` | `(key: string) => void` | — | 给了标题就是按钮（可聚焦），点了拿到这一张的 key。 |

## States

- 默认：每张画一条线，线色按头尾比（涨跌色跟涨跌配色走，持平中性色），标题写最新值。
- 扫读：所有张同一格画竖线与点，标题的值换成那一格。
- 某张没数据：线不画，值写「—」。

## Don't

- 不要在 each 时比较不同张的高低：每张的上下范围不一样，要比用 shared。
- 不要放几十张：每张都是一个 svg，量大用 HorizonChart 或表格里的迷你图。
- 不要在包里写品种名或单位：名字与值的写法都由调用方传。

## Composition

```
SmallMultiples
  div[role=group]（网格）
    每张：标题（名字 · 值；可点时是 button）· 折线区（svg 折线 · 竖线与点）
  读数行（aria-live）
```

## Keyboard

- `← →`：选中前后一格；没选中时先落到最新一格
- `Shift + ← →`：一次三格
- `Home / End`：第一格 / 最后一格
- `Esc`：清掉选中
- `Tab / Enter`：可点时到标题、触发 onSelect
