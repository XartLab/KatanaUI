// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { countCauses, flattenCauses, isRootCause, litPath, moveCause, type CauseFailure } from './root-cause-model.ts'
import { RootCauseTree, type RootCauseTreeLabels } from './root-cause-tree.tsx'

const FAILURE: CauseFailure = {
  id: 'f',
  title: '日 K 缺 3 根',
  detail: '3 / 240',
  children: [
    { id: 'src', title: '数据源返回空', status: 'ruledOut' },
    {
      id: 'job',
      title: '回补没跑',
      status: 'confirmed',
      gate: 'and',
      children: [
        { id: 'limit', title: '被限流跳过', status: 'confirmed', evidence: { kind: '日志', content: '429' } },
        { id: 'retry', title: '重试次数用完', status: 'checking' },
      ],
    },
    { id: 'cal', title: '交易日历错', status: 'open' },
  ],
}

const LABELS: RootCauseTreeLabels = {
  status: { open: '待查', checking: '在查', ruledOut: '已排除', confirmed: '已确认' },
  gate: { or: '任一', and: '同时' },
  rootCause: '根因',
  counts: (c) => `已排除 ${c.ruledOut} · 已确认 ${c.confirmed}`,
  evidence: '证据',
  pick: '选一行看证据',
  noEvidence: '还没有证据',
  fix: '修复',
  retry: '从这里重跑',
}

describe('排查树的纯逻辑', () => {
  it('前序展开：故障在前，层级与父行对', () => {
    const rows = flattenCauses(FAILURE)
    expect(rows.map((row) => row.id)).toEqual(['f', 'src', 'job', 'limit', 'retry', 'cal'])
    expect(rows.find((row) => row.id === 'limit')).toMatchObject({ depth: 2, parentId: 'job' })
    expect(rows[0]).toMatchObject({ depth: 0, parentId: null, cause: null, hasChildren: true })
  })

  it('根因是已确认的叶子；点亮从根因到故障的一条路', () => {
    expect(isRootCause(FAILURE.children[1]!)).toBe(false)
    expect(isRootCause(FAILURE.children[1]!.children![0]!)).toBe(true)
    expect([...litPath(FAILURE)].toSorted()).toEqual(['f', 'job', 'limit'])
    expect(litPath({ id: 'x', title: 'x', children: [{ id: 'a', title: 'a' }] }).size).toBe(0)
  })

  it('计数不含故障行，没写状态算待查', () => {
    expect(countCauses(FAILURE)).toEqual({ open: 1, checking: 1, ruledOut: 1, confirmed: 2 })
  })

  it('键盘：↑↓ 上下、← 父、→ 第一个子、Home / End；别的键不管', () => {
    const rows = flattenCauses(FAILURE)
    expect(moveCause(rows, 'src', 'ArrowDown')).toBe('job')
    expect(moveCause(rows, 'f', 'ArrowUp')).toBe('f')
    expect(moveCause(rows, 'limit', 'ArrowLeft')).toBe('job')
    expect(moveCause(rows, 'f', 'ArrowLeft')).toBe('f')
    expect(moveCause(rows, 'job', 'ArrowRight')).toBe('limit')
    expect(moveCause(rows, 'cal', 'ArrowRight')).toBe('cal')
    expect(moveCause(rows, 'retry', 'Home')).toBe('f')
    expect(moveCause(rows, 'src', 'End')).toBe('cal')
    expect(moveCause(rows, 'src', 'a')).toBeUndefined()
  })
})

describe('排查树的渲染', () => {
  it('一个 Tab 停点；每行是带层级的 treeitem；点亮与根因写在 data 上', () => {
    const html = renderToStaticMarkup(
      <RootCauseTree failure={FAILURE} title="排查" label="示例排查树" labels={LABELS} />,
    )
    expect(html).toContain('role="tree"')
    expect(html.match(/role="treeitem"/g)).toHaveLength(6)
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toMatch(/data-id="limit"[^>]*data-root=""[^>]*data-lit=""/)
    expect(html).toContain('aria-level="3"')
    expect(html).toContain('选一行看证据')
  })

  it('打开根因：证据原文与动作按钮出现；没有 onAction 不出按钮', () => {
    const withAction = renderToStaticMarkup(
      <RootCauseTree
        failure={FAILURE}
        title="排查"
        label="l"
        labels={LABELS}
        defaultOpenId="limit"
        onAction={() => {}}
      />,
    )
    expect(withAction).toContain('<pre')
    expect(withAction).toContain('从这里重跑')
    const readOnly = renderToStaticMarkup(
      <RootCauseTree failure={FAILURE} title="排查" label="l" labels={LABELS} defaultOpenId="limit" />,
    )
    expect(readOnly).not.toContain('从这里重跑')
  })
})
