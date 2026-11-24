// SPDX-License-Identifier: MIT
/**
 * 规则构建器里一行的各个格子（KatanaUI #223）：带分组的下拉、数字框（可空、带单位）、标签式多选、「引用另一个字段」的切换。
 * 只给 rule-builder.tsx 用，不进出口。没有任何文案：名字与说明都由 RuleBuilderLabels 传进来。
 */
import { Link2, Plus, X } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import { useState, type KeyboardEvent } from 'react'
import { Input } from '../../primitives/input.tsx'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../../patterns/combobox.tsx'
import { PopoverTrigger } from '../../primitives/popover.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../primitives/select.tsx'
import { cn } from '../../lib/cn.ts'
import type { RuleBuilderLabels } from './rule-labels.ts'
import {
  groupedFields,
  type RuleCondition,
  type RuleField,
  type RuleIssue,
  type RuleOperator,
  type RuleOption,
  type RuleSchema,
  type RuleValue,
} from './rule-model.ts'

/** 一个下拉项；group 为空串的不画分组标题。 */
export type RuleSelectGroup = { group: string; items: readonly { value: string; label: string }[] }

/** 带分组的单选下拉，触发器与列表用包里的 Select。 */
export function RuleSelect({
  value,
  onValueChange,
  groups,
  label,
  placeholder,
  part,
  invalid,
  describedBy,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  groups: readonly RuleSelectGroup[]
  label: string
  placeholder?: string
  part: string
  invalid?: boolean
  describedBy?: string
  className?: string
}) {
  return (
    <Select value={value === '' ? undefined : value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? describedBy : undefined}
        data-part={part}
        className={cn('k-rb-select min-w-0', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.map(({ group, items }) =>
          group === '' ? (
            items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))
          ) : (
            <SelectPrimitive.Group key={group}>
              <SelectPrimitive.Label className="k-rb-select-label">{group}</SelectPrimitive.Label>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPrimitive.Group>
          ),
        )}
      </SelectContent>
    </Select>
  )
}

/** 字段下拉的分组（保持字段次序）。 */
export const fieldGroups = (fields: readonly RuleField[]): RuleSelectGroup[] =>
  groupedFields(fields).map(({ group, fields: list }) => ({
    group,
    items: list.map((field) => ({ value: field.key, label: field.label })),
  }))

const formatNumber = (value: number | null): string => (value === null ? '' : String(value))
const parseNumber = (text: string): number | null => {
  if (text.trim() === '') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

/**
 * 数字框：可以是空的（空就是「必填缺失」），写到一半的 `1.` 不被吞掉；单位写在框里右边；↑↓ 按步长改（Alt 留给整行挪动，不拦）。
 * 值是 number 或 null；文字是内部的草稿，值变了（撤销、外部改）而草稿解析出来不是这个值时，草稿跟着换。
 */
export function NumberField({
  value,
  onValueChange,
  unit,
  step = 1,
  label,
  part,
  invalid,
  describedBy,
  width = 104,
}: {
  value: number | null
  onValueChange: (value: number | null) => void
  unit?: string
  step?: number
  label: string
  part: string
  invalid?: boolean
  describedBy?: string
  width?: number
}) {
  const [text, setText] = useState(formatNumber(value))
  const [seen, setSeen] = useState(value)
  if (seen !== value) {
    setSeen(value)
    if (parseNumber(text) !== value) setText(formatNumber(value))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
    event.preventDefault()
    const amount = event.shiftKey ? step * 10 : step
    const next = Number(((parseNumber(text) ?? 0) + (event.key === 'ArrowUp' ? amount : -amount)).toFixed(10))
    setText(String(next))
    onValueChange(next)
  }
  return (
    <span className="k-rb-numwrap" style={{ width }}>
      <Input
        inputMode="decimal"
        autoComplete="off"
        value={text}
        unit={unit}
        align="end"
        aria-label={label}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? describedBy : undefined}
        data-part={part}
        onChange={(event) => {
          setText(event.target.value)
          onValueChange(parseNumber(event.target.value))
        }}
        onKeyDown={onKeyDown}
      />
    </span>
  )
}

/** 多选成标签：已选的是带删除钮的标签，末尾一个「加」按钮开可搜索的勾选列表（不收，点一项切一项）。 */
export function ListValue({
  values,
  options,
  onValuesChange,
  label,
  labels,
  invalid,
  describedBy,
}: {
  values: readonly string[]
  options: readonly RuleOption[]
  onValuesChange: (values: string[]) => void
  label: string
  labels: Pick<RuleBuilderLabels, 'addValue' | 'searchValue' | 'noValue' | 'removeValue'>
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const nameOf = (key: string) => options.find((option) => option.value === key)?.label ?? key
  const toggle = (key: string) =>
    onValuesChange(
      options
        .map((option) => option.value)
        .filter((other) => (other === key ? !values.includes(key) : values.includes(other))),
    )
  return (
    <div
      className="k-rb-chips"
      role="group"
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? describedBy : undefined}
      data-part="value"
      data-invalid={invalid ? '' : undefined}
    >
      {values.map((key) => (
        <span key={key} className="k-rb-chip" data-slot="rule-chip" data-value={key}>
          {nameOf(key)}
          <button
            type="button"
            className="k-rb-chip-x"
            aria-label={labels.removeValue(nameOf(key))}
            onClick={() => onValuesChange(values.filter((item) => item !== key))}
          >
            <X aria-hidden="true" />
          </button>
        </span>
      ))}
      <Combobox open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="k-rb-chip-add"
            data-slot="rule-chip-add"
            aria-label={labels.addValue}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <Plus aria-hidden="true" />
            {values.length === 0 ? labels.addValue : null}
          </button>
        </PopoverTrigger>
        <ComboboxContent label={labels.searchValue} className="k-rb-picker">
          <ComboboxInput placeholder={labels.searchValue} />
          <ComboboxList>
            <ComboboxEmpty>{labels.noValue}</ComboboxEmpty>
            {options.map((option) => (
              <ComboboxItem
                key={option.value}
                value={option.value}
                keywords={[option.label]}
                selected={values.includes(option.value)}
                onSelect={() => toggle(option.value)}
              >
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

/** 一个条件的值格：按运算符的 input 画数字、区间、选项、标签、文字，数字可以切成「引用另一个字段」。 */
export function ValueEditor({
  condition,
  field,
  operator,
  schema,
  labels,
  issues,
  describedBy,
  onChange,
}: {
  condition: RuleCondition
  field: RuleField
  operator: RuleOperator
  schema: RuleSchema
  labels: RuleBuilderLabels
  /** 这一行要显示的问题（已按「显示时机」筛过）。 */
  issues: readonly RuleIssue[]
  describedBy: string
  onChange: (value: RuleValue) => void
}) {
  const value = condition.value
  const bad = (part: string) => issues.some((issue) => issue.part === part)
  if (operator.input === 'number' || value.kind === 'ref') {
    const ref = value.kind === 'ref'
    const numbers = schema.fields.filter((other) => other.type === 'number' && other.key !== field.key)
    return (
      <>
        {ref ? (
          <RuleSelect
            value={value.field ?? ''}
            onValueChange={(next) => onChange({ kind: 'ref', field: next })}
            groups={fieldGroups(numbers)}
            label={labels.refField}
            placeholder={labels.refPlaceholder}
            part="value"
            invalid={bad('value')}
            describedBy={describedBy}
          />
        ) : (
          <NumberField
            value={value.kind === 'number' ? value.value : null}
            onValueChange={(next) => onChange({ kind: 'number', value: next })}
            unit={field.unit}
            step={field.step}
            label={labels.value}
            part="value"
            invalid={bad('value')}
            describedBy={describedBy}
          />
        )}
        {operator.allowRef === true && numbers.length > 0 && (
          <button
            type="button"
            className="k-rb-ref"
            data-slot="rule-ref"
            aria-pressed={ref}
            aria-label={labels.refToggle}
            title={labels.refToggle}
            onClick={() => onChange(ref ? { kind: 'number', value: null } : { kind: 'ref', field: null })}
          >
            <Link2 aria-hidden="true" />
          </button>
        )}
      </>
    )
  }
  if (operator.input === 'range') {
    const range = value.kind === 'range' ? value : { kind: 'range' as const, min: null, max: null }
    return (
      <span className="k-rb-range" role="group" aria-label={labels.value}>
        <NumberField
          value={range.min}
          onValueChange={(next) => onChange({ ...range, min: next })}
          unit={field.unit}
          step={field.step}
          label={labels.min}
          part="min"
          invalid={bad('min')}
          describedBy={describedBy}
          width={96}
        />
        <span className="k-rb-range-to" aria-hidden="true">
          {labels.rangeTo}
        </span>
        <NumberField
          value={range.max}
          onValueChange={(next) => onChange({ ...range, max: next })}
          unit={field.unit}
          step={field.step}
          label={labels.max}
          part="max"
          invalid={bad('max')}
          describedBy={describedBy}
          width={96}
        />
      </span>
    )
  }
  if (operator.input === 'option') {
    return (
      <RuleSelect
        value={value.kind === 'text' ? value.value : ''}
        onValueChange={(next) => onChange({ kind: 'text', value: next })}
        groups={[{ group: '', items: field.options ?? [] }]}
        label={labels.value}
        placeholder={labels.valuePlaceholder}
        part="value"
        invalid={bad('value')}
        describedBy={describedBy}
      />
    )
  }
  if (operator.input === 'list') {
    return (
      <ListValue
        values={value.kind === 'list' ? value.values : []}
        options={field.options ?? []}
        onValuesChange={(next) => onChange({ kind: 'list', values: next })}
        label={labels.value}
        labels={labels}
        invalid={bad('value')}
        describedBy={describedBy}
      />
    )
  }
  return (
    <Input
      autoComplete="off"
      value={value.kind === 'text' ? value.value : ''}
      aria-label={labels.value}
      aria-invalid={bad('value') ? true : undefined}
      aria-describedby={bad('value') ? describedBy : undefined}
      data-part="value"
      className="k-rb-text-input"
      onChange={(event) => onChange({ kind: 'text', value: event.target.value })}
    />
  )
}
