// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { InlineEdit, SplitButton, TagInput, type InlineEditLabels, type TagInputLabels } from '../../src/index.ts'
import { Row } from './parts.tsx'

// #1954 从 Arc（MIT）照搬的三件的演示。按钮与输入不连任何账户、不发任何请求：保存是本页里的一个定时器，失败是故意 reject 的。

const ORDER_TYPES = [
  { key: 'limit', label: '限价' },
  { key: 'market', label: '市价' },
  { key: 'stop', label: '条件单' },
] as const

export function SplitButtonDemo() {
  const [orderType, setOrderType] = useState<(typeof ORDER_TYPES)[number]>(ORDER_TYPES[0])
  const [last, setLast] = useState('（还没按）')
  return (
    <>
      <Row name="primary · 菜单里选了谁，主按钮就换成谁">
        <SplitButton
          variant="primary"
          labels={{ menu: '换委托类型' }}
          onClick={() => setLast(`买入 · ${orderType.label}`)}
          actions={ORDER_TYPES.map((type) => ({
            key: type.key,
            label: type.label,
            onSelect: () => setOrderType(type),
          }))}
        >
          买入 · {orderType.label}
        </SplitButton>
        <output data-gallery-split>上一次：{last}</output>
      </Row>
      <Row name="default · 持仓">
        <SplitButton
          labels={{ menu: '更多平仓方式' }}
          onClick={() => setLast('平仓')}
          actions={[
            { key: 'half', label: '平一半', onSelect: () => setLast('平一半') },
            { key: 'reverse', label: '反手', danger: true, onSelect: () => setLast('反手') },
            { key: 'oco', label: '挂止盈止损', disabled: true, onSelect: () => {} },
          ]}
        >
          平仓
        </SplitButton>
      </Row>
      <Row name="sm · 带快捷键提示">
        <SplitButton
          size="sm"
          labels={{ menu: '更多保存方式' }}
          onClick={() => setLast('保存布局')}
          actions={[
            { key: 'as', label: '另存为…', shortcut: '⇧S', onSelect: () => setLast('另存为') },
            { key: 'rename', label: '重命名…', onSelect: () => setLast('重命名') },
          ]}
        >
          保存
        </SplitButton>
      </Row>
      <Row name="禁用">
        <SplitButton disabled labels={{ menu: '更多' }} onClick={() => {}} actions={[]}>
          全部撤单
        </SplitButton>
      </Row>
      <p className="gal-note">演示：不连任何账户，只记下按了哪个。焦点在主按钮上按 Alt+↓ 也开菜单。</p>
    </>
  )
}

const TAG_LABELS: TagInputLabels = {
  remove: (tag) => `移除 ${tag}`,
  duplicate: (tag) => `${tag} 已经在里面了`,
  added: (tags) => `已加入 ${tags.join('、')}`,
  removed: (tag) => `已移除 ${tag}`,
  picked: (tag) => `选中 ${tag}，再按退格删除`,
  full: '最多 8 个',
}

export function TagInputDemo() {
  const [codes, setCodes] = useState<string[]>(['600519', '000001'])
  return (
    <>
      <Row name="品种代码 · 6 位数字 · 最多 8 个">
        <div style={{ width: 320 }}>
          <TagInput
            label="品种代码"
            value={codes}
            onValueChange={setCodes}
            placeholder="输入代码，回车或逗号分开"
            validate={(tag) => (/^\d{6}$/.test(tag) ? null : `「${tag}」不是 6 位代码`)}
            max={8}
            labels={TAG_LABELS}
          />
        </div>
        <output data-gallery-tags>
          {codes.length} 个：{codes.join(' ')}
        </output>
      </Row>
      <Row name="sm · 策略标签 · 转大写">
        <div style={{ width: 260 }}>
          <TagInput
            label="策略标签"
            size="sm"
            defaultValue={['MOMENTUM']}
            normalize={(tag) => tag.toUpperCase()}
            placeholder="加标签"
            labels={TAG_LABELS}
          />
        </div>
      </Row>
      <Row name="禁用">
        <div style={{ width: 200 }}>
          <TagInput label="只读标签" value={['A 股', '港股']} disabled labels={TAG_LABELS} />
        </div>
      </Row>
      <p className="gal-note">
        演示数据：代码是举例，不查行情。粘贴「600519, 000001」这类一串会一次拆开；光标在框头时退格先选中最后一个。
      </p>
    </>
  )
}

const EDIT_LABELS: InlineEditLabels = {
  editHint: '按回车或点按编辑',
  save: '保存',
  cancel: '取消编辑',
  saving: '正在保存',
  saved: '已保存',
  failed: (text) => `「${text}」没存上，已退回上次的名字。`,
  retry: '再试一次',
}

/** 演示用的保存：等 600ms 再落定（本页定时器，不发请求）。 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function InlineEditDemo() {
  const [name, setName] = useState('核心持仓')
  return (
    <>
      <Row name="标题 · h3 · 保存要 0.6 秒">
        <InlineEdit
          as="h3"
          className="k-text-title"
          value={name}
          label="自选分组名"
          placeholder="未命名分组"
          validate={(next) => (next ? (next.length > 16 ? '最多 16 个字' : null) : '名字不能是空的')}
          onSave={async (next) => {
            await wait(600)
            setName(next)
          }}
          labels={EDIT_LABELS}
        />
        <output data-gallery-inline>已存：{name}</output>
      </Row>
      <Row name="保存失败 · 退回">
        <InlineEdit
          value="日内突破 v2"
          label="策略名"
          onSave={async () => {
            await wait(600)
            throw new Error('演示：故意失败')
          }}
          labels={EDIT_LABELS}
        />
      </Row>
      <Row name="空值 · 占位">
        <InlineEdit value="" label="布局名" placeholder="未命名布局" onSave={() => {}} labels={EDIT_LABELS} />
      </Row>
      <Row name="禁用">
        <InlineEdit value="系统默认布局" label="布局名" disabled onSave={() => {}} labels={EDIT_LABELS} />
      </Row>
      <p className="gal-note">演示：保存是本页的定时器，第二行故意失败。回车保存、Esc 放弃、点到外面也保存。</p>
    </>
  )
}
