// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RuleBuilder } from './rule-builder.tsx'
import type { RuleBuilderLabels } from './rule-labels.ts'
import { ruleToText, validateRule, type Rule, type RuleSchema, type RuleTextTemplates } from './rule-model.ts'

const SCHEMA: RuleSchema = {
  fields: [
    {
      key: 'market',
      label: '市场',
      type: 'enum',
      options: [
        { value: 'cn', label: 'A 股' },
        { value: 'hk', label: '港股' },
      ],
    },
    { key: 'turnover', label: '成交额', group: '流动性', type: 'number', unit: '亿', min: 0 },
    { key: 'rate', label: '换手率', group: '流动性', type: 'number', unit: '%', min: 0, max: 100 },
    { key: 'close', label: '收盘价', type: 'number', min: 0 },
    { key: 'ma20', label: 'MA20', type: 'number', min: 0 },
  ],
  operators: {
    number: [
      { value: 'gt', label: '>', input: 'number', allowRef: true },
      { value: 'between', label: '区间', input: 'range' },
    ],
    enum: [
      { value: 'is', label: '是', input: 'option' },
      { value: 'in', label: '任一', input: 'list' },
    ],
    text: [{ value: 'contains', label: '包含', input: 'text' }],
  },
  actions: [
    {
      kind: 'alert',
      label: '发告警',
      params: [{ key: 'channel', label: '渠道', input: 'option', options: [{ value: 'push', label: '推送' }] }],
    },
    {
      kind: 'draft',
      label: '生成下单草稿',
      draft: true,
      params: [
        {
          key: 'side',
          label: '方向',
          input: 'option',
          options: [
            { value: 'buy', label: '买' },
            { value: 'sell', label: '卖' },
          ],
        },
        { key: 'quantity', label: '数量', input: 'number', unit: '手', min: 1, max: 100 },
      ],
    },
  ],
}

const TEMPLATES: RuleTextTemplates = {
  when: (body) => `当 ${body}`,
  and: ' 且 ',
  or: ' 或 ',
  group: (inner) => `（${inner}）`,
  condition: (field, operator, value) => `${field} ${operator} ${value}`,
  number: (value, unit) => (unit === undefined ? `${value}` : `${value} ${unit}`),
  range: (min, max) => `${min} 到 ${max}`,
  list: (labels) => labels.join('、'),
  blank: '…',
  empty: '任何时候',
  ifTrue: (actions) => `那么 ${actions}`,
  ifFalse: (actions) => `否则 ${actions}`,
  action: (label, params) => [label, ...params.map((param) => param.text)].join(' '),
  actionJoin: '，并',
  join: '，',
}

const LABELS: RuleBuilderLabels = {
  when: '当',
  actions: '那么',
  ifTrue: '若为真',
  ifFalse: '若为假',
  readback: '规则回读',
  mode: { and: '且', or: '或' },
  switchMode: (current, next) => `用「${current}」组合，切到「${next}」`,
  group: (n, mode) => `组 · ${n} 条 · ${mode}`,
  rootGroup: (n, mode) => `条件 · ${n} 条 · ${mode}`,
  addCondition: '加条件',
  addGroup: '加组',
  addAction: '加动作',
  field: '字段',
  operator: '运算符',
  value: '值',
  min: '下限',
  max: '上限',
  action: '动作',
  rangeTo: '到',
  refToggle: '对比另一个字段',
  refField: '对比的字段',
  refPlaceholder: '选字段',
  valuePlaceholder: '选一个',
  addValue: '加',
  searchValue: '搜索',
  noValue: '没有匹配',
  removeValue: (label) => `移除 ${label}`,
  locked: '已锁定',
  valueCleared: '值已清空',
  draft: '仅草稿',
  handle: (summary) => `挪动：${summary}`,
  remove: (summary) => `删除：${summary}`,
  removeBlocked: (summary) => `不能删 ${summary}：含锁定条件`,
  hint: 'Alt+↑↓ 挪，Delete 删',
  undo: '撤销',
  redo: '重做',
  issueCount: (n) => `${n} 个问题`,
  issueAction: (n) => `${n} 个问题：全部显示并跳到第一个`,
  valid: '可保存',
  issue: (issue) => (issue.code === 'out-of-range' ? `要在 ${issue.min} 到 ${issue.max} 之间` : '要填'),
  added: (s) => `已加 ${s}`,
  removed: (s) => `已删 ${s}`,
  moved: (s, p, t) => `${s} 挪到 ${p}/${t}`,
  modeChanged: (m) => `现在用「${m}」`,
  undone: '已撤销',
  redone: '已重做',
  dragCancelled: '已取消',
}

const RULE: Rule = {
  when: {
    type: 'group',
    id: 'root',
    mode: 'and',
    children: [
      {
        type: 'condition',
        id: 'market',
        field: 'market',
        op: 'is',
        value: { kind: 'text', value: 'cn' },
        locked: true,
      },
      { type: 'condition', id: 'cross', field: 'close', op: 'gt', value: { kind: 'ref', field: 'ma20' } },
      {
        type: 'group',
        id: 'liq',
        mode: 'or',
        children: [
          { type: 'condition', id: 'turnover', field: 'turnover', op: 'gt', value: { kind: 'number', value: 5 } },
          { type: 'condition', id: 'rate', field: 'rate', op: 'gt', value: { kind: 'number', value: 130 } },
        ],
      },
    ],
  },
  ifTrue: [
    { id: 'a1', kind: 'alert', params: { channel: 'push' } },
    { id: 'a2', kind: 'draft', params: { side: 'buy', quantity: 10 } },
  ],
  ifFalse: [],
}

const html = (rule: Rule, extra: Partial<Parameters<typeof RuleBuilder>[0]> = {}) =>
  renderToStaticMarkup(
    <RuleBuilder schema={SCHEMA} defaultValue={rule} templates={TEMPLATES} labels={LABELS} {...extra} />,
  )

describe('RuleBuilder 的结构', () => {
  const markup = html(RULE)

  it('顶行回读整棵规则；WHEN 与 THEN 各一段，THEN 有若为真 / 若为假', () => {
    const sentence = ruleToText(RULE, SCHEMA, TEMPLATES).replaceAll('>', '&gt;')
    // 回读那行不能给 <p> 加名字：名字在外面一个组上（隐藏文字 + aria-labelledby）。
    expect(markup).toMatch(/role="group" aria-labelledby="([^"]+)"><span id="\1" class="k-rb-sr">规则回读<\/span>/)
    expect(markup).toContain(`data-slot="rule-text">${sentence}</p>`)
    expect(sentence).toBe(
      '当 市场 是 A 股 且 收盘价 &gt; MA20 且 （成交额 &gt; 5 亿 或 换手率 &gt; 130 %），那么 发告警 推送，并生成下单草稿 买 10 手',
    )
    expect(markup).toContain('>当</h4>')
    expect(markup).toContain('>那么</h4>')
    expect(markup).toContain('若为真')
    expect(markup).toContain('若为假')
  })

  it('树：根组与嵌套组各一个且 / 或标签，标签名写当前与下一个；嵌套组带名字', () => {
    expect(markup.match(/data-slot="rule-mode"/g)).toHaveLength(2)
    expect(markup).toContain('aria-label="用「且」组合，切到「或」"')
    expect(markup).toContain('aria-label="用「或」组合，切到「且」"')
    expect(markup).toContain('role="group" aria-label="组 · 2 条 · 或"')
  })

  it('组的名字带组合方式；根组也有名字（读屏知道当前是 And 还是 Or）', () => {
    expect(markup).toContain('role="group" aria-label="条件 · 4 条 · 且"')
    // 切成「或」后名字跟着变。
    const flipped: Rule = { ...RULE, when: { ...RULE.when, mode: 'or' } }
    expect(html(flipped)).toContain('aria-label="条件 · 4 条 · 或"')
  })

  it('含锁定条件的组：删除钮 aria-disabled，名字与 title 写明原因；别的组的删除钮照常', () => {
    const guarded: Rule = {
      ...RULE,
      when: {
        ...RULE.when,
        children: [
          {
            type: 'group',
            id: 'guard',
            mode: 'and',
            children: [RULE.when.children[0]!],
          },
          RULE.when.children[2]!,
        ],
      },
    }
    const out = html(guarded)
    expect(out).toContain(
      'aria-disabled="true" aria-label="不能删 组 · 1 条 · 且：含锁定条件" title="不能删 组 · 1 条 · 且：含锁定条件"',
    )
    expect(out.match(/data-blocked=""/g)).toHaveLength(1)
    // 没有锁定条件的 liq 组：照常。
    expect(out).toContain('aria-label="删除：组 · 2 条 · 或"')
    expect(html(RULE)).not.toContain('data-blocked')
  })

  it('锁定条件：锁图标，没有把手与删除钮；别的行都有', () => {
    expect(markup).toContain('role="img" aria-label="已锁定"')
    // 把手：条件 3（cross、turnover、rate）+ 组 1 + 动作 2 = 6；锁定的 market 没有。
    expect(markup.match(/data-slot="rule-handle"/g)).toHaveLength(6)
    expect(markup.match(/data-slot="rule-remove"/g)).toHaveLength(6)
  })

  it('动作带多个参数：每个参数一个格子，data-key 是参数的键；连接词与单位照模板与定义', () => {
    expect(markup).toContain('data-part="param" data-key="channel"')
    expect(markup).toContain('data-part="param" data-key="side"')
    expect(markup).toContain('data-part="param" data-key="quantity"')
    expect(markup).toContain('aria-label="数量"')
  })

  it('草稿动作带草稿标；THEN 是否出现看有没有动作定义', () => {
    expect(markup.match(/data-slot="rule-draft"/g)).toHaveLength(1)
    const bare = html(RULE, { schema: { ...SCHEMA, actions: undefined } })
    expect(bare).not.toContain('那么</h4>')
  })

  it('默认只显示改过的行的问题；showIssues=all 全显，并且与 validateRule 一致', () => {
    expect(markup).not.toContain('data-slot="rule-issue"')
    const all = html(RULE, { showIssues: 'all' })
    expect(validateRule(RULE, SCHEMA)).toEqual([{ id: 'rate', code: 'out-of-range', part: 'value', min: 0, max: 100 }])
    expect(all).toContain('要在 0 到 100 之间')
    // 状态是按钮，名字说明点了会怎样。
    expect(all).toContain('aria-label="1 个问题：全部显示并跳到第一个"')
    // 红框的行、出错的格子 aria-invalid 并接到那句原因。
    expect(all.match(/data-invalid=""/g)).toHaveLength(1)
    const issueId = /id="([^"]+)" class="k-rb-issue"/.exec(all)![1]!
    expect(all).toContain(`aria-describedby="${issueId}"`)
    expect(all).toContain('1 个问题')
    // 没有问题时状态只是文字，不是按钮。
    const fine = html({ ...RULE, when: { ...RULE.when, children: RULE.when.children.slice(0, 2) } })
    expect(fine).toContain('可保存')
    expect(fine).not.toContain('class="k-rb-status" data-slot="rule-status" data-tone="warn"')
  })

  it('空组在回读里留占位，不悄悄消失', () => {
    const withEmpty: Rule = {
      ...RULE,
      when: { ...RULE.when, children: [RULE.when.children[0]!, { type: 'group', id: 'g', mode: 'or', children: [] }] },
    }
    expect(html(withEmpty)).toContain('当 市场 是 A 股 且 …，那么')
  })

  it('WHEN / THEN 是 role=group 不是 region：一页几份同名也不重名 landmark；标题层级可调', () => {
    expect(markup).not.toContain('<section class="k-rb-part"')
    expect(markup.match(/class="k-rb-part"[^>]*role="group" aria-labelledby/g)).toHaveLength(2)
    expect(markup).toContain('>当</h4>')
    expect(markup).toContain('>若为真</h5>')
    const level2 = html(RULE, { headingLevel: 2 })
    expect(level2).toContain('>当</h2>')
    expect(level2).toContain('>那么</h2>')
    expect(level2).toContain('>若为真</h3>')
    expect(level2).not.toContain('</h4>')
  })

  it('JSON → 件：从 JSON 来回一趟再画，画出同样的结构', () => {
    const copy = JSON.parse(JSON.stringify(RULE)) as Rule
    expect(html(copy)).toBe(markup)
  })
})
