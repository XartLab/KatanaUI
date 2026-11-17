// SPDX-License-Identifier: MIT
import { useState, type FormEvent } from 'react'
import {
  Button,
  DateTimeInput,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  useFieldControl,
  type DateTimeLabels,
} from '../../src/index'
import { DecimalField } from '../../src/quant'
import type { Pattern } from './types'

const DT_LABELS: DateTimeLabels = {
  date: (label) => `${label}日期`,
  pickDate: (label) => `选择${label}日期`,
  calendar: (label) => `${label}日历`,
  time: (label) => `${label}时间`,
  previousMonth: '上个月',
  nextMonth: '下个月',
}

function NameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const control = useFieldControl()
  return <Input value={value} onChange={(e) => onChange(e.target.value)} {...control} />
}

function Demo() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('67000.5')
  const [date, setDate] = useState('2026-11-17')
  const [time, setTime] = useState('09:30')
  const [submitted, setSubmitted] = useState(false)
  const nameError = submitted && name.trim() === '' ? '请填策略名称' : null
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }
  return (
    <form onSubmit={submit} noValidate className="gal-stack" style={{ width: '100%', maxWidth: 360 }}>
      <p className="gal-note">演示：不提交到任何地方。名称留空再点「提交」看校验。</p>
      <Field invalid={nameError !== null}>
        <FieldLabel>策略名称</FieldLabel>
        <NameInput value={name} onChange={setName} />
        <FieldDescription>最多 40 字。</FieldDescription>
        {nameError ? <FieldError>{nameError}</FieldError> : null}
      </Field>
      <DecimalField label="限价" value={price} onValue={setPrice} step="0.5" unit="USDT" />
      <DateTimeInput
        label="开始"
        labels={DT_LABELS}
        locale="zh-CN"
        date={date}
        onDate={setDate}
        time={time}
        onTime={setTime}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button type="button" onClick={() => setSubmitted(false)}>
          重置
        </Button>
        <Button type="submit" variant="primary">
          提交
        </Button>
      </div>
      {submitted && !nameError ? <output>已提交（演示）</output> : null}
    </form>
  )
}

const pattern: Pattern = {
  id: 'forms',
  title: '表单',
  summary: '一列字段、统一的标签 + 说明 + 错误位，数字和日期用专门的输入件，提交时才集中校验。',
  Demo,
  use: ['新建 / 编辑一个有 3 个以上字段的对象：策略、预警、账户', '需要精确数值（价格、数量）或日期时间的输入'],
  avoid: ['改一个开关或一个值就生效的设置：用偏好设置的行，不用表单', '只有一个输入框的搜索或过滤：不要包 Field'],
  parts: [
    { page: 'field', role: '每个字段的壳：标签、说明、错误，invalid 时整体变红' },
    { page: 'input', role: '文本字段' },
    { page: 'decimal-field', role: '价格、数量：按步长加减，保留小数不丢精度' },
    { page: 'number-input', role: '整数和范围值（线宽、周期）' },
    { page: 'date-time-input', role: '日期 + 时间，一个字段内选完' },
    { page: 'select', role: '选项 ≤ 7 个的单选' },
    { page: 'button', role: '底部按钮条：重置 + primary 提交' },
  ],
  rules: [
    '单列，字段间距 16px，标签在输入框上方；表单宽 320–420px，不拉满页面',
    '说明（FieldDescription）写单位和范围，如「价格刻度 0.5」；错误（FieldError）只写怎么改',
    '校验在提交时统一做，错误字段从上往下排，焦点落到第一个错误字段；输入过程中不弹错',
    '价格和数量一律 DecimalField（字符串存值），不要用 Number 存，避免 0.1 + 0.2 的精度问题',
    '日期用 YYYY-MM-DD 存，时间 HH:mm，显示按用户时区；表单里写明时区',
    '必填是常态，选填的标签后面写「（选填）」，不用红星号',
    '提交按钮在右下，提交中禁用；成功后关闭或跳转，失败保留已填内容',
  ],
  source: { label: 'Salt · Forms', href: 'https://www.saltdesignsystem.com/salt/patterns/forms' },
}
export default pattern
