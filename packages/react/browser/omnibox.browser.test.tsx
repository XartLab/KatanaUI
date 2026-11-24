// SPDX-License-Identifier: MIT
// src/patterns/omnibox + src/lib/proximity-highlight: component screenshots. Text is English on purpose (the sandbox has no CJK glyphs, #202).
import { useRef, useState } from 'react'
import { describe, expect, test } from 'vite-plus/test'
import { page, userEvent } from 'vite-plus/test/browser'
import { Omnibox, useProximityHighlight, type OmniboxItem, type OmniboxLabels } from '../src/index.ts'
import { mount } from './render.tsx'

const labels: OmniboxLabels = {
  title: 'Omnibox',
  placeholder: 'Search symbols, commands, pages, or ask',
  categories: 'Categories',
  recent: 'Recent',
  clearRecent: 'Clear',
  empty: 'No matches',
  showAll: (count, label) => `Show all ${count} ${label}`,
  scopeHeading: (name) => `${name}: actions`,
  removeScope: (name) => `Remove ${name}`,
  hintRun: 'Run',
  hintOpen: 'Open',
  hintViewOptions: 'View options',
  ask: 'Ask',
  footer: { navigate: 'Navigate', select: 'Select', newTab: 'New tab', close: 'Close' },
}
const aapl: OmniboxItem = {
  id: 'AAPL',
  category: 'symbol',
  kind: 'object',
  type: 'symbol',
  label: 'AAPL',
  description: 'Apple Inc.',
  meta: 'NASDAQ',
  preview: <strong>AAPL 189.84 +1.26%</strong>,
}
const items: readonly OmniboxItem[] = [
  aapl,
  {
    id: 'AMD',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AMD',
    description: 'Advanced Micro Devices',
    meta: 'NASDAQ',
  },
  { id: 'backtest', category: 'command', label: 'Run backtest after close' },
  { id: 'book', category: 'command', label: 'Open order book' },
  { id: 'positions', category: 'page', kind: 'page', label: 'Positions', meta: 'Trading' },
]
const actions: readonly OmniboxItem[] = [
  { id: 'chart', label: 'Open chart' },
  { id: 'ticket', label: 'Draft order' },
  { id: 'news', label: 'Show news' },
]
const categories = [
  { id: 'all', label: 'All' },
  { id: 'symbol', label: 'Symbols' },
  { id: 'command', label: 'Commands' },
  { id: 'page', label: 'Pages' },
]

function Story({ scoped }: { scoped?: boolean }) {
  return (
    // 预览卡浮在面板右边 12px 外：给它留出位置，截图框才包得住。
    <div style={{ width: 560, marginRight: 290 }}>
      <Omnibox
        categories={categories}
        debounceMs={0}
        labels={labels}
        recent={scoped ? [] : [aapl]}
        defaultScope={scoped ? aapl : null}
        onQuery={(query, scope) =>
          (scope ? actions : items).filter((item) =>
            `${item.label} ${item.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
          )
        }
        onSelect={() => {}}
        onAsk={() => {}}
      />
    </div>
  )
}

function ProximityList() {
  const ref = useRef<HTMLUListElement>(null)
  const { highlightRef } = useProximityHighlight(ref, { itemSelector: '[data-row]' })
  return (
    <ul ref={ref} style={{ position: 'relative', margin: 0, padding: 6, listStyle: 'none', width: 220 }}>
      <div ref={highlightRef} aria-hidden="true" className="k-proximity-highlight" />
      {['AAPL', 'AMD', 'BTC-USDT', 'TSLA'].map((row) => (
        <li
          key={row}
          data-row=""
          className="k-text-data"
          style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center', padding: '0 8px' }}
        >
          {row}
        </li>
      ))}
    </ul>
  )
}

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    test('omnibox', async () => {
      await page.viewport(1280, 800)
      await mount(<Story />, theme)
      await expect.poll(() => document.querySelectorAll('[data-slot="omnibox-row"]').length).toBeGreaterThan(0)
      // 高亮第一行（最近里的 AAPL）：底色落定、预览卡浮出（停 140ms 后）。
      await expect.poll(() => document.querySelector('[data-slot="omnibox-preview"]') !== null).toBe(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-omnibox`)
      // 作用域态：标签、对它的动作、页签收起。
      await mount(<Story scoped />, theme)
      await expect.poll(() => document.querySelectorAll('[data-slot="omnibox-row"]').length).toBe(3)
      await new Promise((resolve) => setTimeout(resolve, 500))
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-omnibox-scope`)
    })
    test('proximity-highlight', async () => {
      await mount(<ProximityList />, theme)
      await page.getByText('BTC-USDT').hover()
      await expect
        .poll(() => document.querySelector('.k-proximity-highlight')?.getAttribute('data-visible'))
        .toBe('true')
      await new Promise((resolve) => setTimeout(resolve, 600))
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-proximity-highlight`)
    })
  })
}

// 行为：受控页签与「记着的回车」的上下文校验（e2e 里没有办法从外面改 props）。
describe('omnibox behaviour', () => {
  function Controlled({
    onCategoryChange,
    onSelect,
    deferred,
    initialCategory = 'all',
    scoped = false,
  }: {
    onCategoryChange: (id: string) => void
    onSelect: () => void
    deferred?: Array<() => void>
    initialCategory?: string
    scoped?: boolean
  }) {
    const [category, setCategory] = useState(initialCategory)
    return (
      <div style={{ width: 560 }}>
        <button type="button" onClick={() => setCategory('all')}>
          switch
        </button>
        <Omnibox
          categories={categories}
          debounceMs={0}
          labels={labels}
          category={category}
          onCategoryChange={(id) => {
            onCategoryChange(id)
            setCategory(id)
          }}
          defaultScope={scoped ? aapl : null}
          onQuery={(query) =>
            deferred
              ? new Promise((resolve) =>
                  deferred.push(() => resolve(items.filter((item) => item.label.startsWith(query)))),
                )
              : items.filter((item) => item.label.startsWith(query))
          }
          onSelect={onSelect}
        />
      </div>
    )
  }

  test('受控页签：删掉作用域标签回「全部」并通知调用方', async () => {
    const changes: string[] = []
    await mount(
      <Controlled onCategoryChange={(id) => changes.push(id)} onSelect={() => {}} initialCategory="symbol" scoped />,
    )
    await page.getByRole('button', { name: 'Remove AAPL' }).click()
    await expect.poll(() => changes).toEqual(['all'])
    await expect.poll(() => document.querySelectorAll('[data-slot="omnibox-scope"]').length).toBe(0)
    await expect.element(page.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('记着的回车：结果到时页签已被调用方换掉就作废；没换就对第一行生效', async () => {
    for (const switchCategory of [true, false]) {
      const deferred: Array<() => void> = []
      const selected: string[] = []
      await mount(
        <Controlled
          onCategoryChange={() => {}}
          onSelect={() => selected.push('x')}
          deferred={deferred}
          initialCategory="symbol"
        />,
      )
      deferred.splice(0).forEach((resolve) => resolve())
      const input = page.getByRole('combobox')
      await userEvent.click(input)
      await userEvent.type(input, 'AAP')
      await expect.poll(() => deferred.length).toBeGreaterThan(0)
      await userEvent.keyboard('{Enter}')
      if (switchCategory) await page.getByRole('button', { name: 'switch' }).click()
      deferred.splice(0).forEach((resolve) => resolve())
      await new Promise((resolve) => setTimeout(resolve, 300))
      // 对象行回车是变成作用域标签。
      expect(document.querySelectorAll('[data-slot="omnibox-scope"]').length).toBe(switchCategory ? 0 : 1)
    }
  })
})
