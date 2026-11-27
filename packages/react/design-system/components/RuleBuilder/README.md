# RuleBuilder

告警、风控、选股条件、自动化触发共用的「条件树 + 动作」编辑器。WHEN：每条条件是字段（分组下拉）、运算符（随字段类型变：数值有 > ≥ < 区间 上穿 下穿，枚举有 是 / 任一 / 都不是，文本有 包含）、值（数字带单位、区间、选项、多选成标签；数值运算符可用链接钮换成另一个字段，如「收盘价 上穿 MA20」）；条件可组成组，组内 And / Or 点连线上的小标签切，最多嵌套 3 层（schema.maxDepth 改）；调用方可给锁定的起始条件（锁图标，不能删、不能拖，只改值），含锁定条件的组整组也删不掉（删除钮灰着并说明原因）；换字段时口径（类型 / 单位 / 选项）不同的值清空重填。THEN：动作分「若为真 / 若为假」两段，动作是类型加若干参数（每个参数有自己的类型与校验，如下单草稿 = 方向 + 数量 + 价格类型），是否必填看 schema.requireActions（默认不必填，选股规则可以只有 WHEN）；「只出草稿」的动作（下单草稿）行上带草稿标，件本身不下任何单。拖把手换序只在自己那一组或那一段里（拖到别处松手不动），Alt+↑↓ 同样；撤销重做存整份快照。值校验：必填、数值范围、区间次序、选项存在、引用、空组、动作缺参数，错的行红框、原因写在行下并接 aria-describedby。顶行把整棵规则回读成一句话，模板由调用方给；有问题时顶行状态是按钮，点了全部标红并把焦点移到第一个出错的格子。受控 value 换成另一份规则时撤销栈与「改过的行」清零。整份规则是纯 JSON `{ when, ifTrue, ifFalse }`（受控 value / onValueChange；键不叫 then / else，带 then 方法的对象会被当成 thenable），纯函数 ruleToText、validateRule 与件共用同一套逻辑。字段、运算符、动作全由 schema 传，件里不带行情与语言。交互与信息结构借自 Jamie Merrill 的「规则构建器」「高级规则构建器」（x.com/Jamie_Merrill，2026-11-24 读两张图，只借交互，皮肤是 Graphite）。评估过 react-querybuilder（MIT）：借了它「组 = 组合方式 + 子节点」的模型形状，代码没引（核心带 redux，缺锁定、引用字段、动作段、组内换序）。演示数据是示例。

## Provide

`*` marks a required prop.

### RuleBuilder

value 受控或 defaultValue 不受控，每次改动 onValueChange 回整份新规则；showIssues 默认只显示改过的行的问题，"all" 全显；headingLevel 设 WHEN / THEN 标题层级（默认 4）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `schema` * | `RuleSchema` | — | Fields, operators per field type and actions. |
| `value` | `Rule` | — | The rule, controlled. |
| `defaultValue` | `Rule` | — | The rule at first, uncontrolled. |
| `onValueChange` | `(rule: Rule) => void` | — | Called with the whole new rule after every edit, move, add, remove, undo and redo. |
| `templates` * | `RuleTextTemplates` | — | Templates of the one-line readback. |
| `labels` * | `RuleBuilderLabels` | — | Texts. |
| `showIssues` | `'touched' \| 'all'` | `'touched'` | When problems show on rows: touched (the default) shows a row's problems once it was edited; all shows every problem. |
| `headingLevel` | `2 \| 3 \| 4 \| 5` | `4` | Level of the WHEN and THEN headings (the if-true and if-false chips are one level lower); default 4. |
| `className` | `string` | — | Extra class name on the root. |

### ruleToText

纯函数：按调用方的模板把整棵规则回读成一句话；没填的值写 blank。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `when` * | `RuleGroup` | — | The condition tree; its root group is always there. |
| `ifTrue` * | `readonly RuleAction[]` | — | Actions when the conditions hold; may be empty unless schema.requireActions says so. |
| `ifFalse` * | `readonly RuleAction[]` | — | Actions when they do not. |
| `fields` * | `readonly RuleField[]` | — | The fields a condition can test. |
| `operators` * | `Readonly<Record<RuleFieldType, readonly RuleOperator[]>>` | — | Operators offered for each field type. |
| `actions` | `readonly RuleActionDef[]` | — | Action kinds; without them the builder has no THEN part. |
| `requireActions` | `boolean` | — | The if-true list must hold at least one action; default false (a screening rule may have only WHEN). |
| `maxDepth` | `number` | — | Deepest nesting of groups, the root counts as 1; default 3. |
| `when` * | `(body: string) => string` | — | Wraps the whole condition text, such as (body) => `When ${body}`. |
| `and` * | `string` | — | Between two conditions of an and group. |
| `or` * | `string` | — | Between two conditions of an or group. |
| `group` * | `(inner: string) => string` | — | Wraps a nested group with more than one member, such as (inner) => `(${inner})`. |
| `condition` * | `(field: string, operator: string, value: string) => string` | — | One condition from its field, operator and value text. |
| `number` * | `(value: number, unit: string \| undefined) => string` | — | A number with its unit. |
| `range` * | `(min: string, max: string) => string` | — | A range from its two number texts. |
| `list` * | `(labels: readonly string[]) => string` | — | A list of choices, such as (labels) => labels.join(' / '). |
| `blank` * | `string` | — | Stands for a value that is not filled in yet. |
| `empty` * | `string` | — | Stands for a rule with no conditions. |
| `ifTrue` * | `(actions: string) => string` | — | Wraps the actions that run when the conditions hold, such as (actions) => `then ${actions}`. |
| `ifFalse` * | `(actions: string) => string` | — | Wraps the actions that run when they do not, such as (actions) => `otherwise ${actions}`. |
| `action` * | `(label: string, params: readonly RuleTextParam[]) => string` | — | One action from its label and its parameters (text and connector word each, in the order they are shown). |
| `actionJoin` * | `string` | — | Between two actions. |
| `join` * | `string` | — | Between the condition part and the action parts. |

### validateRule

纯函数：返回所有问题（id、code、part，动作参数的问题还带 key）；组件的红框读的就是它。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `when` * | `RuleGroup` | — | The condition tree; its root group is always there. |
| `ifTrue` * | `readonly RuleAction[]` | — | Actions when the conditions hold; may be empty unless schema.requireActions says so. |
| `ifFalse` * | `readonly RuleAction[]` | — | Actions when they do not. |
| `fields` * | `readonly RuleField[]` | — | The fields a condition can test. |
| `operators` * | `Readonly<Record<RuleFieldType, readonly RuleOperator[]>>` | — | Operators offered for each field type. |
| `actions` | `readonly RuleActionDef[]` | — | Action kinds; without them the builder has no THEN part. |
| `requireActions` | `boolean` | — | The if-true list must hold at least one action; default false (a screening rule may have only WHEN). |
| `maxDepth` | `number` | — | Deepest nesting of groups, the root counts as 1; default 3. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  RuleBuilder,
  type Rule,
  type RuleBuilderLabels,
  type RuleSchema,
  type RuleTextTemplates,
} from '@katana-ui/react/blocks'

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
        headingLevel={2}
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
```

## States

- 锁定条件：锁图标代替把手，字段与运算符是文字，只有值能改，没有删除钮。
- 含锁定条件的组：删除钮 40% 不透明、aria-disabled，名字与 title 写原因，点与 Delete 都不动（Delete 播报原因）。
- 顶行状态：没问题是 ok 色文字「Ready」；有问题是 warn 色带下划线的按钮，点了全部显示并把焦点放到第一个出错的格子。
- 出错的行：红边，行下一行 danger 色字写原因；出错的格子（动作的某个参数也一样，按 key 单独标）aria-invalid 并 aria-describedby 指向那一行。
- 拖动中：被拖的行 50%，目标缝一条焦点色线；拖出所在的组 / 段，光标变 not-allowed，松手不动。
- 组只有一个成员时没有 And / Or 标签；成员多于一个才画竖线与标签。
- 没有动作定义（schema.actions 为空）时整个 THEN 不出现。
- 窄于 520px：连线槽从 44px 缩到 36px，行内的格子换行。

## Don't

- 不要用它做一行平铺、全是「且」的过滤：用 FilterBar。
- 不要拿它编排有先后的流程（触发 → 动作 → 分支）：用 FlowBuilder。
- 不要指望它下单：「下单草稿」只是一种动作类型，真下单要调用方在确认后走 OrderTicket。

## Composition

```
RuleBuilder
  头（回读一句话（有名字的 group） · 状态（有问题时是按钮） · Button 撤销 · Button 重做）
  WHEN（role=group，标题 headingLevel）
    组：（嵌套组头：把手 · 标题 · 删除）· 树（ul 行 li：把手 / 锁 · 字段 Select · 运算符 Select · 值 · 删除；行下写错误）· And / Or 按钮 · Button 加条件 · Button 加组
    值：数字框（单位）/ 区间两个数字框 / 选项 Select / 标签 + 勾选列表 / 文字框 / 引用字段 Select 与链接钮
  THEN（role=group，有动作定义才出现）
    若为真 / 若为假：标签 · 动作行（把手 · 类型 Select · 各个参数（连接词 + Select / 数字框 / 文字框）· 草稿标 · 删除）· Button 加动作
  键位说明（aria-describedby）· 播报
```

## Keyboard

- `Tab`：依次走把手、字段、运算符、值、删除，再到每组的「加条件」「加组」
- `Alt+↑ / Alt+↓`：行内任一格上（含下拉触发器：只挪行，不开下拉）：在自己那一组（或那一段）里上挪 / 下挪；锁定条件前面挪不进去
- `Delete / Backspace`：在把手上：删这一行，焦点去它前面那一行（没有就到「加条件」）；锁定条件没有把手；含锁定条件的组不动并播报原因
- `Enter / Space`：在 And / Or 上：切组合方式；在下拉与「加」上：打开列表
- `↑ ↓`：在数字框里：按步长改值（Shift 十倍）；在下拉列表里：移动
- `Ctrl+Z / ⌘+Z`：撤销上一次改动（在文字框里让位给浏览器自己的撤销）
- `Ctrl+Shift+Z / ⌘+Shift+Z / Ctrl+Y`：重做
- `Esc`：拖动中：取消；下拉里：关
