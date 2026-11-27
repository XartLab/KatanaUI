// SPDX-License-Identifier: MIT
// src/quotes/rating-panel: the hover readout on the summary gauge (the default state is in quotes.browser.test.tsx).
// Full names here are "rating-panel-hover > <theme> > rating-panel".
import { describe, expect, test } from 'vite-plus/test'
import { page, userEvent } from 'vite-plus/test/browser'
import { RatingPanelUsage } from '../gallery/usage/RatingPanelUsage.tsx'
import { mount } from './render.tsx'

describe('rating-panel-hover', () => {
  for (const theme of ['graphite', 'console'] as const) {
    describe(theme, () => {
      test('rating-panel', async () => {
        await page.viewport(960, 600)
        const frame = await mount(
          <div style={{ width: 560 }}>
            <RatingPanelUsage />
          </div>,
          theme,
        )
        const summary = frame.querySelector<HTMLElement>('[data-gauge="summary"]')!
        await userEvent.hover(summary)
        const readout = summary.querySelector<HTMLElement>('[data-slot="rating-panel-readout"]')!
        await expect.poll(() => getComputedStyle(readout).opacity).toBe('1')
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quotes-rating-panel-hover`)
      })
    })
  }
})
