# DateRangePicker

起点—终点两个可逐段打字的日期框，右边的日历按钮打开双月日历，左边一列预设：今天、本周、本月、年初至今，不在预设里的显示「自定义」。回放、台账、报告的区间用它。有两种提交方式：immediate 点完终点就生效，apply 先挑再应用（脚上有状态字与「清除 / 应用」）。功能参照 Arc，实现原创；先挑再应用的交互借自 Jamie Merrill 的 Date range picker。

## Provide

`*` marks a required prop.

### DateRangePicker

值是 { start, end } 一对 YYYY-MM-DD（含两头），按哪个时区解读由调用方定。底座是 react-aria 的 DateField 与 RangeCalendar；浮层用我们的 Popover。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `{ start: string; end: string } \| null` | — | 当前区间；null 是没选。 |
| `onValueChange` | `(range: DateRange) => void` | — | 凑成合法区间（起点不晚于终点）才回调；只填了一头不回调。commit=apply 时日历与预设的改动只改草稿，点「应用」才回调一次。旧名 onValue 留一个版本（@deprecated）。 |
| `commit` | `'immediate' \| 'apply'` | `'immediate'` | immediate：点完终点、点预设就上报并收起（原来的行为）。apply：改动先放草稿，弹层脚上写状态字、有「清除」「应用」，点「应用」才上报并收起，Esc 或点外面丢草稿。选 apply 就必须传 labels 里多出来的四条文案。 |
| `today` | `string` | — | 今天（YYYY-MM-DD），预设从它算。由调用方按显示时区算好传进来，件里不读时钟。 |
| `weekStart` | `'mon' \| 'sun'` | `'mon'` | 一周从哪天起；「本周」是它到今天。A 股与国际交易所都是周一。 |
| `min / max` | `string` | — | 能选的最早、最晚日期。 |
| `labels` | `DateRangeLabels` | — | 文字：start、end、pickRange、calendar、previousMonth、nextMonth、presets、preset（今天 / 本周 / 本月 / 年初至今）、custom；包里不带语言。commit=apply 再要四条（DateRangeApplyLabels）：pickFirst（还没点）、selected（已选 N 天：只收函数 (days) => string，英文在里面处理单复数，与别的带数字文案一致）、apply、clear。 |
| `locale` | `string` | — | 给 react-aria 的语言：中文界面 zh-CN，英文界面 en-CA。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DateRangePicker, type DateRange, type DateRangeLabels } from '@katana-ui/react'

const RANGE_LABELS: DateRangeLabels = {
  start: '起点',
  end: '终点',
  pickRange: '选择区间',
  calendar: '区间日历',
  previousMonth: '上个月',
  nextMonth: '下个月',
  presets: '常用区间',
  preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
  custom: '自定义',
}

// 演示固定「今天」是 2026-11-14（周六），预设与截图才不随真实日期变；应用里由显示时区算出来传进去。

export function DateRangePickerUsage() {
  const [range, setRange] = useState<DateRange | null>({ start: '2026-11-09', end: '2026-11-14' })
  return (
    <>
      <DateRangePicker value={range} onValueChange={setRange} today="2026-11-14" labels={RANGE_LABELS} locale="zh-CN" />
      <output data-gallery-range>{range ? `${range.start} ~ ${range.end}` : '未选'}</output>

      <DateRangePicker
        value={null}
        onValueChange={() => {}}
        today="2026-11-14"
        min="2026-01-01"
        max="2026-12-31"
        labels={RANGE_LABELS}
        locale="zh-CN"
      />
    </>
  )
}

// 演示用的分类树（不是真实的品种库或数据集）。
```

## States

- 框内：起点、终点各一个分段输入；终点早于起点标红，不上报。
- 预设：口径是截至今天（本周 = 周起始日到今天，本月 = 1 号到今天，年初至今 = 1 月 1 日到今天）；当前区间正好是某个预设时它高亮。
- 预设受 min / max 约束：整段不在范围里的预设禁用（不裁剪，裁了以后「本月」就不是本月，高亮与状态字会对不上）。
- 区间不在预设里：预设列末尾显示「自定义」。
- 日历：双月；点两下选起止，起止之间的日子是淡底，今天的格子数字下有小点；immediate 选完自动收起。
- apply 的脚（状态字三档）：还没点是「选第一天」；点了起点是「已选 1 天」；悬停或点了终点是「已选 N 天」（含首尾，N 就是日历上高亮的格数，按日历日算）。悬停时区间在日历上预览；键盘选完起点焦点挪到下一天，所以键盘上是「已选 2 天」，是预期。读屏的播报另算：只在点选后更新（点起点、点终点、预设、清除），悬停不播报。
- apply 的框：点了起点后起点段落填好、终点仍是占位；框跟着草稿走，不是跟着已生效的值。
- apply 弹层开着时外部改了 value：草稿还没动过就跟着变（框、日历、状态字一起换），用户已经动过就保留用户的草稿；点「应用」上报的是草稿。想要「外部一改就重置草稿」的调用方，给组件换一个 key。
- 点外面收起：点一次就收（日历里点过格子、翻过月也一样；以前 immediate 翻月后要点两次）。点弹层里面、触发钮、弹层里再弹出的子浮层不收。
- apply 的钮：「应用」在区间不完整时禁用，点了上报、收起、焦点回触发钮；「清除」清空草稿、不收起。Esc、点外面收起都丢草稿，下次打开从当前值重新开始。
- apply 里预设也只改草稿（日历翻到它的月份），要点「应用」才生效。挑到一半离开日历（Tab 走、点脚上的钮）放弃这次挑选，不替用户补终点。

## Don't

- 不要在件里取「今天」：时区是应用的事，由 today 传进来。
- 预设是截至今天，不含未来的日子；要未来区间（日历、事件预告）另做，别改这组预设的口径。
- 单日选择用 DateTimeInput，别拿起止同一天凑。
- 不要在包里给 apply 的四条文案写后备语言：没传就是类型错误，不是悄悄显示英文。

## Composition

```
DateRangePicker
  DateField（起点）
  DateField（终点）
  Popover
    预设按钮 × 4 + 自定义
    RangeCalendar（两个 CalendarGrid）
    脚（仅 commit=apply）：状态字 + 清除 + 应用
```

## Keyboard

- `← → / Tab`：在日期框的年、月、日各段间走；数字直接打，↑↓ 加减
- `日历按钮 Enter / 空格`：打开日历，焦点进日历
- `方向键 / PageUp / PageDown`：日历里移动日期、翻月
- `Enter / 空格`：日历里选起点，再选终点；immediate 选完收起，apply 选完等「应用」。键盘选完起点焦点会挪到下一天（react-aria 的行为），状态字随焦点那天变
- `Tab（apply）`：从日历到脚上的「清除」「应用」；挑到一半 Tab 走会放弃这次挑选
- `Esc`：收起日历，焦点回到按钮；apply 丢掉草稿
