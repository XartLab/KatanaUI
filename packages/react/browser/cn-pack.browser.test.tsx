// SPDX-License-Identifier: MIT
// A-share panel pieces (#11): one screenshot per component, from the gallery usage demos (demo data). Test name = file name.
import { describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { BoardStrengthRankUsage } from '../gallery/usage/BoardStrengthRankUsage.tsx'
import { NetBuyBarUsage } from '../gallery/usage/NetBuyBarUsage.tsx'
import { ReasonGroupListUsage } from '../gallery/usage/ReasonGroupListUsage.tsx'
import { SentimentGaugeUsage } from '../gallery/usage/SentimentGaugeUsage.tsx'
import { ThemeHeatMatrixUsage } from '../gallery/usage/ThemeHeatMatrixUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'sentiment-gauge': <SentimentGaugeUsage />,
  'theme-heat-matrix': <ThemeHeatMatrixUsage />,
  'reason-group-list': <ReasonGroupListUsage />,
  'board-strength-rank': <BoardStrengthRankUsage />,
  'net-buy-bar': <NetBuyBarUsage />,
}

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(960, 1200)
        await mount(<div style={{ width: 720, display: 'flex', flexDirection: 'column', gap: 8 }}>{node}</div>, theme)
        await new Promise((r) => setTimeout(r, 250)) // let measuring and transitions finish
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-cn-${name}`)
      })
    }
  })
}
