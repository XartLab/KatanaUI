// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Meter, meterLimitMax, meterLimitState, meterShare } from './meter.tsx'

// 结构与纯函数；颜色读 token、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。G6 从 src/quant/quant-batch2.test.tsx 拆来。

describe('Meter', () => {
  it('meterShare 越界贴边、非有限数按 0', () => {
    expect(meterShare(50)).toBe(0.5)
    expect(meterShare(150)).toBe(1)
    expect(meterShare(-3)).toBe(0)
    expect(meterShare(Number.NaN)).toBe(0)
    expect(meterShare(5, 0)).toBe(0)
  })

  it('bar：名字与数永远在，role=meter 带读数；默认写四舍五入的百分数；tone 写进 data-tone', () => {
    const html = renderToStaticMarkup(<Meter label="LOAD" value={72.4} tone="ok" />)
    expect(html).toContain('LOAD')
    expect(html).toContain('72%')
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="72.4"')
    expect(html).toContain('data-tone="ok"')
    expect(html).toContain('width:72.4%')
  })

  it('sync：右侧大百分比与琥珀刻度；刻度的读屏名进 valuetext', () => {
    const html = renderToStaticMarkup(<Meter label="PAPER" value={40} display="sync" mark={60} markLabel="review" />)
    expect(html).toContain('k-meter-big')
    expect(html).toContain('k-meter-mark')
    expect(html).toContain('left:60%')
    expect(html).toContain('review 60%')
  })

  it('meterLimitState 按「达到」算：等于预警线就是 warn，等于硬限就是 breach；没给或非有限数的线不算', () => {
    expect(meterLimitState(79.9, 80, 100)).toBe('normal')
    expect(meterLimitState(80, 80, 100)).toBe('warn')
    expect(meterLimitState(100, 80, 100)).toBe('breach')
    expect(meterLimitState(120, undefined, 100)).toBe('breach')
    expect(meterLimitState(90, 80)).toBe('warn')
    expect(meterLimitState(90, Number.NaN, Number.NaN)).toBe('normal')
    expect(meterLimitState(Number.NaN, 80, 100)).toBe('normal')
  })

  it('meterLimitMax：已用与两条线里最大的正数，不加余量；都没有时回到 100', () => {
    expect(meterLimitMax(54, 80, 100)).toBe(100)
    expect(meterLimitMax(112, 80, 100)).toBe(112)
    expect(meterLimitMax(0.3, 0.5)).toBe(0.5)
    expect(meterLimitMax(-5, Number.NaN)).toBe(100)
  })

  it('限额：两条线按满刻度落位，越线 tone 跟着换、根上写 data-state，线的说法进 valuetext', () => {
    const labels = { warn: 'warn 80', hard: 'hard 100' }
    const normal = renderToStaticMarkup(
      <Meter label="GROSS" value={54} tone="ok" warnAt={80} hardAt={100} limitLabels={labels} />,
    )
    expect(normal).toContain('data-state="normal"')
    expect(normal).toContain('data-tone="ok"')
    expect(normal).toContain('class="k-meter-limit is-warn" style="left:80%"')
    expect(normal).toContain('class="k-meter-limit is-hard" style="left:100%"')
    expect(normal).toContain('aria-valuemax="100"')
    expect(normal).toContain('aria-valuetext="54% (warn 80, hard 100)"')

    const warn = renderToStaticMarkup(<Meter label="MARGIN" value={86} warnAt={80} hardAt={100} />)
    expect(warn).toContain('data-state="warn"')
    expect(warn).toContain('data-tone="warn"')

    // 越限：没给 max 时满刻度是已用，硬限线落在里面，填充占满。
    const breach = renderToStaticMarkup(<Meter label="DD" value={125} warnAt={80} hardAt={100} valueText="125%" />)
    expect(breach).toContain('data-state="breach"')
    expect(breach).toContain('data-tone="danger"')
    expect(breach).toContain('aria-valuemax="125"')
    expect(breach).toContain('class="k-meter-limit is-hard" style="left:80%"')
    expect(breach).toContain('width:100%')
  })

  it('没给线就没有限额：不写 data-state、tone 照传；gauge 不画线也不换 tone', () => {
    const plain = renderToStaticMarkup(<Meter label="LOAD" value={95} tone="ok" />)
    expect(plain).not.toContain('data-state')
    expect(plain).not.toContain('k-meter-limit')
    const gauge = renderToStaticMarkup(<Meter label="RS" value={95} display="gauge" warnAt={80} hardAt={90} />)
    expect(gauge).not.toContain('k-meter-limit')
    expect(gauge).not.toContain('data-state')
    expect(gauge).toContain('data-tone="accent"')
  })

  it('gauge：指针位置、0 到 100 的五个刻度', () => {
    const html = renderToStaticMarkup(<Meter label="RS" value={94} display="gauge" />)
    expect(html).toContain('k-meter-pin')
    expect(html.match(/<span>\d+<\/span>/g)).toHaveLength(5)
  })
})
