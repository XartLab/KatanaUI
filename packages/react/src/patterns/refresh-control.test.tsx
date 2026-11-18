// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RefreshControl, formatRemaining } from './refresh-control.tsx'

describe('RefreshControl', () => {
  it('倒计时：60 秒以内写秒，以上写分:秒', () => {
    expect(formatRemaining(0)).toBe('0s')
    expect(formatRemaining(11_200)).toBe('12s')
    expect(formatRemaining(65_000)).toBe('1:05')
  })

  it('分段、立即刷新钮、上次时刻；关着时没有倒计时', () => {
    const html = renderToStaticMarkup(
      <RefreshControl
        options={[
          { value: 10_000, label: '10 秒' },
          { value: 0, label: '不刷新' },
        ]}
        interval={0}
        onIntervalChange={() => {}}
        lastRefreshed={Date.UTC(2026, 10, 18, 1, 2, 3)}
        onRefresh={() => {}}
        labels={{ interval: '自动刷新', refresh: '立即刷新', last: '上次', next: '下次' }}
        formatTime={() => '09:02:03'}
      />,
    )
    expect(html).toContain('10 秒')
    expect(html).toContain('aria-label="立即刷新"')
    expect(html).toContain('09:02:03')
    expect(html).not.toContain('refresh-countdown')
  })
})
