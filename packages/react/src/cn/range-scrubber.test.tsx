// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RangeScrubber } from './range-scrubber.tsx'
import {
  SCRUB_TICKS,
  presetRange,
  scrubBars,
  scrubClock,
  scrubIndex,
  scrubNow,
  scrubRange,
  scrubRangeOf,
  shiftRange,
} from './range-scrubber-model.ts'

// KatanaUI #11 第 6 项：区间时间轴。示例数据，金额是编的。

describe('区间时间轴的纯函数', () => {
  it('scrubIndex：09:30 是 0、11:30 与 13:00 都是 120、15:00 是 240，午休里的时刻贴到 11:30、09:25–09:30 贴到 09:30，竞价与盘后返回 null', () => {
    expect(scrubIndex('09:30')).toBe(0)
    expect(scrubIndex('10:15')).toBe(45)
    expect(scrubIndex('11:30')).toBe(120)
    expect(scrubIndex('12:10')).toBe(120)
    expect(scrubIndex('13:00')).toBe(120)
    expect(scrubIndex('14:00')).toBe(180)
    expect(scrubIndex('15:00')).toBe(240)
    expect(scrubIndex('09:27')).toBe(0)
    expect(scrubIndex('09:20')).toBeNull()
    expect(scrubIndex('15:01')).toBeNull()
    expect(scrubIndex('nope')).toBeNull()
  })

  it('scrubClock：午休那一点起点写 13:00、终点写 11:30；越界夹住', () => {
    expect(scrubClock(0)).toBe('09:30')
    expect(scrubClock(45)).toBe('10:15')
    expect(scrubClock(120, 'low')).toBe('13:00')
    expect(scrubClock(120, 'high')).toBe('11:30')
    expect(scrubClock(150)).toBe('13:30')
    expect(scrubClock(240)).toBe('15:00')
    expect(scrubClock(999)).toBe('15:00')
    expect(scrubClock(-5)).toBe('09:30')
  })

  it('scrubRange：两端排好、夹在 0 到 now 之间（还没到的时刻选不了）', () => {
    expect(scrubRange([90, 30], 240)).toEqual([30, 90])
    expect(scrubRange([30, 200], 72)).toEqual([30, 72])
    expect(scrubRange([100, 200], 72)).toEqual([72, 72])
    expect(scrubRangeOf(['10:00', 'bad'], 72)).toEqual([30, 72])
  })

  it('scrubNow：不给是全天，给了按它，写不对按全天', () => {
    expect(scrubNow(undefined)).toBe(240)
    expect(scrubNow('10:42')).toBe(72)
    expect(scrubNow('bad')).toBe(240)
  })

  it('shiftRange：整段平移宽度不变，撞到 0 或 now 就停', () => {
    expect(shiftRange([30, 60], 15, 240)).toEqual([45, 75])
    expect(shiftRange([30, 60], -100, 240)).toEqual([0, 30])
    expect(shiftRange([30, 60], 100, 72)).toEqual([42, 72])
  })

  it('presetRange：从 now 往回数 N 个交易分钟（跨午休不算午休），不早于 09:30', () => {
    expect(presetRange(15, 72)).toEqual([57, 72])
    expect(presetRange(30, 130)).toEqual([100, 130])
    expect(scrubClock(100, 'low')).toBe('11:10')
    expect(presetRange(60, 20)).toEqual([0, 20])
  })

  it('scrubBars：每根画到下一个点，按最高那根归一；丢掉写不对与盘外的点，取不到的不画', () => {
    const bars = scrubBars([
      { time: '09:35', value: 2e8 },
      { time: '09:30', value: 4e8 },
      { time: '09:40', value: null },
      { time: '09:20', value: 9e9 },
      { time: '09:45', value: -1e8 },
    ])
    expect(bars.map((bar) => bar.index)).toEqual([0, 5, 15])
    expect(bars[0]).toEqual({ x0: 0, x1: 5 / 240, share: 1, index: 0 })
    expect(bars[1]!.share).toBe(0.5)
    expect(bars[2]!.x1 - bars[2]!.x0).toBeCloseTo(1 / 240)
  })

  it('刻度每半小时一根，整点与 11:30/13:00 是大刻度', () => {
    expect(SCRUB_TICKS).toHaveLength(9)
    expect(SCRUB_TICKS.filter((tick) => tick.major).map((tick) => Math.round(tick.at * 240))).toEqual([
      0, 60, 120, 180, 240,
    ])
  })
})

describe('RangeScrubber 渲染', () => {
  const html = renderToStaticMarkup(
    <RangeScrubber
      now="10:42"
      defaultValue={['10:00', '11:00']}
      presets={[15, 30, 60]}
      metrics={['change', 'net', 'strength']}
      bars={[
        { time: '09:30', value: 3e8 },
        { time: '10:10', value: 1e8 },
      ]}
    />,
  )

  it('选区夹在「现在」之前：终点把手停在 10:42，读数写交易分钟', () => {
    expect(html).toContain('aria-valuetext="10:00"')
    expect(html).toContain('aria-valuetext="10:42"')
    expect(html).not.toContain('aria-valuetext="11:00"')
    expect(html).toContain('10:00–10:42 · 42 分钟')
  })

  it('「现在」之后盖一层斜纹，从 72/240 处开始；全天时没有', () => {
    expect(html).toMatch(/data-slot="range-scrubber-future"[^>]*left:30%/)
    expect(renderToStaticMarkup(<RangeScrubber />)).not.toContain('range-scrubber-future')
  })

  it('两个把手是 role=slider，带读屏名；快捷钮与口径切换各一组', () => {
    expect(html.match(/role="slider"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="区间起点"')
    expect(html).toContain('aria-label="区间终点"')
    expect(html).toContain('aria-label="快捷区间"')
    expect(html).toContain('近 15 分')
    expect(html).toContain('近 1 小时')
    expect(html).toContain('aria-label="统计口径"')
    for (const name of ['涨幅', '净额', '强度']) expect(html).toContain(name)
  })

  it('选区里的柱子亮、外面的暗；刻度写 11:30/13:00', () => {
    expect(html.match(/data-in="true"/g)).toHaveLength(1)
    expect(html.match(/data-in="false"/g)).toHaveLength(1)
    expect(html).toContain('11:30/13:00')
  })

  it('没有 presets 与 metrics 时不画那两组', () => {
    const bare = renderToStaticMarkup(<RangeScrubber />)
    expect(bare).not.toContain('快捷区间')
    expect(bare).not.toContain('统计口径')
    expect(bare).toContain('09:30–15:00 · 240 分钟')
  })
})
