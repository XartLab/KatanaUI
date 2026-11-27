// SPDX-License-Identifier: MIT
// #104 对照 Salt 补的四件（Pill、SystemStatus、Link、Panel）：服务端渲染查结构，键盘处理直接调元素上的 onKeyDown（单测环境是 node，没有 DOM）。
import { Children, isValidElement, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vite-plus/test'
import { Link } from './link.tsx'
import { Panel } from './panel.tsx'
import { Pill } from './pill.tsx'
import { SystemStatus, type SystemStatusTone } from './system-status.tsx'

type Props = { 'data-slot'?: string; children?: ReactNode; onKeyDown?: (event: KeyboardEvent) => void }

/** Pill 返回的元素树里 data-slot 等于 slot 的那个元素。 */
function bySlot(node: ReactNode, slot: string): ReactElement<Props> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<Props>(child)) continue
    if (child.props['data-slot'] === slot) return child
    const found = bySlot(child.props.children, slot)
    if (found) return found
  }
  return undefined
}

const keyEvent = (key: string) => {
  const event = { key, defaultPrevented: false, preventDefault: () => (event.defaultPrevented = true) }
  return event as unknown as KeyboardEvent & { defaultPrevented: boolean }
}

describe('Pill', () => {
  it('可点可关：本体与 × 是两个 type=button 的按钮，× 的读屏名是 dismissLabel', () => {
    const html = renderToStaticMarkup(
      <Pill onClick={() => {}} onDismiss={() => {}} dismissLabel="去掉条件 市盈率">
        市盈率
      </Pill>,
    )
    expect(html.match(/<button type="button"/g)).toHaveLength(2)
    expect(html).toContain('data-slot="pill-body"')
    expect(html).toContain('data-slot="pill-dismiss"')
    expect(html).toContain('aria-label="去掉条件 市盈率"')
    expect(html).toContain('data-dismissible="true"')
  })

  it('没有 onClick 也没有 selected 时本体是纯文字，只有 × 是按钮', () => {
    const html = renderToStaticMarkup(
      <Pill onDismiss={() => {}} dismissLabel="移除 BTCUSDT">
        BTCUSDT
      </Pill>,
    )
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('<span data-slot="pill-body" class="k-pill-main">')
  })

  it('selected 是开关：aria-pressed 跟着它，外层标 data-selected', () => {
    const on = renderToStaticMarkup(<Pill selected>提醒</Pill>)
    const off = renderToStaticMarkup(<Pill selected={false}>提醒</Pill>)
    expect(on).toContain('aria-pressed="true"')
    expect(on).toContain('data-selected="true"')
    expect(off).toContain('aria-pressed="false"')
    expect(off).not.toContain('data-selected')
  })

  it('焦点在本体上按 Backspace / Delete 调 onDismiss，别的键不调', () => {
    const onDismiss = vi.fn()
    const body = bySlot(Pill({ children: 'A', onClick: () => {}, onDismiss, dismissLabel: 'x' }), 'pill-body')!
    const backspace = keyEvent('Backspace')
    body.props.onKeyDown!(backspace)
    body.props.onKeyDown!(keyEvent('Delete'))
    body.props.onKeyDown!(keyEvent('Enter'))
    expect(onDismiss).toHaveBeenCalledTimes(2)
    expect(backspace.defaultPrevented).toBe(true)
  })

  it('禁用时键盘也关不掉；调用方的 onKeyDown 先跑，它 preventDefault 了就不关', () => {
    const onDismiss = vi.fn()
    const disabled = bySlot(
      Pill({ children: 'A', onClick: () => {}, onDismiss, dismissLabel: 'x', disabled: true }),
      'pill-body',
    )!
    disabled.props.onKeyDown!(keyEvent('Backspace'))
    const own = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const guarded = bySlot(
      Pill({ children: 'A', onClick: () => {}, onDismiss, dismissLabel: 'x', onKeyDown: own }),
      'pill-body',
    )!
    guarded.props.onKeyDown!(keyEvent('Delete'))
    expect(own).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('禁用时两个按钮都 disabled', () => {
    const html = renderToStaticMarkup(
      <Pill disabled onClick={() => {}} onDismiss={() => {}} dismissLabel="x">
        A
      </Pill>,
    )
    expect(html.match(/disabled=""/g)).toHaveLength(2)
    expect(html).toContain('data-disabled="true"')
  })
})

describe('SystemStatus', () => {
  const render = (tone: SystemStatusTone, extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      <SystemStatus tone={tone} {...extra}>
        消息
      </SystemStatus>,
    )

  it('role 按语气定：warn、danger 是 alert，info、ok、neutral 是 status；传了 role 就用传的', () => {
    expect(render('warn')).toContain('role="alert"')
    expect(render('danger')).toContain('role="alert"')
    for (const tone of ['info', 'ok', 'neutral'] as const) expect(render(tone)).toContain('role="status"')
    expect(render('danger', { role: 'note' })).toContain('role="note"')
  })

  it('四种语气的图标形状各不同（不只靠颜色），neutral 与 info 同形', () => {
    const icon = (tone: SystemStatusTone) => /class="lucide ([^"]+)"/.exec(render(tone))?.[1]
    const shapes = new Set((['info', 'ok', 'warn', 'danger'] as const).map(icon))
    expect(shapes.size).toBe(4)
    expect(icon('neutral')).toBe(icon('info'))
  })

  it('标题、动作、关闭钮都是可选的；关闭钮只在给了 onDismiss 时出现，读屏名是 dismissLabel', () => {
    const bare = render('info')
    expect(bare).not.toContain('k-sysstat-title')
    expect(bare).not.toContain('k-sysstat-actions')
    expect(bare).not.toContain('<button')
    const full = render('warn', {
      title: '数据延迟',
      actions: <a href="#x">详情</a>,
      onDismiss: () => {},
      dismissLabel: '关闭',
    })
    expect(full).toContain('<strong class="k-sysstat-title">数据延迟</strong>')
    expect(full).toContain('<div class="k-sysstat-actions"><a href="#x">详情</a></div>')
    expect(full).toContain('aria-label="关闭"')
    expect(full).toContain('data-dismissible="true"')
  })

  it('icon={null} 不画图标', () => {
    expect(render('info', { icon: null })).not.toContain('k-sysstat-icon')
  })
})

describe('Link', () => {
  it('external：新窗口打开、rel 防 opener，末尾外链图标 aria-hidden，读屏另读 externalLabel', () => {
    const html = renderToStaticMarkup(
      <Link href="https://example.com" external externalLabel="（在新窗口打开）">
        原文
      </Link>,
    )
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('<span class="sr-only">（在新窗口打开）</span>')
  })

  it('不是 external 时不加 target、不加图标；调用方给的 target、rel 原样用', () => {
    const plain = renderToStaticMarkup(<Link href="#a">行业资金流</Link>)
    expect(plain).not.toContain('target=')
    expect(plain).not.toContain('<svg')
    const own = renderToStaticMarkup(
      <Link href="#a" external target="news" rel="noopener">
        x
      </Link>,
    )
    expect(own).toContain('target="news"')
    expect(own).toContain('rel="noopener"')
  })

  it('asChild 把皮肤交给子元素，不再包一层 a', () => {
    const html = renderToStaticMarkup(
      <Link asChild tone="secondary">
        <button type="button">数据说明</button>
      </Link>,
    )
    expect(html).toMatch(/^<button[^>]*class="k-link"/)
    expect(html).toContain('data-tone="secondary"')
    expect(html).not.toContain('<a')
  })
})

describe('Panel', () => {
  it('三档底色各读 container 的一档，占满高度、内容自己滚', () => {
    const fill = (variant?: 'primary' | 'secondary' | 'tertiary') =>
      renderToStaticMarkup(<Panel variant={variant}>x</Panel>)
    expect(fill()).toContain('bg-(--k-container-primary-background)')
    expect(fill('secondary')).toContain('bg-(--k-container-secondary-background)')
    expect(fill('tertiary')).toContain('bg-(--k-container-tertiary-background)')
    expect(fill()).toContain('h-full')
    expect(fill()).toContain('overflow-auto')
  })
})
