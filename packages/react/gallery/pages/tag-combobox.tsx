// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TagCombobox, type TagComboboxLabels, type TagComboboxOption } from '../../src/index.ts'
import { Row } from './parts.tsx'

// 带标签的多选 Combobox 的演示。人名、角色都是编的，没有真实的人；头像用缩写圆（prefix 节点由调用方给，这里不放图片）。

/** 缩写圆：撑满外面给的框（标签里 16、行里 24），色取容器的 token。 */
function Initials({ text }: { text: string }) {
  return (
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%',
        background: 'var(--k-container-subtle-background)',
        color: 'var(--k-content-body-foreground)',
        font: '500 9px/1 var(--font-sans-small)',
      }}
    >
      {text}
    </span>
  )
}

const PEOPLE: readonly [string, string, string][] = [
  ['Aisha Khan', 'AK', '设计负责人'],
  ['Amara Okafor', 'AO', '设计师'],
  ['Ana Panto', 'AP', '设计负责人'],
  ['Anika Patel', 'AP', '内容设计师'],
  ['Ben Carter', 'BC', '工程师'],
  ['Camille Girard', 'CG', '工程师'],
  ['Chloe Martin', 'CM', '内容设计师'],
  ['Daniel Foster', 'DF', '内容设计师'],
  ['Elena Petrova', 'EP', '产品经理'],
  ['Elif Demir', 'ED', '研究员'],
  ['Fatima Al-Sayed', 'FA', '工程师'],
  ['Grace Liu', 'GL', '产品经理'],
  ['Hannah Fischer', 'HF', '产品经理'],
  ['Henrik Andersen', 'HA', '设计师'],
  ['Hiro Tanaka', 'HT', '研究员'],
  ['Jonas Weber', 'JW', '工程经理'],
]

const PEOPLE_OPTIONS: readonly TagComboboxOption[] = PEOPLE.map(([name, initials, role]) => ({
  id: name.toLowerCase().replaceAll(' ', '-'),
  label: name,
  description: role,
  prefix: <Initials text={initials} />,
}))

const LABELS: TagComboboxLabels = {
  remove: (name) => `移除 ${name}`,
  empty: '没有匹配的人',
  toggle: '展开或收起候选',
  added: (name) => `已选 ${name}`,
  removed: (name) => `已移除 ${name}`,
  picked: (name) => `选中 ${name}，再按退格删除`,
}

const STRATEGIES: readonly TagComboboxOption[] = [
  { id: 'momentum', label: '动量', keywords: ['momentum'] },
  { id: 'mean-reversion', label: '均值回归', keywords: ['mean reversion'] },
  { id: 'breakout', label: '突破', keywords: ['breakout'] },
  { id: 'carry', label: '套息', keywords: ['carry'] },
  { id: 'stat-arb', label: '统计套利', keywords: ['stat arb'] },
  { id: 'market-making', label: '做市', keywords: ['market making'] },
]

export function TagComboboxDemo() {
  const [reviewers, setReviewers] = useState<string[]>(['aisha-khan', 'elena-petrova'])
  return (
    <>
      <Row name="头像与角色">
        <div style={{ width: 380 }}>
          <TagCombobox
            label="评审人"
            options={PEOPLE_OPTIONS}
            value={reviewers}
            onValueChange={setReviewers}
            placeholder="添加评审人"
            labels={LABELS}
          />
        </div>
        <output data-testid="tag-combobox-value">
          {reviewers.length} 人：{reviewers.join(' ')}
        </output>
      </Row>
      <Row name="纯文字 · 英文名可搜">
        <div style={{ width: 280 }}>
          <TagCombobox
            label="策略类型"
            options={STRATEGIES}
            defaultValue={['momentum']}
            placeholder="选策略类型"
            labels={{ remove: (name) => `移除 ${name}`, empty: '没有匹配的类型' }}
          />
        </div>
      </Row>
      <Row name="禁用">
        <div style={{ width: 280 }}>
          <TagCombobox
            label="只读评审人"
            options={PEOPLE_OPTIONS}
            defaultValue={['hiro-tanaka']}
            disabled
            labels={LABELS}
          />
        </div>
      </Row>
      <p className="gal-note">
        演示数据：人名与角色是编的。列表里 ↑ ↓ 移高亮、Enter 切换；输入框空着时退格先选中最后一个标签、再按才删，← →
        在标签间移。
      </p>
    </>
  )
}
