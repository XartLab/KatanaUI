// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { sparkPoints, sparkY } from '../quotes/sparkline.tsx'
import { SparkTile } from './index.ts'
import { sparkTileShape } from '../quotes/spark-tile.tsx'

// 结构与纯函数；颜色读 token、data-updown 互换、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。

describe('SparkTile', () => {
  it('sparkPoints 给了范围就按范围排：同一刻度下阈值线与折线对得上', () => {
    expect(sparkPoints([0, 10], 100, 24, [0, 20])).toBe(
      `0.00,${sparkY(0, 0, 20, 24).toFixed(2)} 100.00,${sparkY(10, 0, 20, 24).toFixed(2)}`,
    )
    expect(sparkPoints([1, 2], 100, 24)).toBe('0.00,22.00 100.00,2.00')
  })

  it('阈值也算进纵向的高低：阈值比数据都高时，折线落在下半', () => {
    const shape = sparkTileShape([1, 2, 3], 10)!
    expect(shape.thresholdY).toBeCloseTo(2)
    expect(shape.endY).toBeGreaterThan(shape.thresholdY!)
    expect(sparkTileShape([1], undefined)).toBeNull()
  })

  it('没有数据：数值写「—」、线的位置写「—」，不画折线；读屏名照调用方传的', () => {
    const html = renderToStaticMarkup(<SparkTile label="NET" value={null} series={[]} sparkLabel="no data" />)
    expect(html).toContain('is-empty')
    expect(html).not.toContain('<polyline')
    expect(html).toContain('aria-label="no data"')
  })

  it('变化是带符号的 ChangeText（箭头：方向不只靠颜色）；有阈值画虚线；状态写进 data-state；给 onClick 才是按钮', () => {
    const html = renderToStaticMarkup(
      <SparkTile
        label="X"
        value="1"
        series={[1, 2, 3]}
        sparkLabel="s"
        delta={1.5}
        threshold={2.5}
        state="near"
        note="near cap"
      />,
    )
    expect(html).toContain('+1.50%')
    expect(html).toContain('▲')
    expect(html).toContain('k-spark-tile-limit')
    expect(html).toContain('data-state="near"')
    expect(html).toContain('near cap')
    expect(html).not.toContain('<button')
    expect(
      renderToStaticMarkup(<SparkTile label="X" value="1" series={[]} sparkLabel="s" onClick={() => {}} />),
    ).toContain('<button')
  })
})
