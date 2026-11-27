// SPDX-License-Identifier: MIT
// src/quotes/symbol-note: the popup open on top of the page (native popover in the top layer), then in edit mode.
// The default (closed) state is in quotes.browser.test.tsx; full names here are "symbol-note-open > <theme> > symbol-note".
import { describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { SymbolNoteUsage } from '../gallery/usage/SymbolNoteUsage.tsx'
import { mount } from './render.tsx'

describe('symbol-note-open', () => {
  for (const theme of ['graphite', 'console'] as const) {
    describe(theme, () => {
      test('symbol-note', async () => {
        await page.viewport(640, 400)
        // A fixed box under the icon so the frame screenshot takes in the popup below it.
        const frame = await mount(
          <div style={{ width: 340, height: 200 }}>
            <SymbolNoteUsage />
          </div>,
          theme,
        )
        frame.querySelector<HTMLButtonElement>('[data-slot="symbol-note-trigger"]')!.click()
        const pop = frame.querySelector<HTMLElement>('[data-slot="symbol-note-popup"]')!
        await expect.poll(() => pop.matches(':popover-open')).toBe(true)
        await new Promise((r) => setTimeout(r, 400)) // let the fade-in finish
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quotes-symbol-note-open`)

        frame.querySelector<HTMLButtonElement>('[data-slot="symbol-note-edit"]')!.click()
        await expect.poll(() => document.activeElement?.getAttribute('data-slot')).toBe('symbol-note-field')
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quotes-symbol-note-editing`)
      })
    })
  }
})
