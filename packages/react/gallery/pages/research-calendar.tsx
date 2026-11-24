// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import {
  Button,
  Calendar,
  DateRangePicker,
  DateTimeInput,
  FileImport,
  TemplateLibrary,
  type DateRange,
  type DateRangeLabels,
  type DateTimeLabels,
  type FileImportLabels,
  type ImportItem,
  type TemplateGroup,
  type TemplateLibraryLabels,
} from '../../src/index.ts'
import { TradingDatePicker } from '../../src/cn/index.ts'
import { EXAMPLE_EVENTS, EXAMPLE_INSIGHT, EXAMPLE_ITEMS, EXAMPLE_TEMPLATES } from '../research-calendar-data.ts'
import { Row } from './parts.tsx'

// 研究资料与日历（#226）的演示：日历事件点是四个日历各加一行（页内的原演示不动），资料导入与模板库各一页。全部本地状态，不连网络；上传进度是页上的按钮手动推进。

const DATE_LABELS: DateTimeLabels = {
  date: (label) => `${label}的日期`,
  pickDate: (label) => `选${label}的日期`,
  calendar: (label) => `${label}的日历`,
  time: (label) => `${label}的时刻`,
  previousMonth: '上个月',
  nextMonth: '下个月',
}
const RANGE_LABELS: DateRangeLabels = {
  start: '起点',
  end: '终点',
  pickRange: '选区间',
  calendar: '区间日历',
  previousMonth: '上个月',
  nextMonth: '下个月',
  presets: '预设',
  preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
  custom: '自定义',
}

export function DateTimeEventsRow() {
  const [date, setDate] = useState('2026-11-20')
  return (
    <Row name="事件点与洞察（示例数据）">
      <DateTimeInput
        label="回放起点"
        labels={DATE_LABELS}
        locale="zh-CN"
        date={date}
        onDate={setDate}
        events={EXAMPLE_EVENTS}
        insight={EXAMPLE_INSIGHT}
      />
    </Row>
  )
}

export function CalendarEventsRow() {
  const [day, setDay] = useState('2026-11-20')
  return (
    <Row name="事件点与洞察（示例数据）">
      <Calendar
        label="转到日期"
        locale="zh-CN"
        labels={{ previousMonth: '上个月', nextMonth: '下个月' }}
        value={day}
        onValueChange={setDay}
        events={EXAMPLE_EVENTS}
        insight={EXAMPLE_INSIGHT}
      />
    </Row>
  )
}

export function RangeEventsRow() {
  const [range, setRange] = useState<DateRange | null>({ start: '2026-11-16', end: '2026-11-26' })
  return (
    <Row name="事件点与洞察（示例数据）">
      <DateRangePicker
        value={range}
        onValueChange={setRange}
        today="2026-11-20"
        labels={RANGE_LABELS}
        locale="zh-CN"
        events={EXAMPLE_EVENTS}
        insight={EXAMPLE_INSIGHT}
      />
    </Row>
  )
}

const isOpen = (day: string) => ![0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())

export function TradingEventsRow() {
  const [day, setDay] = useState<string | null>('2026-11-20')
  return (
    <Row name="事件点与洞察（示例数据）">
      <TradingDatePicker
        value={day}
        onValueChange={setDay}
        calendar={isOpen}
        events={EXAMPLE_EVENTS}
        insight={EXAMPLE_INSIGHT}
      />
    </Row>
  )
}

const IMPORT_LABELS: FileImportLabels = {
  sources: '资料来源',
  source: { upload: '上传', paste: '粘贴', link: '链接' },
  upload: {
    zone: '导入研究资料。拖文件到这里，或按键盘选择',
    idle: '拖入研报、因子表或回测结果，或点击选择',
    dragging: '松开即可导入',
    tooLarge: (count, limit) => `${count} 个文件超过 ${limit}，已忽略`,
  },
  list: '已添加的资料',
  count: (total) => `已添加 ${total} 份资料`,
  status: {
    queued: '等待中',
    uploading: (percent) => (percent === null ? '上传中' : `${percent}% 上传中`),
    done: '完成',
    failed: '失败',
  },
  retry: (name) => `重试 ${name}`,
  remove: (name) => `移除 ${name}`,
  paste: { label: '粘贴的文字', placeholder: '粘贴研报摘要、会议纪要……', submit: '添加' },
  link: { label: '资料链接', placeholder: 'https://', submit: '添加', invalid: '请输入以 http 或 https 开头的链接' },
}

export function FileImportDemo() {
  const [items, setItems] = useState<readonly ImportItem[]>(EXAMPLE_ITEMS)
  const [log, setLog] = useState('（还没有回调）')
  const seq = useRef(0)
  const add = (name: string, size: number | undefined, status: ImportItem['status'], progress?: number) => {
    const id = `n${(seq.current += 1)}`
    setItems((list) => [...list, { id, name, size, status, progress }])
  }
  const patch = (id: string, change: Partial<ImportItem>) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)))
  return (
    <div className="gal-wide" style={{ width: 460 }}>
      <FileImport
        items={items}
        accept=".pdf,.csv,.parquet"
        maxSize={25 * 1024 * 1024}
        labels={IMPORT_LABELS}
        onFiles={(files) => {
          setLog(`选了 ${files.map((file) => file.name).join('、')}`)
          for (const file of files) add(file.name, file.size, 'uploading', 0)
        }}
        onPaste={(text) => {
          setLog(`粘贴了 ${text.length} 个字`)
          add(text.slice(0, 24), undefined, 'done')
        }}
        onLink={(url) => {
          setLog(`链接 ${url}`)
          add(url, undefined, 'queued')
        }}
        onRetry={(id) => {
          setLog(`重试 ${id}`)
          patch(id, { status: 'uploading', progress: 0, error: undefined })
        }}
        onRemove={(id) => {
          // 演示调用方不同意：r1（62% 的那份上传）不让删，只记日志；别的照删。
          if (id === 'r1') return setLog(`拒绝移除 ${id}`)
          setLog(`移除 ${id}`)
          setItems((list) => list.filter((item) => item.id !== id))
        }}
      />
      <p className="gal-note" data-gallery-import-log>
        最近一次回调：{log}
      </p>
      <Row name="演示：推进进度（上传由调用方做，件只显示状态）">
        <Button size="sm" onClick={() => setItems((list) => list.filter((item) => item.id !== 'r1'))}>
          调用方撤掉第一行
        </Button>
        <Button
          size="sm"
          onClick={() =>
            setItems((list) =>
              list.map((item) =>
                item.status === 'uploading' ? { ...item, progress: Math.min(100, (item.progress ?? 0) + 25) } : item,
              ),
            )
          }
        >
          进度 +25%
        </Button>
        <Button
          size="sm"
          onClick={() =>
            setItems((list) =>
              list.map((item) =>
                item.status === 'uploading' && (item.progress ?? 0) >= 100 ? { ...item, status: 'done' } : item,
              ),
            )
          }
        >
          满了的标完成
        </Button>
        <Button
          size="sm"
          onClick={() =>
            setItems((list) =>
              list.map((item) =>
                item.status === 'uploading' ? { ...item, status: 'failed', error: '服务器没有响应' } : item,
              ),
            )
          }
        >
          上传中的标失败
        </Button>
      </Row>
    </div>
  )
}

const TEMPLATE_LABELS: TemplateLibraryLabels = {
  library: '模板库',
  search: '搜索模板',
  tree: '模板',
  results: (count) => `${count} 个模板匹配`,
  noMatch: '没有匹配的模板',
  empty: '在左边选一个模板',
  titleField: '模板名',
  titleEmpty: '模板名不能为空',
  bodyField: '模板正文',
  editHint: '按 Enter 或点一下来编辑',
  title: {
    editHint: '按 Enter 或点一下来改名',
    save: '保存模板名',
    cancel: '放弃修改模板名',
    saving: '正在保存',
    saved: '已保存',
    failed: (attempted) => `没能保存「${attempted}」`,
    retry: '重试',
  },
  save: '保存正文（⌘↵）',
  cancel: '放弃修改（Esc）',
  bodyFailed: '没能保存，已退回上次的正文',
  meta: '模板信息',
  copy: '复制',
  copied: '已复制',
  copyFailed: '复制失败',
  duplicate: '复制为我的模板',
  use: '使用模板',
  readOnly: '内置模板，不能修改',
}

function patchGroups(groups: readonly TemplateGroup[], id: string, change: { title?: string; body?: string }) {
  const apply = <T extends { id: string; children?: readonly T[] }>(entry: T): T =>
    entry.id === id
      ? { ...entry, ...change }
      : entry.children
        ? { ...entry, children: entry.children.map(apply) }
        : entry
  return groups.map((group) => ({ ...group, templates: group.templates.map(apply) }))
}

export function TemplateLibraryDemo() {
  const [groups, setGroups] = useState<readonly TemplateGroup[]>(EXAMPLE_TEMPLATES)
  const [log, setLog] = useState('（还没有回调）')
  return (
    <div className="gal-wide" style={{ width: 760 }}>
      <TemplateLibrary
        groups={groups}
        defaultValue="my-momentum"
        labels={TEMPLATE_LABELS}
        // 正文里写「拒绝保存」会被拒绝，演示保存失败：件退回旧文字，失败由调用方（这里是日志）提示。
        onSave={(id, change) => {
          if ('body' in change && change.body.includes('拒绝保存')) return Promise.reject(new Error('演示：拒绝保存'))
          setLog(`保存 ${id}：${'title' in change ? '标题' : '正文'}`)
          setGroups((current) => patchGroups(current, id, change))
        }}
        onSaveError={(id) => setLog(`保存失败 ${id}`)}
        onCopyError={(id) => setLog(`复制失败 ${id}`)}
        onUse={(id) => setLog(`使用模板 ${id}`)}
        onCopy={(id) => setLog(`复制了 ${id} 的文字`)}
        onDuplicate={(id) => setLog(`复制为我的模板 ${id}`)}
      />
      <p className="gal-note" data-gallery-template-log>
        最近一次回调：{log}
      </p>
    </div>
  )
}
