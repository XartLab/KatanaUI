// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  RuleBuilder,
  type Rule,
  type RuleBuilderLabels,
  type RuleSchema,
  type RuleTextTemplates,
} from '../../src/blocks'

// 示例数据：一条选股告警规则。字段、运算符、动作是手写的演示值，不是任何数据源或账户；整份规则是纯 JSON，下面的回显就是 onValueChange 收到的那一份。
// 文案与回读模板由调用方给（包里不带语言），这里用英文。
export const RULE_SCHEMA: RuleSchema = {
  fields: [
    {
      key: 'market',
      label: 'Market',
      group: 'Universe',
      type: 'enum',
      options: [
        { value: 'cn', label: 'A-shares' },
        { value: 'hk', label: 'Hong Kong' },
        { value: 'us', label: 'US' },
      ],
    },
    {
      key: 'sector',
      label: 'Sector',
      group: 'Universe',
      type: 'enum',
      options: [
        { value: 'bank', label: 'Banks' },
        { value: 'chip', label: 'Semiconductors' },
        { value: 'broker', label: 'Brokers' },
        { value: 'software', label: 'Software' },
      ],
    },
    { key: 'turnover', label: 'Turnover', group: 'Liquidity', type: 'number', unit: 'M', min: 0, max: 1_000_000 },
    { key: 'turnover-rate', label: 'Turnover rate', group: 'Liquidity', type: 'number', unit: '%', min: 0, max: 100 },
    { key: 'close', label: 'Close', group: 'Price', type: 'number', min: 0, step: 0.01 },
    { key: 'ma20', label: 'MA20', group: 'Price', type: 'number', min: 0, step: 0.01 },
    { key: 'rsi', label: 'RSI(14)', group: 'Indicators', type: 'number', min: 0, max: 100 },
    { key: 'name', label: 'Name', type: 'text' },
  ],
  operators: {
    number: [
      { value: 'gt', label: '>', input: 'number', allowRef: true },
      { value: 'gte', label: '≥', input: 'number', allowRef: true },
      { value: 'lt', label: '<', input: 'number', allowRef: true },
      { value: 'between', label: 'between', input: 'range' },
      { value: 'cross-up', label: 'crosses above', input: 'number', allowRef: true },
      { value: 'cross-down', label: 'crosses below', input: 'number', allowRef: true },
    ],
    enum: [
      { value: 'is', label: 'is', input: 'option' },
      { value: 'in', label: 'is any of', input: 'list' },
      { value: 'not-in', label: 'is none of', input: 'list' },
    ],
    text: [{ value: 'contains', label: 'contains', input: 'text' }],
  },
  actions: [
    {
      kind: 'alert',
      label: 'Send alert',
      params: [
        {
          key: 'channel',
          label: 'Channel',
          input: 'option',
          connector: 'to',
          options: [
            { value: 'app', label: 'In-app' },
            { value: 'push', label: 'Push' },
            { value: 'mail', label: 'Email' },
          ],
        },
      ],
    },
    {
      kind: 'watch',
      label: 'Add to watchlist',
      params: [
        {
          key: 'list',
          label: 'Watchlist',
          input: 'option',
          connector: 'to',
          options: [
            { value: 'breakouts', label: 'Breakouts' },
            { value: 'review', label: 'To review' },
          ],
        },
      ],
    },
    {
      kind: 'agent',
      label: 'Hand to Agent',
      params: [
        {
          key: 'agent',
          label: 'Agent',
          input: 'option',
          connector: 'to',
          options: [
            { value: 'research', label: 'Researcher' },
            { value: 'risk', label: 'Risk reviewer' },
          ],
        },
      ],
    },
    {
      kind: 'draft',
      label: 'Draft order',
      draft: true,
      // 一个动作带多个参数，各有各的类型与校验：方向（选项）、数量（数字，1 到 100 手）、价格类型（选项，前面带连接词）。
      params: [
        {
          key: 'side',
          label: 'Side',
          input: 'option',
          options: [
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell' },
          ],
        },
        { key: 'quantity', label: 'Quantity', input: 'number', unit: 'lots', min: 1, max: 100 },
        {
          key: 'price',
          label: 'Price type',
          input: 'option',
          connector: 'at',
          options: [
            { value: 'market', label: 'Market' },
            { value: 'limit', label: 'Limit' },
            { value: 'bid', label: 'Best bid' },
          ],
        },
      ],
    },
  ],
}

export const RULE_DEMO: Rule = {
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
      {
        type: 'condition',
        id: 'sector',
        field: 'sector',
        op: 'in',
        value: { kind: 'list', values: ['chip', 'software'] },
      },
      {
        type: 'condition',
        id: 'cross',
        field: 'close',
        op: 'cross-up',
        value: { kind: 'ref', field: 'ma20' },
      },
      {
        type: 'group',
        id: 'liquidity',
        mode: 'or',
        children: [
          { type: 'condition', id: 'turnover', field: 'turnover', op: 'gt', value: { kind: 'number', value: 500 } },
          {
            type: 'condition',
            id: 'rate',
            field: 'turnover-rate',
            op: 'gt',
            value: { kind: 'number', value: 3 },
          },
        ],
      },
    ],
  },
  ifTrue: [
    { id: 'alert', kind: 'alert', params: { channel: 'push' } },
    { id: 'draft', kind: 'draft', params: { side: 'buy', quantity: 10, price: 'limit' } },
  ],
  ifFalse: [{ id: 'watch', kind: 'watch', params: { list: 'review' } }],
}

export const RULE_TEMPLATES: RuleTextTemplates = {
  when: (body) => `When ${body}`,
  and: ' and ',
  or: ' or ',
  group: (inner) => `(${inner})`,
  condition: (field, operator, value) => `${field} ${operator} ${value}`,
  number: (value, unit) => (unit === undefined ? `${value}` : unit === '%' ? `${value}%` : `${value} ${unit}`),
  range: (min, max) => `${min} to ${max}`,
  list: (labels) => labels.join(' / '),
  blank: '…',
  empty: 'always',
  ifTrue: (actions) => `then ${actions}`,
  ifFalse: (actions) => `otherwise ${actions}`,
  action: (label, params) =>
    [
      label,
      ...params.map((param) => (param.connector === undefined ? param.text : `${param.connector} ${param.text}`)),
    ].join(' '),
  actionJoin: ' and ',
  join: ', ',
}

export const RULE_LABELS: RuleBuilderLabels = {
  when: 'WHEN',
  actions: 'THEN',
  ifTrue: 'If true',
  ifFalse: 'If false',
  readback: 'Rule in words',
  mode: { and: 'And', or: 'Or' },
  switchMode: (current, next) => `Combine with ${current}; switch to ${next}`,
  group: (n, mode) => `Group · ${n} ${n === 1 ? 'condition' : 'conditions'} · ${mode}`,
  rootGroup: (n, mode) => `Conditions · ${n} · ${mode}`,
  addCondition: 'Add condition',
  addGroup: 'Add group',
  addAction: 'Add action',
  field: 'Field',
  operator: 'Operator',
  value: 'Value',
  min: 'Minimum',
  max: 'Maximum',
  action: 'Action',
  rangeTo: 'to',
  refToggle: 'Compare with another field',
  refField: 'Field to compare with',
  refPlaceholder: 'Pick a field',
  valuePlaceholder: 'Pick one',
  addValue: 'Add',
  searchValue: 'Search values',
  noValue: 'No match',
  removeValue: (label) => `Remove ${label}`,
  locked: 'Locked',
  valueCleared: 'Value cleared: the new field has another type or unit',
  draft: 'Draft only',
  handle: (summary) => `Move: ${summary}`,
  remove: (summary) => `Remove: ${summary}`,
  removeBlocked: (summary) => `Cannot remove ${summary}: it holds a locked condition`,
  hint: 'Drag the handle, or press Alt+Up and Alt+Down to move within the group. Delete removes the row.',
  undo: 'Undo',
  redo: 'Redo',
  issueCount: (n) => `${n} ${n === 1 ? 'issue' : 'issues'}`,
  issueAction: (n) => `${n} ${n === 1 ? 'issue' : 'issues'}: show all and go to the first`,
  valid: 'Ready',
  issue: (issue) => {
    switch (issue.code) {
      case 'required':
        return 'Fill in a value'
      case 'out-of-range':
        return issue.min !== undefined && issue.max !== undefined
          ? `Must be between ${issue.min} and ${issue.max}`
          : issue.min !== undefined
            ? `Must be at least ${issue.min}`
            : `Must be at most ${issue.max}`
      case 'range-order':
        return 'The lower bound is above the upper bound'
      case 'unknown-option':
        return 'This is not an available option'
      case 'ref-invalid':
      case 'ref-self':
        return 'Pick a different number field'
      case 'empty-group':
        return 'Add at least one condition'
      case 'no-action':
        return 'Add at least one action'
      default:
        return 'This row is not valid'
    }
  },
  added: (summary) => `Added: ${summary}`,
  removed: (summary) => `Removed: ${summary}`,
  moved: (summary, position, total) => `Moved ${summary} to position ${position} of ${total}`,
  modeChanged: (mode) => `Group now combines with ${mode}`,
  undone: 'Undone',
  redone: 'Redone',
  dragCancelled: 'Move cancelled',
}

export function RuleBuilderUsage() {
  const [rule, setRule] = useState<Rule>(RULE_DEMO)
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-rule="main">
      <RuleBuilder
        schema={RULE_SCHEMA}
        value={rule}
        onValueChange={setRule}
        templates={RULE_TEMPLATES}
        labels={RULE_LABELS}
      />
      <details style={{ marginTop: 8 }}>
        <summary>Rule JSON</summary>
        <pre data-gallery-rule-json="" style={{ maxHeight: 160, overflow: 'auto', fontSize: 11 }}>
          {JSON.stringify(rule)}
        </pre>
      </details>
    </div>
  )
}
