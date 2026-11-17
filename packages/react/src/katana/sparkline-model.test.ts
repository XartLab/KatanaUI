// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  SPARK_SESSION_GAP,
  areaPath,
  autoTickMinutes,
  barRects,
  baselineClips,
  labelPlacement,
  linePath,
  monotoneTangents,
  nearestIndex,
  pointRuns,
  priceTicks,
  readoutPlacement,
  resolveSparkTone,
  snapLine,
  snapSpan,
  sparkExtremes,
  sparkLayout,
  sparkLayoutPoints,
  sparkLineWidth,
  splitRuns,
  stepIndex,
  thinLabels,
  timeGroups,
  timeSpans,
  timeTicks,
  timeX,
  timeXs,
  tipPlacement,
  volumeRects,
  winLossCells,
  xAt,
  yAt,
} from './sparkline-model.ts'

describe('断点分段', () => {
  it('null、NaN、undefined 都断开，单点的段保留', () => {
    expect(splitRuns([1, 2, null, 3, Number.NaN, 4, 5, undefined, 6])).toEqual([[0, 1], [3], [5, 6], [8]])
    expect(splitRuns([null, null])).toEqual([])
  })

  it('线与面积按段各出一个 M；不够两点的段不画线', () => {
    const points = sparkLayoutPoints(
      [1, 2, null, 3, 4, 5],
      sparkLayout([1, 2, null, 3, 4, 5], { width: 100, height: 30 }),
    )
    expect(pointRuns(points).map((run) => run.length)).toEqual([2, 3])
    expect(linePath(points).match(/M/g)).toHaveLength(2)
    expect(areaPath(points, 30).match(/Z/g)).toHaveLength(2)
    const lone = sparkLayoutPoints([1, null, 2], sparkLayout([1, null, 2], { width: 100, height: 30 }))
    expect(linePath(lone)).toBe('')
  })

  it('断点占着时间格：后面的点横坐标不前移', () => {
    const layout = sparkLayout([1, null, 3], { width: 102, height: 30, padLeft: 2, padRight: 0 })
    expect(xAt(layout, 0)).toBe(2)
    expect(xAt(layout, 1)).toBe(52)
    expect(xAt(layout, 2)).toBe(102)
  })
})

describe('刻度', () => {
  it('最高在顶、最低在底；全相等时一条平线落在正中', () => {
    const layout = sparkLayout([1, 5, 3], { width: 100, height: 36 })
    expect(yAt(layout, 5)).toBe(layout.top)
    expect(yAt(layout, 1)).toBe(layout.bottom)
    const flat = sparkLayout([4, 4, 4], { width: 100, height: 36 })
    expect(yAt(flat, 4)).toBeCloseTo((flat.top + flat.bottom) / 2)
  })

  it('基准落在值域外时把值域撑开，基准线才进得了图', () => {
    const layout = sparkLayout([10, 12], { width: 100, height: 36, baseline: 8 })
    expect(layout.lo).toBe(8)
    expect(yAt(layout, 8)).toBe(layout.bottom)
  })

  it('成交量让出底部高度，线不压量柱', () => {
    const layout = sparkLayout([1, 2], { width: 100, height: 40, bottomReserve: 10 })
    expect(layout.bottom).toBeLessThanOrEqual(40 - 10 - 3)
  })
})

describe('设备像素对齐', () => {
  it('线宽折成设备像素是奇数压半像素、偶数压整像素', () => {
    expect(snapLine(10.3, 1, 1)).toBe(10.5)
    expect(snapLine(10.7, 1, 1)).toBe(10.5)
    expect(snapLine(10.3, 1, 2)).toBe(10.5) // 2 个设备像素，中心在整设备像素 21/2
    expect(snapLine(10.3, 1.5, 2)).toBe(10.25) // 3 个设备像素，中心在半个设备像素
    expect(snapLine(10.3, 1.5, 1)).toBe(10) // 1.5 取整 2 个设备像素，压整像素
  })

  it('矩形的边都落在设备像素上，至少一个设备像素宽', () => {
    expect(snapSpan(1.3, 0.2, 1)).toEqual([1, 1])
    const [x, w] = snapSpan(3.2, 1.4, 2)
    expect((x * 2) % 1).toBe(0)
    expect((w * 2) % 1).toBe(0)
  })
})

describe('单调曲线', () => {
  const sample = (xs: number[], ys: number[]) => {
    const d = monotoneTangents(xs, ys)
    const out: number[][] = []
    for (let k = 0; k < xs.length - 1; k++) {
      const h = (xs[k + 1]! - xs[k]!) / 3
      const p = [ys[k]!, ys[k]! + d[k]! * h, ys[k + 1]! - d[k + 1]! * h, ys[k + 1]!]
      const seg: number[] = []
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const u = 1 - t
        seg.push(u * u * u * p[0]! + 3 * u * u * t * p[1]! + 3 * u * t * t * p[2]! + t * t * t * p[3]!)
      }
      out.push(seg)
    }
    return out
  }

  it('不过冲：每一段曲线都在这段两端点的值之间', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6]
    const ys = [0, 0, 10, 10, 1, 1, 8]
    sample(xs, ys).forEach((seg, k) => {
      const lo = Math.min(ys[k]!, ys[k + 1]!) - 1e-9
      const hi = Math.max(ys[k]!, ys[k + 1]!) + 1e-9
      for (const y of seg) {
        expect(y).toBeGreaterThanOrEqual(lo)
        expect(y).toBeLessThanOrEqual(hi)
      }
    })
  })

  it('极值点处斜率为零；输出路径用 C，两点退回直线', () => {
    expect(monotoneTangents([0, 1, 2], [0, 5, 0])[1]).toBe(0)
    expect(
      linePath(
        [
          [0, 0],
          [10, 5],
          [20, 0],
        ],
        'monotone',
      ),
    ).toMatch(/^M0 0C/)
    expect(
      linePath(
        [
          [0, 0],
          [10, 5],
        ],
        'monotone',
      ),
    ).toBe('M0 0L10 5')
  })
})

describe('基准', () => {
  it('切成上下两块首尾相接：不留缝不重叠', () => {
    const { above, below } = baselineClips(20, 100, 36)
    expect(above.y + above.height).toBe(below.y)
    expect(below.y + below.height).toBe(36 + 2)
    expect(above.y).toBe(-2)
  })

  it('基准在图外时一块是空的', () => {
    expect(baselineClips(-50, 100, 36).above.height).toBe(0)
    expect(baselineClips(500, 100, 36).below.height).toBe(0)
  })

  it('涨跌色：给了 tone 用 tone；有基准按最后值对基准；没基准按头尾', () => {
    expect(resolveSparkTone([1, 9, 2], undefined, undefined)).toBe('up')
    expect(resolveSparkTone([1, 9, 2], undefined, 5)).toBe('down')
    expect(resolveSparkTone([1, 9, 2], 'flat', 5)).toBe('flat')
    expect(resolveSparkTone([1, null, 3, null], undefined, undefined)).toBe('up')
    expect(resolveSparkTone([null, null], undefined, undefined)).toBe('flat')
  })

  it('bars 以基准为界上下分色，等于基准的画 1px 平柱', () => {
    const layout = sparkLayout([8, 12, 10], { width: 60, height: 30, baseline: 10, slots: true })
    const rects = barRects([8, 12, 10], layout, 10)
    expect(rects.map((r) => r.side)).toEqual(['down', 'up', 'flat'])
    expect(rects[1]!.y + rects[1]!.height).toBeCloseTo(yAt(layout, 10), 0)
    expect(rects[2]!.height).toBeGreaterThanOrEqual(1)
  })

  it('winloss 等高：正在中线上、负在下、零是一条细线', () => {
    const layout = sparkLayout([1, -2, 0, 3], { width: 60, height: 30, slots: true })
    const cells = winLossCells([1, -2, 0, 3], layout)
    expect(cells.map((c) => c.side)).toEqual(['up', 'down', 'flat', 'up'])
    expect(cells[0]!.height).toBe(cells[1]!.height)
    expect(cells[0]!.height).toBe(cells[3]!.height)
    expect(cells[0]!.y).toBeLessThan(cells[1]!.y)
    expect(cells[2]!.height).toBeLessThan(cells[0]!.height)
  })
})

describe('最高最低与标签', () => {
  it('取最高最低的位置，并列取最先出现的；全相等没有', () => {
    expect(sparkExtremes([3, 9, 1, 9, 1])).toEqual({ max: 1, min: 2 })
    expect(sparkExtremes([null, 2, 7, null, 4])).toEqual({ max: 2, min: 1 })
    expect(sparkExtremes([2, 2, 2])).toBeNull()
    expect(sparkExtremes([null, 2])).toBeNull()
  })

  it('标签优先放右，右边放不下放左，两边都放不下夹在框内', () => {
    expect(labelPlacement(20, 30, 200)).toMatchObject({ side: 'right', anchor: 'start', x: 24 })
    expect(labelPlacement(180, 30, 200)).toMatchObject({ side: 'left', anchor: 'end', x: 176 })
    const tight = labelPlacement(30, 80, 100)
    expect(tight.side).toBe('right')
    expect(tight.x + 80).toBeLessThanOrEqual(100)
    const tightLeft = labelPlacement(70, 80, 100)
    expect(tightLeft.side).toBe('left')
    expect(tightLeft.x).toBeGreaterThanOrEqual(80)
  })

  it('读数小框右放不下翻到左，再夹进框内，纵向避开点所在的那一半', () => {
    expect(readoutPlacement(20, 5, 60, 16, { width: 200, height: 40 }).x).toBe(26)
    expect(readoutPlacement(190, 5, 60, 16, { width: 200, height: 40 }).x).toBe(124)
    expect(readoutPlacement(10, 5, 300, 16, { width: 200, height: 40 }).x).toBe(0)
    expect(readoutPlacement(20, 5, 60, 16, { width: 200, height: 40 }).y).toBe(24)
    expect(readoutPlacement(20, 35, 60, 16, { width: 200, height: 40 }).y).toBe(0)
  })
})

describe('悬停与键盘', () => {
  const values = [1, null, 3, 4, null]
  const layout = sparkLayout(values, { width: 104, height: 30, padLeft: 2, padRight: 2 })

  it('吸附到最近的有效点，断点不会被选中', () => {
    expect(nearestIndex(values, xAt(layout, 1), layout)).toBeLessThanOrEqual(2)
    expect(nearestIndex(values, 0, layout)).toBe(0)
    expect(nearestIndex(values, 999, layout)).toBe(3)
    expect(nearestIndex([null, null], 10, layout)).toBe(-1)
  })

  it('左右键走有效点、跳过断点、到头停住', () => {
    expect(stepIndex(values, 0, 'next')).toBe(2)
    expect(stepIndex(values, 2, 'prev')).toBe(0)
    expect(stepIndex(values, 0, 'prev')).toBe(0)
    expect(stepIndex(values, 3, 'next')).toBe(3)
    expect(stepIndex(values, null, 'next')).toBe(0)
    expect(stepIndex(values, null, 'prev')).toBe(3)
    expect(stepIndex(values, 2, 'last')).toBe(3)
  })
})

describe('成交量', () => {
  it('占底部给定高度、按最大值定比例，缺值与零不画，涨跌跟前一个价格比', () => {
    const layout = sparkLayout([1, 2, 1.5, 3], { width: 80, height: 40, bottomReserve: 10 })
    const rects = volumeRects([5, 10, null, 0], [1, 2, 1.5, 3], layout, 10)
    expect(rects.map((r) => r.i)).toEqual([0, 1])
    expect(rects[1]!.height).toBeCloseTo(10, 0)
    expect(rects[0]!.height).toBeCloseTo(5, 0)
    expect(rects[1]!.y + rects[1]!.height).toBe(40)
    expect(rects[1]!.side).toBe('up')
  })
})

// 演示用的 A 股一天：9:30 到 11:30、13:00 到 15:00（只看时间差，时区不重要，用 UTC 毫秒）。
const at = (h: number, m: number) => Date.UTC(2026, 10, 17, h, m)
const DAY_AXIS = {
  domain: [at(9, 30), at(15, 0)] as const,
  sessions: [
    [at(9, 30), at(11, 30)],
    [at(13, 0), at(15, 0)],
  ] as const,
}

describe('时间轴', () => {
  it('没给交易时段整个 domain 是一段；domain 不合法没有段', () => {
    expect(timeSpans({ domain: [0, 100] })).toEqual([[0, 100]])
    expect(timeSpans({ domain: [100, 100] })).toEqual([])
  })

  it('交易时段夹进 domain、去空段、排序、合并重叠', () => {
    expect(
      timeSpans({
        domain: [10, 100],
        sessions: [
          [60, 90],
          [0, 20],
          [15, 30],
          [50, 50],
        ],
      }),
    ).toEqual([
      [10, 30],
      [60, 90],
    ])
    expect(timeSpans({ domain: [10, 100], sessions: [[200, 300]] })).toEqual([[10, 100]])
  })

  it('时间到横坐标：没有休市时按时长线性铺在 [left, right]', () => {
    const spans = timeSpans({ domain: [0, 100] })
    expect(timeX(0, spans, 10, 110)).toBe(10)
    expect(timeX(25, spans, 10, 110)).toBe(35)
    expect(timeX(100, spans, 10, 110)).toBe(110)
  })

  it('domain 之外与休市里的时间是 NaN（被裁掉）', () => {
    const spans = timeSpans(DAY_AXIS)
    expect(timeX(at(9, 0), spans, 0, 300)).toBeNaN()
    expect(timeX(at(15, 1), spans, 0, 300)).toBeNaN()
    expect(timeX(at(12, 0), spans, 0, 300)).toBeNaN()
    expect(timeGroups([at(9, 0), at(10, 0), at(12, 0), at(13, 0), at(15, 1), Number.NaN], spans)).toEqual([
      -1, 0, -1, 1, -1, -1,
    ])
  })

  it('休市压缩：午休不占宽，上午最后一点到下午第一点只隔一道细缝', () => {
    const spans = timeSpans(DAY_AXIS)
    const xs = timeXs([at(9, 30), at(11, 30), at(13, 0), at(15, 0)], spans, 0, 404)
    expect(xs[0]).toBe(0)
    expect(xs[3]).toBe(404)
    // 上午下午各 2 小时、各占一半（扣掉缝）。
    expect(xs[1]).toBeCloseTo((404 - SPARK_SESSION_GAP) / 2, 6)
    expect(xs[2]! - xs[1]!).toBeCloseTo(SPARK_SESSION_GAP, 6)
  })

  it('线只画到现在：最后一点在时段中间时右边留空', () => {
    const spans = timeSpans(DAY_AXIS)
    const now = at(14, 0)
    const x = timeX(now, spans, 0, 404)
    const end = timeX(at(15, 0), spans, 0, 404)
    expect(x).toBeLessThan(end)
    // 14:00 在下午时段的一半：整个横轴 = 上午 200 + 缝 4 + 下午 200，14:00 在 204 + 100。
    expect(x).toBeCloseTo(304, 6)
  })

  it('刻度：每 30 分钟一个，落在整点与半点，只取交易时段里的，时段两头都算', () => {
    const spans = timeSpans(DAY_AXIS)
    const ticks = timeTicks(spans, 30)
    expect(ticks[0]).toBe(at(9, 30))
    expect(ticks).toContain(at(11, 30))
    expect(ticks).toContain(at(13, 0))
    expect(ticks).not.toContain(at(12, 0))
    expect(ticks[ticks.length - 1]).toBe(at(15, 0))
    expect(ticks).toHaveLength(10)
  })

  it('刻度间隔自动取：放不下就换大一档', () => {
    const spans = timeSpans(DAY_AXIS)
    expect(autoTickMinutes(spans, 12)).toBe(30)
    expect(autoTickMinutes(spans, 5)).toBe(60)
    expect(autoTickMinutes(spans, 1)).toBeGreaterThan(60)
  })

  it('标签不重叠、不出框：挤到一起的后一个丢掉', () => {
    expect(
      thinLabels(
        [
          { x: 20, width: 30 },
          { x: 40, width: 30 },
          { x: 100, width: 30 },
          { x: 195, width: 30 },
        ],
        200,
      ),
    ).toEqual([0, 2, 3])
  })

  it('价格刻度均分含两端、从高到低', () => {
    expect(priceTicks(0, 30, 4)).toEqual([30, 20, 10, 0])
    expect(priceTicks(5, 10, 1)).toEqual([10, 5])
  })

  it('线宽：80 以上 2px，更矮 1.5px', () => {
    expect(sparkLineWidth(36)).toBe(1.5)
    expect(sparkLineWidth(80)).toBe(2)
  })

  it('按时间排的横坐标：xAt 取 xs，被裁掉的点没有 y、不会被选中', () => {
    const layout = { ...sparkLayout([1, 2, 3], { width: 100, height: 30 }), xs: [10, Number.NaN, 90] }
    expect(xAt(layout, 0)).toBe(10)
    expect(xAt(layout, 1)).toBeNaN()
    const points = sparkLayoutPoints([1, 2, 3], layout)
    expect(Number.isNaN(points[1]![1])).toBe(true)
    expect(nearestIndex([1, 2, 3], 50, layout)).toBe(0)
  })

  it('时段号不同的相邻点断开：午休两边的线各是一段', () => {
    const pts = [
      [0, 5],
      [10, 6],
      [14, 7],
      [24, 8],
    ] as const
    expect(pointRuns(pts)).toHaveLength(1)
    expect(pointRuns(pts, [0, 0, 1, 1])).toHaveLength(2)
    expect(linePath(pts, 'linear', [0, 0, 1, 1]).match(/M/g)).toHaveLength(2)
    expect(areaPath(pts, 30, 'linear', [0, 0, 1, 1]).match(/Z/g)).toHaveLength(2)
  })
})

describe('读数框位置', () => {
  const box = { width: 200, height: 100 }
  it('先放右边，放不下翻左边，不出框', () => {
    expect(tipPlacement(50, 50, 60, 40, box).side).toBe('right')
    const flipped = tipPlacement(180, 50, 60, 40, box)
    expect(flipped.side).toBe('left')
    expect(flipped.x + 60).toBeLessThanOrEqual(180)
    expect(tipPlacement(5, 50, 300, 40, box).x).toBe(0)
  })
  it('纵向以点为中心并夹进框内；比图还高时放到图上方', () => {
    expect(tipPlacement(50, 2, 60, 40, box).y).toBe(0)
    expect(tipPlacement(50, 99, 60, 40, box).y).toBe(60)
    const tall = tipPlacement(50, 10, 60, 120, box)
    expect(tall.above).toBe(true)
    expect(tall.y).toBeLessThan(-120)
  })
})
