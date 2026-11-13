# GaugeBar

上面一行名字、数和档位词，中间一条进度条标出数的位置，下面一句说明数是怎么来的。取不到时不画填充，数那里写原因。从应用的分析视图提来。

## Provide

### GaugeBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | 名字。 |
| `value` | `ReactNode` | — | 已格式化好的数。 |
| `unavailable` | `boolean` | — | 数取不到：换成弱色小字。 |
| `share` | `number \| null` | — | 数在最小到最大之间的位置（0 到 1，越界按边画）；null 不画填充。填充宽度按 snappy 弹簧变。 |
| `level` | `ReactNode` | — | 档位词，常是一枚徽标。 |
| `note` | `ReactNode` | — | 下面一句说明。 |
| `classes` | `GaugeBarClasses` | — | 每个部位（root、head、label、value、track、fill、note）额外加的类名，写在包里类名之后。 |

## States

- 有位置：填充占轨道的 share，宽度按 snappy 弹簧变。
- 取不到（share 为 null）：不画填充，数换成弱色小字并写原因。
- 越界的 share 按边画。

## Don't

- 不要用它表达多段或多值：它只标一个数在区间里的位置。
- 不要省掉说明一句：数怎么来的要写在 note 里。

## Composition

```
GaugeBar
  figcaption（label · value · level）
  div（轨道）
    span（填充）
  p（note）
```
