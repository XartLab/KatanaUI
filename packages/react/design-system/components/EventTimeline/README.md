# EventTimeline

发现区的统一事件流（公告、告警、成交、数据源事件）：按显示时区的自然日分组，新的在前，每条一个钟点、一个按类型上色的圆点、标题加来源标签与说明。对设计稿的 EventTimeline 卡。功能参照 Arc，实现原创。

## Provide

### EventTimeline

件只管分组与排版：事件从哪来、怎么翻页由应用定。region 角色；每天一段 section，日标题是 h3，事件是有序列表里的 li，钟点是 time。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `{ id: string; at: number; title: string; detail?: string; source?: string; tone?: TimelineTone }[]` | — | 事件。at 是毫秒时间戳；tone 是圆点颜色：neutral（默认）、up、down、warn、info。传进来的顺序不用排，件自己排；同一刻保持传入的先后。 |
| `timeZone` | `string` | — | 显示时区（IANA 名）：决定事件落在哪一天、钟点写几点。必填：件不读系统时区。 |
| `label` | `string` | — | 整条时间线的读屏名。 |
| `dayLabel` | `(day: string, count: number) => ReactNode` | — | 一天的标题：day 是 YYYY-MM-DD，count 是这天的事件数；今天 / 昨天怎么写由调用方定。 |
| `emptyText` | `ReactNode` | — | 没有事件时写的字。 |
| `onSelect` | `(event: TimelineEvent) => void` | — | 给了，每条事件变成按钮；不给就是纯展示。 |

## States

- 有事件：每天一段，日标题粘在滚动容器顶上；竖线穿过当天的圆点。
- 圆点颜色：up / down 跟红涨绿跌设置走，warn 琥珀，info 蓝，neutral 灰。
- 可点（给了 onSelect）：悬停有底色，键盘焦点有环。
- 空：只写 emptyText。

## Don't

- 不要在件里取今天、昨天：日标题的字由 dayLabel 给，「今天」是应用知道的。
- 不要一次传几万条：它不做虚拟滚动，翻页或分段加载由应用管。
- 不要拿它画行情或逐笔成交：那些用 DataGrid。

## Composition

```
EventTimeline
  section × 天
    h3 日标题
    ol
      li × 事件：time、圆点、正文（标题 + 来源标签、说明；可点时是 button）
```

## Keyboard

- `Tab（可点时）`：在事件间走；Enter / 空格选中
