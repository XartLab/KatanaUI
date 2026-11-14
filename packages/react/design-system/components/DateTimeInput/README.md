# DateTimeInput

可以逐段打字的「年-月-日」与「时:分」，日期框右边的日历按钮打开日历；不随浏览器语言变格式。

## Provide

### DateTimeInput

值一律是字符串（日期 YYYY-MM-DD，时刻 HH:mm 或 HH:mm:ss，空串是没填完）；按哪个时区解读由调用方定。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 字段名，拼进读屏名。 |
| `date / onDate` | `string / (value: string) => void` | — | 日期。 |
| `time / onTime` | `string / (value: string) => void` | — | 时刻；不给 onTime 就只有日期。 |
| `seconds` | `boolean` | `false` | 时刻带秒。 |
| `min / max` | `string` | — | 能选的最早、最晚日期；范围外的日子灰着点不了，打进去的标成不合法。 |
| `size` | `'sm'` | — | 26 高。 |
| `labels` | `DateTimeLabels` | — | 读屏名与按钮名（包里不带文字，调用方按界面语言给）。 |
| `locale` | `string` | — | 给 react-aria 的语言：zh-CN 或 en-CA，都是年-月-日的顺序。 |
| `autoFocus / className` | `boolean / string` | — | 照原生。 |

## States

- 默认、聚焦、错误（日期或时间不合法）。
- 日期框右边的日历按钮打开日历。

## Don't

- 不要依赖浏览器语言的日期格式：这个件不随它变。

## Composition

```
DateTimeInput
  DateField（年 月 日各一段）
  Popover
    Calendar
  TimeField（时 分 [秒]）
```

## Keyboard

- `0–9`：在当前段打字，满了跳到下一段
- `← →`：在段之间走
- `↑ ↓`：当前段加减
- `Backspace`：清空当前段
- `Enter（日历按钮上）`：打开日历；日历里方向键选日
