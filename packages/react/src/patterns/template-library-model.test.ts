// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  expandAllIds,
  filterTemplates,
  findTemplate,
  highlightParts,
  matches,
  type TemplateGroup,
} from './template-library-model.ts'

const t = (id: string, title: string, children?: { id: string; title: string }[]) => ({
  id,
  title,
  body: `${title} body`,
  children: children?.map((child) => ({ ...child, body: '' })),
})

const GROUPS: readonly TemplateGroup[] = [
  {
    id: 'mine',
    title: 'Mine',
    templates: [
      t('m1', 'Momentum strategy', [
        { id: 'm1a', title: 'Momentum 12-1' },
        { id: 'm1b', title: 'Momentum weekly' },
      ]),
      t('m2', 'Backtest config'),
    ],
  },
  {
    id: 'builtin',
    title: 'Built-in',
    readOnly: true,
    templates: [t('b1', 'Mean reversion'), t('b2', 'Prompt: earnings recap')],
  },
]

describe('matches', () => {
  it('不分大小写；空 query 全中', () => {
    expect(matches('Momentum', 'MOM')).toBe(true)
    expect(matches('Momentum', '  ')).toBe(true)
    expect(matches('Momentum', 'rev')).toBe(false)
  })
})

describe('filterTemplates', () => {
  it('空 query 原样返回，count 是全部模板加变体', () => {
    const out = filterTemplates(GROUPS, '')
    expect(out.groups).toBe(GROUPS)
    expect(out.count).toBe(6)
  })
  it('模板自己命中：连变体整个留下', () => {
    const out = filterTemplates(GROUPS, 'strategy')
    expect(out.groups).toHaveLength(1)
    expect(out.groups[0]!.templates.map((x) => x.id)).toEqual(['m1'])
    expect(out.groups[0]!.templates[0]!.children).toHaveLength(2)
  })
  it('只有变体命中：留父模板与命中的变体', () => {
    const out = filterTemplates(GROUPS, '12-1')
    expect(out.groups[0]!.templates.map((x) => [x.id, x.children?.map((c) => c.id)])).toEqual([['m1', ['m1a']]])
    expect(out.count).toBe(1)
  })
  it('没有命中的分组整组去掉；全没中是空', () => {
    expect(filterTemplates(GROUPS, 'mean').groups.map((g) => g.id)).toEqual(['builtin'])
    expect(filterTemplates(GROUPS, 'zzz')).toEqual({ groups: [], count: 0 })
  })
  it('不改原数据', () => {
    filterTemplates(GROUPS, '12-1')
    expect(GROUPS[0]!.templates[0]!.children).toHaveLength(2)
  })
})

describe('highlightParts', () => {
  it('切成中与没中，拼起来等于原文', () => {
    const parts = highlightParts('Momentum momentum', 'mom')
    expect(parts.map((p) => p.text).join('')).toBe('Momentum momentum')
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(['Mom', 'mom'])
  })
  it('空 query 或没中是整段没中', () => {
    expect(highlightParts('abc', '')).toEqual([{ text: 'abc', match: false }])
    expect(highlightParts('abc', 'z')).toEqual([{ text: 'abc', match: false }])
  })
  it('中文照样切', () => {
    expect(highlightParts('动量策略', '策略')).toEqual([
      { text: '动量', match: false },
      { text: '策略', match: true },
    ])
  })
})

describe('findTemplate', () => {
  it('找到模板、变体（带父）与分组；找不到是 null', () => {
    expect(findTemplate(GROUPS, 'm2')?.group.id).toBe('mine')
    const variant = findTemplate(GROUPS, 'm1b')
    expect(variant?.parent?.id).toBe('m1')
    expect(variant?.template.title).toBe('Momentum weekly')
    expect(findTemplate(GROUPS, 'nope')).toBeNull()
    expect(findTemplate(GROUPS, null)).toBeNull()
  })
})

describe('expandAllIds', () => {
  it('分组与带变体的模板', () => {
    expect(expandAllIds(filterTemplates(GROUPS, '').groups as never)).toEqual(['mine', 'm1', 'builtin'])
  })
})
