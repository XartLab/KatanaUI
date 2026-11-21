// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { boardKindOf, limitStatusText, streakSortKey, streakText } from './badge-model.ts'
import { BoardMark } from './board-mark.tsx'
import { cnLabelsZh, type CnLabels } from './labels.ts'
import { LimitStatus } from './limit-status.tsx'
import { StreakBadge } from './streak-badge.tsx'

// #110 第 1 批第 1 项：连板徽标、涨停状态、板块标记。

describe('StreakBadge', () => {
  it('首板 / 2板 / 5天3板 / 一进二，醒目程度随板数升档', () => {
    const html = (streak: Parameters<typeof StreakBadge>[0]['streak'], form?: 'promotion') =>
      renderToStaticMarkup(<StreakBadge streak={streak} form={form} />)
    expect(html(1)).toContain('data-level="1">首板<')
    expect(html(2)).toContain('data-level="2">2板<')
    expect(html(3)).toContain('data-level="3"')
    expect(html(6)).toContain('data-level="4">6板<')
    expect(html({ boards: 3, days: 5 })).toContain('>5天3板<')
    expect(html({ boards: 3, days: 3 })).toContain('>3板<')
    expect(html({ boards: 2, promotedFrom: 1 }, 'promotion')).toContain('>一进二<')
    expect(html({ boards: 3, promotedFrom: 2 }, 'promotion')).toContain('>二进三<')
    expect(html({ boards: 2 }, 'promotion')).toContain('>2板<')
  })

  it('取不到写「—」，原因放 title，不写 0', () => {
    const html = renderToStaticMarkup(<StreakBadge streak={{ boards: null, reason: '没给' }} />)
    expect(html).toContain('data-level="0"')
    expect(html).toContain('title="没给"')
    expect(html).toContain('>—<')
    expect(renderToStaticMarkup(<StreakBadge streak={null} />)).toContain(`title="${cnLabelsZh.streak.unavailable}"`)
  })

  it('文字走 labels：整份换成别的语言', () => {
    const en: CnLabels['streak'] = {
      first: 'First',
      boards: (n) => `${n}B`,
      daysBoards: (d, b) => `${d}d${b}B`,
      promotion: (f, t) => `${f}to${t}`,
      unavailable: 'n/a',
    }
    expect(renderToStaticMarkup(<StreakBadge streak={1} labels={en} />)).toContain('>First<')
    expect(streakText({ boards: 3, days: 5 }, en)).toBe('5d3B')
  })

  it('排序值：板数为主、天数为次，取不到排最后', () => {
    expect(streakSortKey(3)! > streakSortKey(2)!).toBe(true)
    expect(streakSortKey({ boards: 3, days: 5 })! > streakSortKey(3)!).toBe(true)
    expect(streakSortKey(null)).toBeUndefined()
  })
})

describe('LimitStatus', () => {
  it('六种状态各自的字与色调；封单额按万 / 亿写，炸板不带封单额', () => {
    const html = (status: Parameters<typeof LimitStatus>[0]['status']) =>
      renderToStaticMarkup(<LimitStatus status={status} />)
    expect(html('sealed')).toContain('data-status="sealed" data-tone="up"')
    expect(html('broken')).toContain('data-tone="warn"')
    expect(html('limitDown')).toContain('data-tone="down"')
    expect(html('resealed')).toContain('>回封<')
    expect(html('oneWord')).toContain('>一字<')
    expect(html('auctionLimit')).toContain('>竞价涨停<')
    const withAmount = html({ status: 'sealed', sealAmount: 3.2e8 })
    expect(withAmount).toContain('<span class="k-cn-limit-amount">3.20亿</span>')
    expect(withAmount).toContain('title="封单 3.20亿"')
    expect(html({ status: 'broken', sealAmount: 3.2e8 })).not.toContain('k-cn-limit-amount')
    expect(limitStatusText({ status: 'sealed', sealAmount: 3.2e8 }, cnLabelsZh.limitStatus)).toBe('封板 3.20亿')
  })

  it('取不到写「—」，原因放 title', () => {
    const html = renderToStaticMarkup(<LimitStatus status={{ status: null, reason: '盘后快照缺这只' }} />)
    expect(html).toContain('data-unavailable="true"')
    expect(html).toContain('title="盘后快照缺这只"')
    expect(html).toContain('>—<')
  })
})

describe('BoardMark', () => {
  it('默认写涨跌幅限制：创业板与科创板 20cm，北交所 30cm，ST 写 ST，主板不画', () => {
    const html = (kind: Parameters<typeof BoardMark>[0]['kind'], display?: 'cm' | 'name' | 'both') =>
      renderToStaticMarkup(<BoardMark kind={kind} display={display} />)
    expect(html('gem')).toContain('>20cm<')
    expect(html('star')).toContain('>20cm<')
    expect(html('bj')).toContain('>30cm<')
    expect(html('st')).toContain('>ST<')
    expect(html('main')).toBe('')
    expect(html('main', 'name')).toContain('>主板<')
    expect(html('gem', 'both')).toContain('>创业板 20cm<')
    expect(html(null)).toContain('>—<')
  })

  it('从代码与名称判断板块', () => {
    expect(boardKindOf('300750')).toBe('gem')
    expect(boardKindOf('301123')).toBe('gem')
    expect(boardKindOf('688981')).toBe('star')
    expect(boardKindOf('830799')).toBe('bj')
    expect(boardKindOf('920001')).toBe('bj')
    expect(boardKindOf('600519')).toBe('main')
    expect(boardKindOf('000001.SZ')).toBe('main')
    expect(boardKindOf('300750', '*ST某某')).toBe('st')
    expect(boardKindOf('abc')).toBeNull()
  })
})
