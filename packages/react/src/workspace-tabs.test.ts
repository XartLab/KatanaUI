// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { visibleTabs } from './blocks/workspace-tabs/workspace-tabs-model.ts'

describe('visibleTabs：放不下的标签收进「更多」，当前标签始终可见', () => {
  const widths = [100, 100, 100, 100, 100]
  it('放得下就全留', () => {
    expect(visibleTabs(widths, 0, 500, 40)).toEqual([0, 1, 2, 3, 4])
  })
  it('放不下：前面的尽量多放，给「更多」留 40', () => {
    expect(visibleTabs(widths, 0, 350, 40)).toEqual([0, 1, 2])
  })
  it('当前标签被收起时换掉最后一个可见的', () => {
    expect(visibleTabs(widths, 4, 350, 40)).toEqual([0, 1, 4])
    expect(visibleTabs(widths, 3, 350, 40)).toEqual([0, 1, 3])
  })
  it('再窄也至少留当前标签', () => {
    expect(visibleTabs(widths, 2, 90, 40)).toEqual([2])
    expect(visibleTabs(widths, 4, 10, 40)).toEqual([4])
  })
})
