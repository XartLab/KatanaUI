// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  areaPath,
  barRects,
  baselineClips,
  labelPlacement,
  linePath,
  monotoneTangents,
  nearestIndex,
  pointRuns,
  readoutPlacement,
  resolveSparkTone,
  snapLine,
  snapSpan,
  sparkExtremes,
  sparkLayout,
  sparkLayoutPoints,
  splitRuns,
  stepIndex,
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
