# Slider

凹槽轨 + 点阵填充 + 发光圆把手；拖动跟手，松手 settle 弹簧吸附到步进；一个值或一段范围。

## Provide

### Slider

其余属性透传给 Radix Slider.Root。只做横向，受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `readonly number[]` | — | 每个把手一个值；两个值是范围。 |
| `onValueChange` | `(value: number[]) => void` | — | 拖动时每一步都调。 |
| `onValueCommit` | `(value: number[]) => void` | — | 松手或键盘改完一步时调，存东西放这里。 |
| `min / max / step` | `number` | `0 / 100 / 1` | 范围与步进。 |
| `thumbLabels` | `readonly string[]` | — | 每个把手的读屏名字（名字只放在真正的 slider 上）。 |
| `disabled` | `boolean` | — | 灰掉，不能拖。 |

## States

- 单值、区间、禁用。
- 键盘 ← → 走一格。

## Don't

- 滑钮必须有 thumbLabels。

## Composition

```
Slider
```

## Keyboard

- `← →`：走一个步进
- `Home / End`：跳到最小、最大
- `PageUp / PageDown`：走十个步进
