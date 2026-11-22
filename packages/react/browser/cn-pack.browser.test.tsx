// SPDX-License-Identifier: MIT
// A-share panel pieces (#11): one screenshot per component, from the gallery usage demos (demo data). Test name = file name.
// A 股件按 A 股的涨跌约定截：根上 data-updown="cn"（红涨绿跌，评审 #78），这个文件跑完还原。
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { BoardStrengthRankUsage } from '../gallery/usage/BoardStrengthRankUsage.tsx'
import { NetBuyBarUsage } from '../gallery/usage/NetBuyBarUsage.tsx'
import { ReasonGroupListUsage } from '../gallery/usage/ReasonGroupListUsage.tsx'
import { SentimentCycleUsage } from '../gallery/usage/SentimentCycleUsage.tsx'
import { ThemeHeatMatrixUsage } from '../gallery/usage/ThemeHeatMatrixUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'sentiment-cycle': <SentimentCycleUsage />,
  'theme-heat-matrix': <ThemeHeatMatrixUsage />,
  'reason-group-list': <ReasonGroupListUsage />,
  'board-strength-rank': <BoardStrengthRankUsage />,
  'net-buy-bar': <NetBuyBarUsage />,
}

beforeAll(() => {
  document.documentElement.dataset.updown = 'cn'
})
afterAll(() => {
  delete document.documentElement.dataset.updown
})

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
