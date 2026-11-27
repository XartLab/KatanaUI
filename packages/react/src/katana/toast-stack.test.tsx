// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vite-plus/test'
import { ToastStack, type ToastStackItem } from './toast-stack.tsx'

// 服务端渲染的结构：区域与读屏名、每条的关闭钮与动作钮的名字、顺序。行为（展开、拖动、计时）在 e2e/toast-stack.spec.ts。
const labels = { region: 'Notifications', close: 'Dismiss' }
const items: ToastStackItem[] = [
  { id: 'a', title: 'First' },
  { id: 'b', title: 'Second', action: { label: 'Undo', result: { title: 'Restored' } } },
]

describe('ToastStack 结构', () => {
  const html = renderToStaticMarkup(<ToastStack items={items} labels={labels} />)
  test('区域是 role=region 的 live region，名字由调用方传', () => {
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('aria-label="Notifications"')
  })
  test('每条有关闭钮，有 action 的多一个动作钮，名字都由调用方传', () => {
    expect(html.match(/aria-label="Dismiss"/g)).toHaveLength(2)
    expect(html.match(/data-slot="toast-action"/g)).toHaveLength(1)
    expect(html).toContain('>Undo</button>')
  })
  test('下面的角：DOM 从旧到新；上面的角：从新到旧（Tab 次序跟视觉一致）', () => {
    expect(html.indexOf('First')).toBeLessThan(html.indexOf('Second'))
    const top = renderToStaticMarkup(<ToastStack items={items} labels={labels} position="top-right" />)
    expect(top.indexOf('Second')).toBeLessThan(top.indexOf('First'))
  })
  test('超过 max 只画最新的', () => {
    const many = renderToStaticMarkup(<ToastStack items={items} labels={labels} max={1} />)
    expect(many).toContain('Second')
    expect(many).not.toContain('First')
  })
  test('inline 不固定在窗口一角', () => {
    const inline = renderToStaticMarkup(<ToastStack items={items} labels={labels} inline />)
    expect(inline).toMatch(/class="[^"]*\brelative\b/)
    expect(inline).not.toMatch(/class="[^"]*\bfixed\b/)
  })
})
