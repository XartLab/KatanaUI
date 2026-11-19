// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DateRangePicker, type DateRange, type DateRangeLabels } from '../../src/index'

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
