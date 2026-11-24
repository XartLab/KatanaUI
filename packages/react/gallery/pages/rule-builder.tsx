// SPDX-License-Identifier: MIT
import { RuleBuilder, type Rule } from '../../src/blocks'
import { RULE_LABELS, RULE_SCHEMA, RULE_TEMPLATES, RuleBuilderUsage } from '../usage/RuleBuilderUsage.tsx'
import { Row } from './parts.tsx'

// 规则构建器（KatanaUI #223）的文档站演示。数据全是示例：手写的演示值，不是任何数据源、账户或 Agent 的真实记录；回读文字由调用方给的英文模板写出。

/** 一份故意写坏的规则：区间越界、必填没填、空组、动作缺参数、THEN 没有动作。showIssues="all" 一次全显。 */
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
  ifTrue: [{ id: 'alert', kind: 'alert' }],
  ifFalse: [],
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
        下面这份故意写坏，showIssues=&quot;all&quot; 全显：越界、必填缺失、空组、动作缺参数、THEN
        没有动作。红框的行下写原因，并用 aria-describedby 接到出错的格子；顶行状态写问题个数。同一份结果就是纯函数
        validateRule 的返回。
      </p>
      <Row name="校验（全显）">
        <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-rule="broken">
          <RuleBuilder
            schema={RULE_SCHEMA}
            defaultValue={BROKEN}
            templates={RULE_TEMPLATES}
            labels={RULE_LABELS}
            showIssues="all"
          />
        </div>
      </Row>
    </>
  )
}
