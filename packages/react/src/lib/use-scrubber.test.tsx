// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SCRUB_BIG_STEP, scrubIndexAt, scrubKey, useScrubber } from './use-scrubber.ts'

describe('扫读的键位', () => {
  it('←→ 一格，Shift 三格，到头停住', () => {
    expect(scrubKey(5, 10, 'ArrowLeft', false)).toBe(4)
    expect(scrubKey(5, 10, 'ArrowRight', false)).toBe(6)
    expect(scrubKey(5, 10, 'ArrowRight', true)).toBe(5 + SCRUB_BIG_STEP)
    expect(scrubKey(5, 10, 'ArrowLeft', true)).toBe(5 - SCRUB_BIG_STEP)
    expect(scrubKey(0, 10, 'ArrowLeft', false)).toBe(0)
    expect(scrubKey(8, 10, 'ArrowRight', true)).toBe(9)
  })

  it('Home、End 到头尾；没选中时 ←→ 先落到最新一格', () => {
    expect(scrubKey(5, 10, 'Home', false)).toBe(0)
    expect(scrubKey(5, 10, 'End', false)).toBe(9)
    expect(scrubKey(null, 10, 'ArrowLeft', false)).toBe(9)
    expect(scrubKey(null, 10, 'ArrowRight', true)).toBe(9)
  })

  it('Esc 清掉；已经清掉时不归它管，别的键也不归它管', () => {
    expect(scrubKey(3, 10, 'Escape', false)).toBeNull()
    expect(scrubKey(null, 10, 'Escape', false)).toBeUndefined()
    expect(scrubKey(3, 10, 'a', false)).toBeUndefined()
    expect(scrubKey(3, 0, 'ArrowLeft', false)).toBeUndefined()
  })
})

describe('指针横坐标到格号', () => {
  it('point：最近的点，头尾贴边；band：落在哪条带里', () => {
    expect(scrubIndexAt(0, 100, 5, 'point')).toBe(0)
    expect(scrubIndexAt(100, 100, 5, 'point')).toBe(4)
    expect(scrubIndexAt(37, 100, 5, 'point')).toBe(1)
    expect(scrubIndexAt(38, 100, 5, 'point')).toBe(2)
    expect(scrubIndexAt(19, 100, 5, 'band')).toBe(0)
    expect(scrubIndexAt(20, 100, 5, 'band')).toBe(1)
    expect(scrubIndexAt(100, 100, 5, 'band')).toBe(4)
  })

  it('越界按边；没排版（宽为 0）或没有格返回 null；只有一格总是 0', () => {
    expect(scrubIndexAt(-30, 100, 5)).toBe(0)
    expect(scrubIndexAt(300, 100, 5)).toBe(4)
    expect(scrubIndexAt(10, 0, 5)).toBeNull()
    expect(scrubIndexAt(10, 100, 0)).toBeNull()
    expect(scrubIndexAt(80, 100, 1)).toBe(0)
  })
})

describe('useScrubber', () => {
  const Probe = ({ index, count }: { index?: number | null; count: number }) => {
    const scrub = useScrubber({ count, index })
    return <i data-index={String(scrub.index)} tabIndex={scrub.keys.tabIndex} />
  }

  it('渲染：默认没选中，可聚焦；受控的选中格越界当作没选中', () => {
    expect(renderToStaticMarkup(<Probe count={5} />)).toContain('data-index="null"')
    expect(renderToStaticMarkup(<Probe count={5} />)).toContain('tabindex="0"')
    expect(renderToStaticMarkup(<Probe count={5} index={3} />)).toContain('data-index="3"')
    expect(renderToStaticMarkup(<Probe count={3} index={3} />)).toContain('data-index="null"')
  })
})
