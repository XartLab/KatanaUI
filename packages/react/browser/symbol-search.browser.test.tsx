// SPDX-License-Identifier: MIT
// src/blocks/symbol-search: component screenshot from the gallery usage demo (query "a", results with highlighted matches).
import { afterAll, beforeAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { SymbolSearchUsage } from '../gallery/usage/SymbolSearchUsage.tsx'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-17T09:00:00'))
})
afterAll(() => vi.useRealTimers())

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    test('symbol-search', async () => {
      await page.viewport(960, 800)
      await mount(<SymbolSearchUsage />, theme)
      // onQuery runs after a 0ms debounce; wait for the rows, then let the segment pill settle.
      await expect.poll(() => document.querySelectorAll('[data-slot="symbol-search-row"]').length).toBeGreaterThan(0)
      await new Promise((r) => setTimeout(r, 250))
      await settled()
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-blocks-symbol-search`)
    })
  })
}
