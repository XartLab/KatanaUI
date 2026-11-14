// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { clampSplitRatio, snapSplitRatio, Splitter, splitKeyRatio } from './index.ts'

describe('Splitter 的纯函数', () => {
  it('靠近吸附点才吸附，阈值 0 关闭，自定义吸附点', () => {
    expect(snapSplitRatio(0.505, 1000, 6)).toBe(0.5)
    expect(snapSplitRatio(0.52, 1000, 6)).toBe(0.52)
    expect(snapSplitRatio(0.51, 1000, 0)).toBe(0.51)
    expect(snapSplitRatio(0.255, 1000, 6, [0.25])).toBe(0.25)
    expect(snapSplitRatio(0.5, 1000, 6, [])).toBe(0.5)
  })

  it('夹在两边最小尺寸之间；放不下时按最小尺寸的比例分', () => {
    expect(clampSplitRatio(0.05, 1000, 200, 200)).toBe(0.2)
    expect(clampSplitRatio(0.95, 1000, 200, 200)).toBe(0.8)
    expect(clampSplitRatio(0.3, 300, 200, 100)).toBeCloseTo(2 / 3)
  })

  it('键盘：方向键按 px 步长，Shift 加速，Home / End 到两端，Enter 回默认，别的键不管', () => {
    const base = {
      axis: 'row',
      ratio: 0.5,
      span: 800,
      shift: false,
      stepPx: 8,
      fastStepPx: 32,
      defaultRatio: 0.4,
    } as const
    expect(splitKeyRatio('ArrowRight', base)).toBeCloseTo(0.51)
    expect(splitKeyRatio('ArrowLeft', { ...base, shift: true })).toBeCloseTo(0.46)
    expect(splitKeyRatio('ArrowDown', base)).toBeNull()
    expect(splitKeyRatio('ArrowDown', { ...base, axis: 'column' })).toBeCloseTo(0.51)
    expect(splitKeyRatio('Home', base)).toBe(0)
    expect(splitKeyRatio('End', base)).toBe(1)
    expect(splitKeyRatio('Enter', base)).toBe(0.4)
    expect(splitKeyRatio('a', base)).toBeNull()
  })
})

describe('Splitter 的结构', () => {
  it('role=separator 带方向、值、名字，可聚焦', () => {
    const html = renderToStaticMarkup(
      <Splitter
        axis="row"
        ratio={0.25}
        label="Resize"
        valueText={(v) => `${Math.round(v * 100)}%`}
        onChange={() => {}}
      />,
    )
    expect(html).toContain('role="separator"')
    expect(html).toContain('aria-orientation="vertical"')
    expect(html).toContain('aria-valuenow="25"')
    expect(html).toContain('aria-valuetext="25%"')
    expect(html).toContain('aria-label="Resize"')
    expect(html).toContain('tabindex="0"')
  })
})
