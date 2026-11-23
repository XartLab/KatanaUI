// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ThresholdGap } from './threshold-gap.tsx'
import { thresholdGap, thresholdState } from './threshold-gap-model.ts'

// KatanaUI #11 第 10 项：异动阈值差读数。阈值与偏离值都是示例，不是哪个板块的规则。

describe('阈值差的纯函数', () => {
  it('thresholdGap：阈值 − |偏离值|，按绝对值比；取不到或阈值不是正数返回 null', () => {
    expect(thresholdGap(19.96, 20)).toBe(0.04)
    expect(thresholdGap(-19.96, 20)).toBe(0.04)
    expect(thresholdGap(21.2, 20)).toBe(-1.2)
    expect(thresholdGap(null, 20)).toBeNull()
    expect(thresholdGap(5, 0)).toBeNull()
  })

  it('thresholdState：结束由调用方说；达到阈值是已触发、达到预警线是临近，其余监控中', () => {
    expect(thresholdState(12, 20, 16)).toBe('watch')
    expect(thresholdState(16, 20, 16)).toBe('near')
    expect(thresholdState(-17, 20, 16)).toBe('near')
    expect(thresholdState(20, 20, 16)).toBe('triggered')
    expect(thresholdState(25, 20, 16, true)).toBe('ended')
    expect(thresholdState(18, 20)).toBe('watch')
    expect(thresholdState(null, 20)).toBeNull()
  })
})

describe('ThresholdGap 渲染', () => {
  it('临近：写「差 0.04%」，档位标签是琥珀，条上有阈值红线与预警线', () => {
    const html = renderToStaticMarkup(
      <ThresholdGap label="示例科技" value={19.96} threshold={20} warnAt={16} period="3 日累计偏离" />,
    )
    expect(html).toContain('data-state="near"')
    expect(html).toContain('差 0.04%')
    expect(html).toContain('>临近<')
    expect(html).toMatch(/data-slot="threshold-gap-state"|data-tone="warn"/)
    expect(html).toContain('k-meter-limit is-hard')
    expect(html).toContain('k-meter-limit is-warn')
    expect(html).toContain('+19.96%')
    expect(html).toContain('3 日累计偏离')
  })

  it('已触发：写「超出」，档位是红；下跌偏离按绝对值比', () => {
    const html = renderToStaticMarkup(<ThresholdGap label="示例乙" value={-21.2} threshold={20} />)
    expect(html).toContain('data-state="triggered"')
    expect(html).toContain('超出 1.20%')
    expect(html).toContain('>已触发<')
    expect(html).toContain('-21.20%')
  })

  it('监管期结束：只留阈值刻度，不写差多少', () => {
    const html = renderToStaticMarkup(
      <ThresholdGap label="示例丙" value={25} threshold={20} ended note="监管期至 11-28" />,
    )
    expect(html).toContain('data-state="ended"')
    expect(html).toContain('>监管期结束<')
    expect(html).not.toContain('超出')
    expect(html).not.toContain('is-hard')
    expect(html).toContain('k-meter-mark')
    expect(html).toContain('监管期至 11-28')
  })

  it('偏离值取不到：写「暂无数据」，不猜档位', () => {
    const html = renderToStaticMarkup(<ThresholdGap label="示例丁" value={null} threshold={20} />)
    expect(html).toContain('data-state="unknown"')
    expect(html).toContain('暂无数据')
    expect(html).not.toContain('threshold-gap-state')
  })
})
