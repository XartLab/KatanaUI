// SPDX-License-Identifier: MIT
import { ChevronDownIcon, EllipsisIcon, PlusIcon, Redo2Icon, Trash2Icon, Undo2Icon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Input } from '../primitives/input.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { conditionText, groupFields, type FilterCondition, type FilterField } from './filter-bar-model.ts'

// 过滤条（选股器的顶部过滤行）：一行可换行的胶囊，每个胶囊是一个字段；点开浮层：标题加垃圾桶（把这个过滤从条上拿掉）、搜索框、
// 预设条件列表（主文字 + 灰色副标题）、底部「手动设置」（运算符 + 值）。最后是「+」（弹出按分组列出所有字段的浮层，分组带计数，进组再选字段）与「⋯」（重置全部条件）。
// 照 TradingView 选股器（主会话 2026-11-15 登录态实测 tradingview.com/screener/；胶囊 Price、Chg %、Mkt cap、P/E… 的浮层预设如「Above 100 / Fractional shares time」「10 to 100 / Mid-priced」），实现原创。
// 字段、运算符、预设、文字全由调用方传；条件是受控的（value / onChange），件不过滤数据：调用方用 applyFilters 或自己的方式过滤。哪些字段在条上是件里的状态（defaultShown）。

export type FilterBarLabels = {
  /** 整条的读屏名。 */
  bar: string
  /** 「+」的读屏名与浮层标题。 */
  add: string
  /** 「⋯」的读屏名。 */
  more: string
  reset: string
  search: string
  noMatch: string
  presets: string
  manual: string
  operator: string
  value: string
  apply: string
  /** 从条上拿掉这个过滤。 */
  remove: string
  /** 清除这个字段的条件。 */
  clear: string
  back: string
  otherGroup: string
  /** 撤销 / 重做按钮的读屏名；两个都不传就没有这一对按钮（照 TradingView 选股器标题行的撤销重做，2026-11-15 实测）。 */
  undo?: string
  redo?: string
}

export type FilterBarProps = {
  fields: readonly FilterField[]
  value: readonly FilterCondition[]
  onChange: (next: FilterCondition[]) => void
  labels: FilterBarLabels
  /** 条上一开始有哪些字段（键）；不给就取 field.shown 为真的，再没有就取前 6 个。 */
  defaultShown?: readonly string[]
  className?: string
}

let counter = 0
const nextId = () => `c${(counter += 1)}`

function FieldPill({
  field,
  conditions,
  labels,
  onSet,
  onClear,
  onRemove,
}: {
  field: FilterField
  conditions: readonly FilterCondition[]
  labels: FilterBarLabels
  onSet: (op: string, value: string, label?: string) => void
  onClear: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [op, setOp] = useState(field.operators[0]?.value ?? '')
  const [value, setValue] = useState('')
  const id = useId()
  const needle = query.trim().toLowerCase()
  const presets = (field.presets ?? []).filter(
    (p) => needle === '' || `${p.label} ${p.hint ?? ''}`.toLowerCase().includes(needle),
  )
  const active = conditions[0]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="k-fbar-pill"
          data-slot="filter-pill"
          data-field={field.key}
          data-active={active ? '' : undefined}
        >
          <span>{field.label}</span>
          {active ? <span className="k-fbar-pill-value">{conditionText(active, field)}</span> : null}
          <ChevronDownIcon size={12} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="k-fbar-pop" aria-label={field.label}>
        <div className="k-fbar-pop-head">
          <b>{field.label}</b>
          <span>
            {active ? (
              <Button size="sm" variant="ghost" onClick={onClear}>
                {labels.clear}
              </Button>
            ) : null}
            <Button size="icon" variant="ghost" aria-label={`${labels.remove} ${field.label}`} onClick={onRemove}>
              <Trash2Icon aria-hidden="true" />
            </Button>
          </span>
        </div>
        {(field.presets?.length ?? 0) > 0 && (
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {(field.presets?.length ?? 0) > 0 && (
          <ul className="k-fbar-presets" aria-label={labels.presets}>
            {presets.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  data-preset={p.key}
                  onClick={() => {
                    onSet(p.op, p.value, p.label)
                    setOpen(false)
                  }}
                >
                  <span>{p.label}</span>
                  {p.hint ? <small>{p.hint}</small> : null}
                </button>
              </li>
            ))}
            {presets.length === 0 && <li className="k-fbar-empty">{labels.noMatch}</li>}
          </ul>
        )}
        <form
          className="k-fbar-manual"
          aria-label={labels.manual}
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim() === '') return
            onSet(op, value.trim())
            setOpen(false)
          }}
        >
          <b>{labels.manual}</b>
          <select aria-label={labels.operator} value={op} onChange={(e) => setOp(e.target.value)} id={`${id}-op`}>
            {field.operators.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Input
            size="sm"
            aria-label={labels.value}
            placeholder={labels.value}
            inputMode={field.input === 'text' ? 'text' : 'decimal'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button size="sm" type="submit">
            {labels.apply}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export function FilterBar({ fields, value, onChange, labels, defaultShown, className }: FilterBarProps) {
  const [shown, setShown] = useState<string[]>(() => {
    if (defaultShown) return [...defaultShown]
    const flagged = fields.filter((f) => f.shown).map((f) => f.key)
    return flagged.length > 0 ? flagged : fields.slice(0, 6).map((f) => f.key)
  })
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)

  const groups = useMemo(() => groupFields(fields, query, labels.otherGroup), [fields, query, labels.otherGroup])
  const byKey = new Map(fields.map((f) => [f.key, f]))
  const showField = (key: string) => setShown((prev) => (prev.includes(key) ? prev : [...prev, key]))
  // 撤销 / 重做：件自己记过滤条件的快照；只记这个件改的，调用方从外面换掉条件（切换保存的视图）不进栈。
  const [history, setHistory] = useState<{ past: FilterCondition[][]; future: FilterCondition[][] }>({
    past: [],
    future: [],
  })
  const commit = (next: FilterCondition[]) => {
    setHistory((h) => ({ past: [...h.past, [...value]].slice(-50), future: [] }))
    onChange(next)
  }
  const undo = () => {
    const prev = history.past.at(-1)
    if (!prev) return
    setHistory({ past: history.past.slice(0, -1), future: [[...value], ...history.future] })
    onChange(prev)
  }
  const redo = () => {
    const next = history.future[0]
    if (!next) return
    setHistory({ past: [...history.past, [...value]], future: history.future.slice(1) })
    onChange(next)
  }
  const set = (field: string, op: string, v: string, label?: string) =>
    commit([...value.filter((c) => c.field !== field), { id: nextId(), field, op, value: v, label }])

  return (
    <div className={cn('k-fbar', className)} role="group" aria-label={labels.bar} data-slot="filter-bar">
      {labels.undo && labels.redo ? (
        <span className="k-fbar-history">
          <Button
            size="icon"
            variant="ghost"
            aria-label={labels.undo}
            data-slot="filter-undo"
            disabled={history.past.length === 0}
            onClick={undo}
          >
            <Undo2Icon aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={labels.redo}
            data-slot="filter-redo"
            disabled={history.future.length === 0}
            onClick={redo}
          >
            <Redo2Icon aria-hidden="true" />
          </Button>
        </span>
      ) : null}
      {shown.flatMap((key) => {
        const field = byKey.get(key)
        return field
          ? [
              <FieldPill
                key={key}
                field={field}
                conditions={value.filter((c) => c.field === key)}
                labels={labels}
                onSet={(op, v, label) => set(key, op, v, label)}
                onClear={() => commit(value.filter((c) => c.field !== key))}
                onRemove={() => {
                  setShown((prev) => prev.filter((k) => k !== key))
                  commit(value.filter((c) => c.field !== key))
                }}
              />,
            ]
          : []
      })}
      <Popover
        open={addOpen}
        onOpenChange={(next) => {
          setAddOpen(next)
          if (!next) {
            setQuery('')
            setGroup(null)
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={labels.add} data-slot="filter-add">
            <PlusIcon aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="k-fbar-pop" aria-label={labels.add}>
          <div className="k-fbar-pop-head">
            <b>{labels.add}</b>
          </div>
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() === '' && group === null ? (
            <ul className="k-fbar-groups">
              {groups.map((g) => (
                <li key={g.group}>
                  <button type="button" data-group={g.group} onClick={() => setGroup(g.group)}>
                    <span>{g.group}</span>
                    <small>{g.fields.length}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {group !== null && query.trim() === '' ? (
                <Button size="sm" variant="ghost" onClick={() => setGroup(null)}>
                  {labels.back}
                </Button>
              ) : null}
              <ul className="k-fbar-groups">
                {groups
                  .filter((g) => query.trim() !== '' || g.group === group)
                  .flatMap((g) => g.fields)
                  .map((f) => (
                    <li key={f.key}>
                      <button
                        type="button"
                        data-field-option={f.key}
                        aria-disabled={shown.includes(f.key) || undefined}
                        onClick={() => {
                          showField(f.key)
                          setAddOpen(false)
                        }}
                      >
                        <span>{f.label}</span>
                      </button>
                    </li>
                  ))}
                {groups.length === 0 && <li className="k-fbar-empty">{labels.noMatch}</li>}
              </ul>
            </>
          )}
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={labels.more} data-slot="filter-more">
            <EllipsisIcon aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="k-fbar-pop k-fbar-menu">
          <Button size="sm" variant="ghost" disabled={value.length === 0} onClick={() => commit([])}>
            {labels.reset}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
