// SPDX-License-Identifier: MIT
// #157 RulerSlider 的纯逻辑与结构：服务端渲染成字符串，查角色、读数、亮的刻度与大刻度的数字。拖动、点按、动效在真浏览器里验。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RulerSlider } from '../index.ts'
import { rulerKeyIndex, rulerRatio, rulerTapIndex } from './ruler-slider.tsx'

const lit = (html: string, color: string) =>
  (html.match(/<div data-ruler-notch=""[^>]*>/g) ?? []).filter((tag) => tag.includes(`background-color:${color}`))
    .length

describe('RulerSlider', () => {
  it('单向：从 min 到当前值的刻度都亮，右边的不亮', () => {
    const html = renderToStaticMarkup(<RulerSlider label="数量占可用" min={0} max={100} value={30} />)
    expect(html.match(/data-ruler-notch=""/g)).toHaveLength(101)
    // 0 到 30 共 31 格亮（accent），31 到 100 共 70 格暗。只亮定位线下那一格（ExposureSlider 的画法）就是 1。
    expect(lit(html, 'var(--accent)')).toBe(31)
    expect(lit(html, 'var(--ink-300)')).toBe(70)
  })

  it('环从 min 起算比例；值在 min 时不画弧、数字用中性色', () => {
    const quarter = renderToStaticMarkup(<RulerSlider label="l" min={0} max={100} value={25} />)
    expect(quarter).toMatch(/data-slot="ruler-slider-arc"[^>]*stroke-dasharray="0.25 0.75"/)
    const lever = renderToStaticMarkup(<RulerSlider label="l" min={1} max={21} value={6} />)
    expect(lever).toMatch(/stroke-dasharray="0.25 0.75"/)
    const empty = renderToStaticMarkup(<RulerSlider label="l" min={0} max={100} />)
    expect(empty).toMatch(/stroke-dasharray="0 1"/)
    expect(empty).toContain('style="color:var(--ink-100)"')
  })

  it('读屏：role=slider，名字、上下限、当前值与 format 的读法', () => {
    const html = renderToStaticMarkup(
      <RulerSlider label="杠杆" min={1} max={20} defaultValue={5} format={(v) => `${v}×`} />,
    )
    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-label="杠杆"')
    expect(html).toContain('aria-valuemin="1"')
    expect(html).toContain('aria-valuemax="20"')
    expect(html).toContain('aria-valuenow="5"')
    expect(html).toContain('aria-valuetext="5×"')
    expect(html).toContain('data-slot="ruler-slider-value"')
  })

  it('大刻度只标大刻度步长的整数倍：1× 起的杠杆读 5×、10×、15×、20×', () => {
    const marks = (html: string) =>
      [...html.matchAll(/data-slot="ruler-slider-mark"[^>]*>([^<]*)</g)].map((match) => match[1])
    expect(
      marks(renderToStaticMarkup(<RulerSlider label="l" min={1} max={20} majorEvery={5} format={(v) => `${v}×`} />)),
    ).toEqual(['5×', '10×', '15×', '20×'])
    expect(marks(renderToStaticMarkup(<RulerSlider label="l" majorEvery={25} format={(v) => `${v}%`} />))).toEqual([
      '0%',
      '25%',
      '50%',
      '75%',
      '100%',
    ])
    // 步长是小数也不漏：0 到 1、步长 0.05、每 10 格一个数字。
    expect(marks(renderToStaticMarkup(<RulerSlider label="l" min={0} max={1} step={0.05} majorEvery={10} />))).toEqual([
      '0',
      '0.5',
      '1',
    ])
  })

  it('不带环时只剩刻度尺', () => {
    const html = renderToStaticMarkup(<RulerSlider label="l" showIndicator={false} />)
    expect(html).not.toContain('ruler-slider-value')
    expect(html).toContain('role="slider"')
  })
})

describe('键盘与点按', () => {
  it('方向键一格，Shift + 方向键与 PageUp / PageDown 一大格，Home / End 到两端，不认的键是 null', () => {
    expect(rulerKeyIndex('ArrowRight', false, 3, 101, 25)).toBe(4)
    expect(rulerKeyIndex('ArrowDown', false, 3, 101, 25)).toBe(2)
    expect(rulerKeyIndex('ArrowRight', true, 3, 101, 25)).toBe(28)
    expect(rulerKeyIndex('ArrowLeft', true, 30, 101, 25)).toBe(5)
    expect(rulerKeyIndex('PageUp', false, 3, 101, 25)).toBe(28)
    expect(rulerKeyIndex('PageDown', false, 30, 101, 25)).toBe(5)
    expect(rulerKeyIndex('Home', false, 30, 101, 25)).toBe(0)
    expect(rulerKeyIndex('End', false, 30, 101, 25)).toBe(100)
    expect(rulerKeyIndex('a', false, 30, 101, 25)).toBeNull()
  })

  it('点按：离定位线的像素按一格 13px 换成格数', () => {
    expect(rulerTapIndex(10, 0)).toBe(10)
    expect(rulerTapIndex(10, 26)).toBe(12)
    expect(rulerTapIndex(10, -32)).toBe(8)
  })

  it('环的比例夹在 0 到 1，上下限相等时是 0', () => {
    expect(rulerRatio(50, 0, 100)).toBe(0.5)
    expect(rulerRatio(-5, 0, 100)).toBe(0)
    expect(rulerRatio(130, 0, 100)).toBe(1)
    expect(rulerRatio(3, 3, 3)).toBe(0)
  })
})
