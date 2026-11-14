// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AiStatus, DeleteButton, MatrixOrb, NotificationBell, PasswordInput, StatusIcon } from '../index.ts'
import { formatElapsed } from './ai-status.tsx'
import { orbIntensity, ORB_SCALE, simulatedLevel } from './matrix-orb-model.ts'
import { badgeText, swingImpulse } from './notification-bell.tsx'
import { eyePath } from './password-input.tsx'

// #1861 六件的纯逻辑与结构。动效、焦点、键盘在 e2e/ui-gallery.spec.ts 里用真浏览器逐帧采样。

describe('PasswordInput', () => {
  it('默认是遮住的 password 输入框，眼睛按钮名字由调用方给、aria-pressed 表达状态', () => {
    const html = renderToStaticMarkup(<PasswordInput toggleLabel="显示密钥" defaultValue="abc" />)
    expect(html).toContain('type="password"')
    expect(html).toContain('aria-label="显示密钥"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('autoComplete="off"')
  })

  it('defaultVisible 一开始就是明文', () => {
    const html = renderToStaticMarkup(<PasswordInput toggleLabel="x" defaultVisible />)
    expect(html).toContain('type="text"')
    expect(html).toContain('aria-pressed="true"')
  })

  it('眼睛的轮廓：闭合是压平的线，睁开是杏仁，越界的值被夹住', () => {
    expect(eyePath(0)).toBe('M2 12C6 12 18 12 22 12C18 12 6 12 2 12Z')
    expect(eyePath(1)).toBe('M2 12C6 4 18 4 22 12C18 20 6 20 2 12Z')
    expect(eyePath(2)).toBe(eyePath(1))
    expect(eyePath(-1)).toBe(eyePath(0))
  })
})

describe('DeleteButton', () => {
  it('待命时只有一个按钮，不展开、不带确认钮', () => {
    const html = renderToStaticMarkup(<DeleteButton label="删除" confirmLabel="确认" cancelLabel="取消" />)
    expect(html).toContain('aria-label="删除"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('data-phase="idle"')
    expect(html).not.toContain('aria-label="确认"')
  })
})

describe('NotificationBell', () => {
  it('角标的字：0 不画，超过上限写 +，非有限数当 0，小数取整', () => {
    expect(badgeText(0, 99)).toBe('')
    expect(badgeText(7, 99)).toBe('7')
    expect(badgeText(99, 99)).toBe('99')
    expect(badgeText(100, 99)).toBe('99+')
    expect(badgeText(12, 9)).toBe('9+')
    expect(badgeText(Number.NaN, 99)).toBe('')
    expect(badgeText(-3, 99)).toBe('')
    expect(badgeText(3.8, 99)).toBe('3')
  })

  it('摆动的力度跟增量走，封顶', () => {
    expect(swingImpulse(1)).toBeLessThan(swingImpulse(3))
    expect(swingImpulse(5)).toBe(swingImpulse(50))
    expect(swingImpulse(0)).toBe(swingImpulse(1))
  })

  it('按钮名字由调用方给；0 时没有角标，有数时角标对读屏隐藏', () => {
    const none = renderToStaticMarkup(<NotificationBell count={0} label="提醒" />)
    expect(none).toContain('aria-label="提醒"')
    expect(none).not.toContain('notification-bell-badge')
    const some = renderToStaticMarkup(<NotificationBell count={3} label="提醒，3 条未读" />)
    expect(some).toContain('data-count="3"')
    expect(some).toContain('aria-hidden="true"')
  })
})

describe('StatusIcon', () => {
  it('有名字时是 role=img；名字是空串时当装饰对读屏隐藏', () => {
    const named = renderToStaticMarkup(<StatusIcon status="success" label="成功" />)
    expect(named).toContain('role="img"')
    expect(named).toContain('aria-label="成功"')
    const decorative = renderToStaticMarkup(<StatusIcon status="warning" label="" />)
    expect(decorative).not.toContain('role="img"')
    expect(decorative).toContain('aria-hidden="true"')
  })

  it('五种状态各有颜色类', () => {
    const tones = (['success', 'error', 'warning', 'info', 'pending'] as const).map(
      (status) => renderToStaticMarkup(<StatusIcon status={status} label={status} />).match(/text-[^ "]+/)?.[0],
    )
    expect(new Set(tones).size).toBe(5)
  })
})

describe('AiStatus', () => {
  it('耗时的写法：不到一分钟写秒，之后写分与补零的秒；非法值当 0', () => {
    expect(formatElapsed(0)).toBe('0s')
    expect(formatElapsed(59.9)).toBe('59s')
    expect(formatElapsed(60)).toBe('1m 00s')
    expect(formatElapsed(125)).toBe('2m 05s')
    expect(formatElapsed(-5)).toBe('0s')
    expect(formatElapsed(Number.NaN)).toBe('0s')
  })

  it('进行中带流光与耗时，结束后都没有；整行是 role=status', () => {
    const active = renderToStaticMarkup(<AiStatus state="thinking" label="思考" elapsed={12} />)
    expect(active).toContain('role="status"')
    expect(active).toContain('k-ai-shimmer')
    expect(active).toContain('12s')
    expect(active).toContain('data-active')
    const done = renderToStaticMarkup(<AiStatus state="done" label="完成" elapsed={12} />)
    expect(done).not.toContain('k-ai-shimmer')
    expect(done).not.toContain('12s')
    expect(done).not.toContain('data-active')
  })
})

describe('MatrixOrb 的亮度公式', () => {
  const grid = (state: 'idle' | 'listening' | 'thinking', t: number, amplitude = 0.6) => {
    const out: number[] = []
    for (let y = -1; y <= 1; y += 0.25)
      for (let x = -1; x <= 1; x += 0.25) out.push(orbIntensity(state, x, y, t, amplitude))
    return out
  }

  it('亮度在 0 到 1 之间', () => {
    for (const state of ['idle', 'listening', 'thinking'] as const)
      for (const t of [0, 1.3, 7.9, 100])
        for (const v of grid(state, t, 1)) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
  })

  it('待命只跟到圆心的距离有关（左右、上下对称）；思考在某些时刻明显不对称，且随时间变', () => {
    expect(orbIntensity('idle', 0.5, 0.2, 3, 0)).toBeCloseTo(orbIntensity('idle', -0.5, -0.2, 3, 0), 10)
    const skew = (t: number) => orbIntensity('thinking', 0.6, 0, t, 0) - orbIntensity('thinking', -0.6, 0, t, 0)
    const values = [0, 0.4, 0.8, 1.2, 1.6, 2].map(skew)
    expect(Math.max(...values.map(Math.abs))).toBeGreaterThan(0.2)
    expect(new Set(values.map((v) => v.toFixed(3))).size).toBeGreaterThan(3)
  })

  it('聆听：音量大整体更亮', () => {
    const sum = (a: number) => grid('listening', 2, a).reduce((total, v) => total + v, 0)
    expect(sum(1)).toBeGreaterThan(sum(0.1) * 1.5)
  })

  it('模拟音量在 0.2 到 1 之间；缩放目标聆听最大、待命最小', () => {
    for (let t = 0; t < 60; t += 0.7) {
      expect(simulatedLevel(t)).toBeGreaterThanOrEqual(0.2)
      expect(simulatedLevel(t)).toBeLessThanOrEqual(1)
    }
    expect(ORB_SCALE.listening).toBeGreaterThan(ORB_SCALE.thinking)
    expect(ORB_SCALE.thinking).toBeGreaterThan(ORB_SCALE.idle)
  })

  it('画布是 role=img，名字由调用方给，状态写在 data-state，边长 = 点数 × 点距 6', () => {
    const html = renderToStaticMarkup(<MatrixOrb state="thinking" label="状态球" cells={10} />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="状态球"')
    expect(html).toContain('data-state="thinking"')
    expect(html).toContain('width:60px')
  })
})
