// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RuleBuilder, type Rule } from '../../src/blocks'
import { Button } from '../../src/primitives/button.tsx'
import { RULE_LABELS, RULE_SCHEMA, RULE_TEMPLATES, RuleBuilderUsage } from '../usage/RuleBuilderUsage.tsx'
import { Row } from './parts.tsx'

// 规则构建器（KatanaUI #223）的文档站演示。数据全是示例：手写的演示值，不是任何数据源、账户或 Agent 的真实记录；回读文字由调用方给的英文模板写出。

/** 一份故意写坏的规则：区间越界、必填没填、空组、动作缺参数（下单草稿只填了方向）。showIssues="all" 一次全显：共 6 条。 */
const BROKEN: Rule = {
  when: {
    type: 'group',
    id: 'root',
    mode: 'and',
    children: [
      { type: 'condition', id: 'rate', field: 'turnover-rate', op: 'gt', value: { kind: 'number', value: 130 } },
      { type: 'condition', id: 'rsi', field: 'rsi', op: 'between', value: { kind: 'range', min: 70, max: null } },
      { type: 'condition', id: 'sector', field: 'sector', op: 'in', value: { kind: 'list', values: [] } },
      { type: 'group', id: 'empty', mode: 'or', children: [] },
    ],
  },
  ifTrue: [{ id: 'draft', kind: 'draft', params: { side: 'buy' } }],
  ifFalse: [],
}

/** 受控换文档的演示：两份规则，A 里有「含锁定条件的组」，B 的换手率越界；同一个 id（rate）在两份里都有，用来看「改过的行」有没有被清掉。 */
const RULE_A: Rule = {
  when: {
    type: 'group',
    id: 'root',
    mode: 'and',
    children: [
      {
        type: 'group',
        id: 'guard',
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
        ],
      },
      { type: 'condition', id: 'rate', field: 'turnover-rate', op: 'gt', value: { kind: 'number', value: 3 } },
    ],
  },
  ifTrue: [{ id: 'alert', kind: 'alert', params: { channel: 'app' } }],
  ifFalse: [],
}
const RULE_B: Rule = {
  when: {
    type: 'group',
    id: 'root',
    mode: 'or',
    children: [
      { type: 'condition', id: 'rate', field: 'turnover-rate', op: 'gt', value: { kind: 'number', value: 130 } },
      { type: 'condition', id: 'sector', field: 'sector', op: 'in', value: { kind: 'list', values: ['chip'] } },
    ],
  },
  ifTrue: [],
  ifFalse: [],
}

function SwitchDemo() {
  const [rule, setRule] = useState<Rule>(RULE_A)
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-rule="switch">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Button size="sm" data-switch="a" onClick={() => setRule(RULE_A)}>
          Load rule A
        </Button>
        <Button size="sm" data-switch="b" onClick={() => setRule(RULE_B)}>
          Load rule B
        </Button>
      </div>
      <RuleBuilder
        schema={RULE_SCHEMA}
        value={rule}
        onValueChange={setRule}
        templates={RULE_TEMPLATES}
        labels={RULE_LABELS}
        headingLevel={2}
      />
    </div>
  )
}

export function RuleBuilderDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：一条选股告警。顶行是整棵规则的回读，文案模板由调用方给。点连线上的 And / Or
        切组合方式；拖把手，或在把手上按 Alt+↑↓，在自己那一组里换序（跨组不落）；把手上按 Delete 删行；Ctrl/⌘+Z
        撤销、Ctrl/⌘+Shift+Z 重做。第一条「Market is A-shares」是锁定条件：不能删、不能拖，只改值；「收盘价 crosses
        above」旁的链接钮把数字换成另一个字段（MA20）。「Draft order」只出草稿，行上有标。
      </p>
      <Row name="选股告警">
        <RuleBuilderUsage />
      </Row>
      <p className="gal-note">
        下面这份故意写坏，showIssues=&quot;all&quot;
        全显：越界、必填缺失、空组、下单草稿的数量与价格类型没填。红框的行下写原因，并用 aria-describedby
        接到出错的格子；顶行状态是个按钮，点它全部标红并把焦点移到第一个出错的格子。同一份结果就是纯函数 validateRule
        的返回。THEN 默认可以不写（选股规则只有 WHEN），schema.requireActions 为真才要求至少一个动作。
      </p>
      <Row name="校验（全显）">
        <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-rule="broken">
          <RuleBuilder
            schema={RULE_SCHEMA}
            defaultValue={BROKEN}
            templates={RULE_TEMPLATES}
            labels={RULE_LABELS}
            headingLevel={2}
            showIssues="all"
          />
        </div>
      </Row>
      <p className="gal-note">
        受控的 value 换成另一份规则（不是自己刚写出去的那份）时，撤销栈与「改过的行」一并清掉。规则 A
        里有一个含锁定条件的组（第一个
        Group）：它的删除钮灰着、点了不动并说明原因；换字段时类型或单位不同的值会清空重填。
      </p>
      <Row name="换一份规则（受控）">
        <SwitchDemo />
      </Row>
    </>
  )
}
