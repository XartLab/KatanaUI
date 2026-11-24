// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  carryValue,
  conditionCount,
  insertAction,
  insertNode,
  locate,
  moveAction,
  moveNode,
  removeAction,
  removeNode,
  ruleToText,
  setMode,
  slotToIndex,
  stepNode,
  updateNode,
  validateRule,
  type Rule,
  type RuleCondition,
  type RuleSchema,
  type RuleTextTemplates,
} from './rule-model.ts'

// 贴量化的 schema：市场、所属板块、成交额、换手率、收盘价、MA20、RSI(14)；动作有发告警、加入自选、交给 Agent、生成下单草稿。
const SCHEMA: RuleSchema = {
  fields: [
    {
      key: 'market',
      label: '市场',
      group: '范围',
      type: 'enum',
      options: [
        { value: 'cn', label: 'A 股' },
        { value: 'hk', label: '港股' },
      ],
    },
    {
      key: 'sector',
      label: '所属板块',
      group: '范围',
      type: 'enum',
      options: [
        { value: 'bank', label: '银行' },
        { value: 'chip', label: '半导体' },
      ],
    },
    { key: 'turnover', label: '成交额', group: '流动性', type: 'number', unit: '亿', min: 0 },
    { key: 'rate', label: '换手率', group: '流动性', type: 'number', unit: '%', min: 0, max: 100 },
    { key: 'close', label: '收盘价', group: '价格', type: 'number', min: 0 },
    { key: 'ma20', label: 'MA20', group: '价格', type: 'number', min: 0 },
    { key: 'rsi', label: 'RSI(14)', group: '指标', type: 'number', min: 0, max: 100 },
  ],
  operators: {
    number: [
      { value: 'gt', label: '>', input: 'number', allowRef: true },
      { value: 'between', label: '区间', input: 'range' },
      { value: 'cross-up', label: '上穿', input: 'number', allowRef: true },
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
      param: {
        label: '渠道',
        input: 'option',
        connector: '到',
        options: [
          { value: 'push', label: '推送' },
          { value: 'mail', label: '邮件' },
        ],
      },
    },
    { kind: 'watch', label: '加入自选' },
    { kind: 'draft', label: '生成下单草稿', draft: true, param: { label: '手数', input: 'number', min: 1, max: 100 } },
  ],
}

const TEMPLATES: RuleTextTemplates = {
  when: (body) => `当 ${body}`,
  and: ' 且 ',
  or: ' 或 ',
  group: (inner) => `（${inner}）`,
  condition: (field, operator, value) => `${field} ${operator} ${value}`,
  number: (value, unit) => (unit === undefined ? `${value}` : unit === '%' ? `${value}%` : `${value} ${unit}`),
  range: (min, max) => `${min} 到 ${max}`,
  list: (labels) => labels.join('、'),
  blank: '…',
  empty: '任何时候',
  ifTrue: (actions) => `那么 ${actions}`,
  ifFalse: (actions) => `否则 ${actions}`,
  action: (label, param, connector) => (param === undefined ? label : `${label}${connector ?? ''} ${param}`),
  actionJoin: '，并',
  join: '，',
}

const cond = (id: string, field: string, op: string, value: RuleCondition['value'], locked?: true): RuleCondition => ({
  type: 'condition',
  id,
  field,
  op,
  value,
  ...(locked ? { locked } : {}),
})

/** 判据 1 的那棵树：锁定条件 + 一条 + 一组（组内 OR 两条）。 */
const RULE: Rule = {
  when: {
    type: 'group',
    id: 'root',
    mode: 'and',
    children: [
      cond('market', 'market', 'is', { kind: 'text', value: 'cn' }, true),
      cond('cross', 'close', 'cross-up', { kind: 'ref', field: 'ma20' }),
      {
        type: 'group',
        id: 'liq',
        mode: 'or',
        children: [
          cond('turnover', 'turnover', 'gt', { kind: 'number', value: 5 }),
          cond('rate', 'rate', 'gt', { kind: 'number', value: 3 }),
        ],
      },
    ],
  },
  ifTrue: [{ id: 'alert', kind: 'alert', param: 'push' }],
  ifFalse: [{ id: 'watch', kind: 'watch' }],
}

const ids = (rule: Rule, group = 'root') => {
  const found = group === 'root' ? rule.when : (locate(rule.when, group)!.node as typeof rule.when)
  return found.children.map((node) => node.id)
}

describe('回读（判据 1、2）', () => {
  it('锁定条件 + 一条 + 一组：嵌套的组加括号，组内用「或」，值带单位', () => {
    expect(ruleToText(RULE, SCHEMA, TEMPLATES)).toBe(
      '当 市场 是 A 股 且 收盘价 上穿 MA20 且 （成交额 > 5 亿 或 换手率 > 3%），那么 发告警到 推送，否则 加入自选',
    )
  })

  it('切组的 AND / OR：回读与 JSON 跟着变，原对象不动', () => {
    const next = setMode(RULE, 'liq', 'and')
    expect(next.when.children[2]).toMatchObject({ mode: 'and' })
    expect(ruleToText(next, SCHEMA, TEMPLATES)).toContain('（成交额 > 5 亿 且 换手率 > 3%）')
    expect(JSON.stringify(next)).not.toBe(JSON.stringify(RULE))
    expect(RULE.when.children[2]).toMatchObject({ mode: 'or' })
    // 切根组。
    expect(ruleToText(setMode(RULE, 'root', 'or'), SCHEMA, TEMPLATES)).toMatch(/^当 市场 是 A 股 或 收盘价/)
  })

  it('区间、多选、没填的值、空规则、没有参数的动作', () => {
    const rule: Rule = {
      when: {
        type: 'group',
        id: 'root',
        mode: 'and',
        children: [
          cond('a', 'rsi', 'between', { kind: 'range', min: 30, max: null }),
          cond('b', 'sector', 'in', { kind: 'list', values: ['bank', 'chip'] }),
          cond('c', 'turnover', 'gt', { kind: 'number', value: null }),
        ],
      },
      ifTrue: [],
      ifFalse: [],
    }
    expect(ruleToText(rule, SCHEMA, TEMPLATES)).toBe('当 RSI(14) 区间 30 到 … 且 所属板块 任一 银行、半导体 且 成交额 > …')
    expect(ruleToText({ ...rule, when: { ...rule.when, children: [] } }, SCHEMA, TEMPLATES)).toBe('当 任何时候')
  })
})

describe('同组换序（判据 3）', () => {
  it('在组里挪：锁定的不能挪，别人也挪不到锁定的前面', () => {
    expect(ids(RULE)).toEqual(['market', 'cross', 'liq'])
    expect(stepNode(RULE, 'market', 1)).toBeNull()
    expect(stepNode(RULE, 'cross', -1)).toBeNull()
    expect(ids(stepNode(RULE, 'cross', 1)!)).toEqual(['market', 'liq', 'cross'])
    expect(moveNode(RULE, 'liq', 0)).not.toBeNull()
    expect(ids(moveNode(RULE, 'liq', 0)!)).toEqual(['market', 'liq', 'cross'])
  })

  it('跨组不允许：挪动只在自己所在的组里，组外的下标被夹进组内', () => {
    expect(ids(stepNode(RULE, 'turnover', -1) ?? RULE, 'liq')).toEqual(['turnover', 'rate'])
    const moved = stepNode(RULE, 'turnover', 1)!
    expect(ids(moved, 'liq')).toEqual(['rate', 'turnover'])
    expect(ids(moved)).toEqual(['market', 'cross', 'liq'])
    // 夹到组的末尾，而不是跑到根组里。
    expect(ids(moveNode(RULE, 'turnover', 99)!, 'liq')).toEqual(['rate', 'turnover'])
    expect(ids(moveNode(RULE, 'turnover', 99)!)).toEqual(['market', 'cross', 'liq'])
  })

  it('拖动落点：第 slot 条缝换算成挪走自己之后的下标', () => {
    expect(slotToIndex(0, 0)).toBe(0)
    expect(slotToIndex(0, 1)).toBe(0)
    expect(slotToIndex(0, 3)).toBe(2)
    expect(slotToIndex(2, 0)).toBe(0)
  })

  it('动作只在自己那一段里挪', () => {
    const rule = insertAction(RULE, 'ifTrue', { id: 'a2', kind: 'watch' })
    expect(moveAction(rule, 'a2', 0)!.ifTrue.map((a) => a.id)).toEqual(['a2', 'alert'])
    expect(moveAction(rule, 'alert', 5)!.ifTrue.map((a) => a.id)).toEqual(['a2', 'alert'])
    expect(moveAction(rule, 'alert', 0)).toBeNull()
    expect(rule.ifFalse.map((a) => a.id)).toEqual(['watch'])
  })
})

describe('增删与锁定、层数', () => {
  it('锁定条件删不掉，也改不了字段与运算符，只改值', () => {
    expect(removeNode(RULE, 'market')).toBeNull()
    const changed = updateNode(RULE, 'market', (node) => ({
      ...(node as RuleCondition),
      field: 'sector',
      op: 'in',
      value: { kind: 'text', value: 'hk' },
    }))
    expect(changed.when.children[0]).toMatchObject({ field: 'market', op: 'is', value: { kind: 'text', value: 'hk' } })
  })

  it('删一行：焦点给前一个，没有就后一个；删光后组为空', () => {
    expect(removeNode(RULE, 'cross')!.focus).toBe('market')
    const left = removeNode(RULE, 'turnover')!
    expect(left.focus).toBe('rate')
    expect(ids(removeNode(left.rule, 'rate')!.rule, 'liq')).toEqual([])
    expect(removeAction(RULE, 'alert')).toMatchObject({ focus: null })
  })

  it('最多 3 层：根组是 1，再嵌两层到顶，第三个嵌套的组加不进去', () => {
    const group = (id: string) => ({ type: 'group' as const, id, mode: 'and' as const, children: [] })
    const two = insertNode(RULE, 'liq', group('g3'), SCHEMA)
    expect(two).not.toBeNull() // liq 是第 2 层，g3 是第 3 层
    expect(insertNode(two!, 'g3', group('g4'), SCHEMA)).toBeNull()
    expect(insertNode(two!, 'g3', cond('x', 'rsi', 'gt', { kind: 'number', value: 1 }), SCHEMA)).not.toBeNull()
    expect(insertNode(RULE, 'liq', group('g3'), { ...SCHEMA, maxDepth: 2 })).toBeNull()
    expect(conditionCount(RULE.when)).toBe(4)
  })

  it('换字段 / 运算符后值怎么带：同种保留，换种清空，选项不在新字段里的去掉', () => {
    const op = (value: string) => SCHEMA.operators.number.find((item) => item.value === value)
    expect(carryValue({ kind: 'number', value: 5 }, op('cross-up'), SCHEMA.fields[2])).toEqual({ kind: 'number', value: 5 })
    expect(carryValue({ kind: 'number', value: 5 }, op('between'), SCHEMA.fields[2])).toEqual({
      kind: 'range',
      min: null,
      max: null,
    })
    expect(carryValue({ kind: 'ref', field: 'ma20' }, op('gt'), SCHEMA.fields[4])).toEqual({ kind: 'ref', field: 'ma20' })
    expect(carryValue({ kind: 'ref', field: 'ma20' }, op('between'), SCHEMA.fields[4])).toEqual({
      kind: 'range',
      min: null,
      max: null,
    })
    expect(carryValue({ kind: 'list', values: ['bank', 'x'] }, SCHEMA.operators.enum[1], SCHEMA.fields[1])).toEqual({
      kind: 'list',
      values: ['bank'],
    })
  })
})

describe('校验（判据 4）', () => {
  it('这棵树是合法的', () => {
    expect(validateRule(RULE, SCHEMA)).toEqual([])
  })

  const withLeaf = (leaf: RuleCondition): Rule => ({
    ...RULE,
    when: { ...RULE.when, children: [...RULE.when.children, leaf] },
  })

  it('数值越界、必填缺失、区间次序、选项、引用', () => {
    expect(validateRule(withLeaf(cond('x', 'rate', 'gt', { kind: 'number', value: 130 })), SCHEMA)).toEqual([
      { id: 'x', code: 'out-of-range', part: 'value', min: 0, max: 100 },
    ])
    expect(validateRule(withLeaf(cond('x', 'rate', 'gt', { kind: 'number', value: null })), SCHEMA)).toEqual([
      { id: 'x', code: 'required', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'rsi', 'between', { kind: 'range', min: 70, max: null })), SCHEMA)).toEqual([
      { id: 'x', code: 'required', part: 'max' },
    ])
    expect(validateRule(withLeaf(cond('x', 'rsi', 'between', { kind: 'range', min: 80, max: 20 })), SCHEMA)).toEqual([
      { id: 'x', code: 'range-order', part: 'max' },
    ])
    expect(validateRule(withLeaf(cond('x', 'rsi', 'between', { kind: 'range', min: -1, max: 120 })), SCHEMA)).toEqual([
      { id: 'x', code: 'out-of-range', part: 'min', min: 0, max: 100 },
      { id: 'x', code: 'out-of-range', part: 'max', min: 0, max: 100 },
    ])
    expect(validateRule(withLeaf(cond('x', 'sector', 'in', { kind: 'list', values: [] })), SCHEMA)).toEqual([
      { id: 'x', code: 'required', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'sector', 'in', { kind: 'list', values: ['nope'] })), SCHEMA)).toEqual([
      { id: 'x', code: 'unknown-option', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'close', 'gt', { kind: 'ref', field: 'close' })), SCHEMA)).toEqual([
      { id: 'x', code: 'ref-self', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'close', 'gt', { kind: 'ref', field: 'sector' })), SCHEMA)).toEqual([
      { id: 'x', code: 'ref-invalid', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'close', 'gt', { kind: 'ref', field: null })), SCHEMA)).toEqual([
      { id: 'x', code: 'required', part: 'value' },
    ])
    expect(validateRule(withLeaf(cond('x', 'ghost', 'gt', { kind: 'number', value: 1 })), SCHEMA)).toEqual([
      { id: 'x', code: 'unknown-field', part: 'field' },
    ])
  })

  it('空组、THEN 没有动作、动作缺参数或参数越界', () => {
    const empty: Rule = { ...RULE, when: { ...RULE.when, children: [{ type: 'group', id: 'g', mode: 'or', children: [] }] } }
    expect(validateRule(empty, SCHEMA)).toEqual([{ id: 'g', code: 'empty-group', part: 'row' }])
    expect(validateRule({ ...RULE, ifTrue: [] }, SCHEMA)).toEqual([{ id: 'ifTrue', code: 'no-action', part: 'row' }])
    expect(validateRule({ ...RULE, ifTrue: [{ id: 'a', kind: 'alert' }] }, SCHEMA)).toEqual([
      { id: 'a', code: 'required', part: 'param' },
    ])
    expect(validateRule({ ...RULE, ifTrue: [{ id: 'a', kind: 'draft', param: 500 }] }, SCHEMA)).toEqual([
      { id: 'a', code: 'out-of-range', part: 'param', min: 1, max: 100 },
    ])
    expect(validateRule({ ...RULE, ifTrue: [{ id: 'a', kind: 'bogus' }] }, SCHEMA)).toEqual([
      { id: 'a', code: 'unknown-action', part: 'row' },
    ])
    // 没有动作定义时不要求 THEN。
    expect(validateRule({ ...RULE, ifTrue: [] }, { ...SCHEMA, actions: undefined })).toEqual([])
  })
})

describe('序列化往返（判据 5）', () => {
  it('JSON → 对象 → JSON 一致，回读、校验与结构操作都认同样的结果', () => {
    const json = JSON.stringify(RULE)
    const back = JSON.parse(json) as Rule
    expect(back).toEqual(RULE)
    expect(JSON.stringify(back)).toBe(json)
    expect(ruleToText(back, SCHEMA, TEMPLATES)).toBe(ruleToText(RULE, SCHEMA, TEMPLATES))
    // 加一条、再删掉，回到同一份 JSON。
    const added = insertNode(back, 'liq', cond('n', 'rsi', 'gt', { kind: 'number', value: 50 }), SCHEMA)!
    expect(JSON.stringify(added)).not.toBe(json)
    expect(JSON.stringify(removeNode(added, 'n')!.rule)).toBe(json)
    // 若为真、若为假各加一个动作。
    const both = insertAction(insertAction(back, 'ifTrue', { id: 'b1', kind: 'watch' }), 'ifFalse', { id: 'b2', kind: 'watch' })
    expect(both.ifTrue.map((a) => a.id)).toEqual(['alert', 'b1'])
    expect(both.ifFalse.map((a) => a.id)).toEqual(['watch', 'b2'])
    expect(JSON.parse(JSON.stringify(both))).toEqual(both)
  })
})
