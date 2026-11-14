// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  ChipGroup,
  DateRangePicker,
  HoldToConfirm,
  ShortcutRecorder,
  TreeView,
  type ChipItem,
  type DateRange,
  type DateRangeLabels,
  type ShortcutRecorderLabels,
  type TreeNode,
} from '../../src/index'
import { Row } from './parts'

// #1919 的操作与结构件的演示。数据都是演示用的（页上写明），不是行情。

export function HoldToConfirmDemo() {
  const [flattened, setFlattened] = useState(0)
  const [stopped, setStopped] = useState(0)
  return (
    <>
      <Row name="danger · 默认 2 秒">
        <HoldToConfirm hint="按住 2 秒，全部平仓" confirmedLabel="已平仓" onConfirm={() => setFlattened((n) => n + 1)}>
          全部平仓
        </HoldToConfirm>
        <output data-gallery-hold>已触发 {flattened} 次</output>
      </Row>
      <Row name="default · 1 秒">
        <HoldToConfirm
          tone="default"
          holdMs={1000}
          hint="按住 1 秒，停止策略"
          onConfirm={() => setStopped((n) => n + 1)}
        >
          停止策略
        </HoldToConfirm>
        <output data-gallery-hold-fast>已触发 {stopped} 次</output>
      </Row>
      <Row name="禁用">
        <HoldToConfirm disabled hint="按住 2 秒，全部撤单" onConfirm={() => {}}>
          全部撤单
        </HoldToConfirm>
      </Row>
      <p className="gal-note">演示：按钮不连任何账户，只计数。单击不会触发；按住不放，或键盘按住空格 / 回车。</p>
    </>
  )
}

const RECORDER_LABELS: ShortcutRecorderLabels = {
  empty: '未设置',
  recording: '按下新的快捷键',
  clear: '清除快捷键',
  conflict: (action) => `已被「${action}」使用`,
  needModifier: '要带 Ctrl、Alt、Shift 或 Meta',
}

// 演示用的占用表：另外两个动作的快捷键。
const TAKEN = { 'Ctrl+Shift+K': '全部撤单', 'Alt+B': '市价买入' }

export function ShortcutRecorderDemo() {
  const [flatten, setFlatten] = useState<string | null>('Ctrl+Shift+F')
  const [bare, setBare] = useState<string | null>(null)
  return (
    <>
      <Row name="平仓 · 有冲突表">
        <ShortcutRecorder
          label="全部平仓快捷键"
          value={flatten}
          onValue={setFlatten}
          labels={RECORDER_LABELS}
          conflicts={TAKEN}
        />
        <output data-gallery-recorder>{flatten ?? '未设置'}</output>
      </Row>
      <Row name="要求修饰键">
        <ShortcutRecorder
          label="切换品种快捷键"
          value={bare}
          onValue={setBare}
          labels={RECORDER_LABELS}
          requireModifier
        />
        <output data-gallery-recorder-mod>{bare ?? '未设置'}</output>
      </Row>
      <Row name="禁用">
        <ShortcutRecorder label="只读快捷键" value="F5" onValue={() => {}} labels={RECORDER_LABELS} disabled />
      </Row>
      <p className="gal-note">
        演示：占用表里是「全部撤单 = Ctrl+Shift+K」「市价买入 = Alt+B」，录到它们会提示冲突、不写入。
      </p>
    </>
  )
}

// 演示用的筛选项与命中数（不是行情）。
const CHIP_ITEMS: readonly ChipItem[] = [
  { value: 'cn', label: 'A 股', count: 38 },
  { value: 'hk', label: '港股', count: 12 },
  { value: 'us', label: '美股', count: 9 },
  { value: 'fut', label: '期货', count: 0, disabled: true },
  { value: 'crypto', label: '加密', count: 21 },
]

export function ChipGroupDemo() {
  const [markets, setMarkets] = useState<string[]>(['cn', 'crypto'])
  const [one, setOne] = useState<string[]>(['hk'])
  return (
    <>
      <Row name="多选 · 带清除">
        <ChipGroup label="市场" items={CHIP_ITEMS} value={markets} onValueChange={setMarkets} clearLabel="清除筛选" />
        <output data-gallery-chips>{markets.join(',') || '无'}</output>
      </Row>
      <Row name="单选">
        <ChipGroup
          label="市场（单选）"
          selection="single"
          items={CHIP_ITEMS.slice(0, 3)}
          value={one}
          onValueChange={setOne}
        />
        <output data-gallery-chips-one>{one.join(',') || '无'}</output>
      </Row>
      <p className="gal-note">演示：芯片与命中数是演示用的，不是行情。单选点已选的取消；有选中项时末尾出现清除钮。</p>
    </>
  )
}

const RANGE_LABELS: DateRangeLabels = {
  start: '起点',
  end: '终点',
  pickRange: '选择区间',
  calendar: '区间日历',
  previousMonth: '上个月',
  nextMonth: '下个月',
  presets: '常用区间',
  preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
  custom: '自定义',
}

// 演示固定「今天」是 2026-11-14（周六），预设与截图才不随真实日期变；应用里由显示时区算出来传进去。
export function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange | null>({ start: '2026-11-09', end: '2026-11-14' })
  return (
    <>
      <Row name="区间 + 预设">
        <DateRangePicker value={range} onValue={setRange} today="2026-11-14" labels={RANGE_LABELS} locale="zh-CN" />
        <output data-gallery-range>{range ? `${range.start} ~ ${range.end}` : '未选'}</output>
      </Row>
      <Row name="未选 · 限定范围">
        <DateRangePicker
          value={null}
          onValue={() => {}}
          today="2026-11-14"
          min="2026-01-01"
          max="2026-12-31"
          labels={RANGE_LABELS}
          locale="zh-CN"
        />
      </Row>
      <p className="gal-note">演示：「今天」固定为 2026-11-14（周六）。预设都是截至今天；日历是双月，点两下选起止。</p>
    </>
  )
}

// 演示用的分类树（不是真实的品种库或数据集）。
const TREE_ITEMS: readonly TreeNode[] = [
  {
    id: 'cn',
    label: 'A 股',
    count: 3,
    children: [
      {
        id: 'cn-main',
        label: '主板',
        count: 2,
        children: [
          { id: 'cn-sh', label: '沪市' },
          { id: 'cn-sz', label: '深市' },
        ],
      },
      { id: 'cn-star', label: '科创板' },
    ],
  },
  { id: 'hk', label: '港股', count: 1, children: [{ id: 'hk-main', label: '主板' }] },
  {
    id: 'crypto',
    label: '加密',
    count: 2,
    children: [
      { id: 'crypto-spot', label: '现货' },
      { id: 'crypto-perp', label: '永续', disabled: true },
    ],
  },
  { id: 'misc', label: '未分类' },
]

export function TreeViewDemo() {
  const [selected, setSelected] = useState<string[]>(['cn-sh'])
  const [opened, setOpened] = useState('无')
  return (
    <>
      <Row name="单选 · 默认展开 A 股">
        <div className="gal-tree" style={{ width: 240 }}>
          <TreeView
            label="品种分类"
            items={TREE_ITEMS}
            defaultExpandedKeys={['cn', 'cn-main']}
            selectedKeys={selected}
            onSelectionChange={setSelected}
            onAction={setOpened}
          />
        </div>
        <output data-gallery-tree>{selected.join(',') || '无'}</output>
        <output data-gallery-tree-open>{opened}</output>
      </Row>
      <p className="gal-note">演示：分类与数量是演示用的，不是真实的品种库。→ 展开、← 收起，↑↓ 走，Enter 激活。</p>
    </>
  )
}
