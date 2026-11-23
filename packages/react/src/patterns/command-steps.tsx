// SPDX-License-Identifier: MIT
/**
 * The step page of a multi-step palette command: header sentence, filter box, checklist (or caller content), footer.
 * 命令面板多步命令的步骤页（#194），CommandPalette 在选中带 steps 的命令后换上它，面板不关。
 * - 头部是一句话：命令名 + 每一步已做的选择以小标签串起来（「跑工资 在 [美国] 给 [研发][产品]」），随勾选实时更新，每步最多 3 个、其余折成 +N。
 * - 内置一种步：多选清单。cmdk 的行总是 role=option、aria-selected 说的是「高亮」，表达不了「已选」，所以这一页不用 cmdk 的行：
 *   行是 role=checkbox（aria-checked），全选行是三态（aria-checked=mixed），焦点留在筛选框里，高亮的那一行经 aria-activedescendant 指出（跟 cmdk 同一个手感）。
 * - 其余内容由调用方给（kind: 'custom' 的 render）；筛选框里的字也传给它。
 * - 键盘：↑ ↓ Home End 移动高亮，Enter 勾选高亮的行，Mod+Enter 主操作，输入为空时 Backspace 退回上一步，Esc 由对话框直接关面板。
 * 交互参照 Jamie Merrill 的 Command menu running a workflow（2026-11-24 看）：只借头部句子、全选三态、脚栏「已选 N · 返回 · 主操作」，皮肤是我们的（Graphite 的中性勾选框与 Tag，不用他的紫色勾与蓝色徽标）。
 */
import { SearchIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Tag } from '../katana/tag.tsx'
import { Button } from '../primitives/button.tsx'
import { menuRowBaseClass } from '../primitives/menu-parts.tsx'
import {
  checkState,
  filterOptions,
  moveActive,
  selectedLabels,
  sentenceTags,
  toggleAll,
  toggleId,
  type CheckState,
  type PaletteOption,
  type StepSelections,
} from './command-steps-model.ts'

export type PaletteStepBase = {
  /** Key of this step in the selections passed to onRun. */
  id: string
  /** Word before this step's tags in the header sentence (for example "in", "for"); written by the caller. */
  joiner?: string
  /** Heading above the list of this step. */
  heading?: string
  /** Placeholder of the filter box on this step; defaults to the palette's. */
  placeholder?: string
  /** Text of the primary button on this step; defaults to "Next" (or the run text on the last step). */
  actionLabel?: string
  /** Whether the primary button needs at least one selection. Default true. */
  required?: boolean
}

/** The built-in step: a checklist with a select-all row. */
export type PaletteChecklistStep = PaletteStepBase & {
  kind: 'checklist'
  options: readonly PaletteOption[]
  /** Text of the select-all row; defaults to the palette's labels. */
  selectAllLabel?: string
}

/** A step whose page the caller draws; its value is a list of ids like any other step. */
export type PaletteCustomStep = PaletteStepBase & {
  kind: 'custom'
  /** Header tags for the chosen ids; defaults to the ids themselves. */
  tags?: (selected: readonly string[]) => string[]
  render: (context: {
    selected: readonly string[]
    onSelectedChange: (next: readonly string[]) => void
    /** What is typed in the filter box. */
    search: string
  }) => ReactNode
}

export type PaletteStep = PaletteChecklistStep | PaletteCustomStep

/** Texts of the step pages, written by the caller (English fallbacks when not given). */
export type CommandStepsLabels = {
  /** Badge on a command row: "2 steps". */
  steps: (count: number) => string
  /** Left of the footer: "2 selected". */
  selected: (count: number) => string
  back: string
  next: string
  /** Primary button on the last step. */
  run: string
  selectAll: string
}

export const DEFAULT_STEP_LABELS: CommandStepsLabels = {
  steps: (count) => `${count} steps`,
  selected: (count) => `${count} selected`,
  back: 'Back',
  next: 'Next',
  run: 'Run',
  selectAll: 'Select all',
}

/** 头部标签的字色：中性 Tag 的前景在 Console 下对自己的底只有 4.28:1（axe 要 4.5），这里取正文色。 */
const TAG_STYLE = { '--k-tag-fg': 'var(--k-content-body-foreground)' } as CSSProperties
const SELECT_ALL = '\u0000all'

/** 勾选框的样子：与 Checkbox 一个皮肤（14 方、凹陷、选中亮底），但只是画出来的（行本身才是 role=checkbox）。 */
function Box({ state }: { state: CheckState }) {
  const name = state === 'mixed' ? 'indeterminate' : state ? 'checked' : 'unchecked'
  return (
    <span
      aria-hidden="true"
      data-slot="command-step-box"
      data-state={name}
      className="inline-flex size-[14px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-(color:--k-separable-bold-borderColor) bg-(--k-surface-sunken-background) shadow-[var(--recess)] transition-colors duration-150 data-[state=checked]:border-(color:--k-selectable-bold-background-selected) data-[state=checked]:bg-(--k-selectable-bold-background-selected) data-[state=indeterminate]:border-(color:--k-selectable-bold-background-selected) data-[state=indeterminate]:bg-(--k-selectable-bold-background-selected)"
    >
      {name !== 'unchecked' && (
        <span
          data-slot="checkbox-indicator"
          data-state={name}
          className="block size-[10px] text-(color:--k-selectable-bold-foreground-selected)"
        >
          <svg
            data-slot="checkbox-mark"
            viewBox="0 0 24 24"
            className="block size-full"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path data-mark="tick" pathLength={1} d="M20 6 9 17l-5-5" />
            <path data-mark="dash" pathLength={1} d="M5 12h14" />
          </svg>
        </span>
      )}
    </span>
  )
}

function Row({
  id,
  state,
  active,
  disabled,
  label,
  description,
  onToggle,
  onActivate,
}: {
  id: string
  state: CheckState
  active: boolean
  disabled?: boolean
  label: string
  description?: string
  onToggle: () => void
  onActivate: () => void
}) {
  return (
    <div
      id={id}
      role="checkbox"
      aria-checked={state}
      aria-disabled={disabled || undefined}
      data-slot="command-step-row"
      data-active={active || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        menuRowBaseClass,
        'group/row justify-start data-[active]:bg-(--k-selectable-subtle-background-hover) data-[active]:text-(color:--k-content-primary-foreground) data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
      )}
      // 点行不抢焦点：焦点一直在筛选框里（跟 cmdk 一样）。
      onMouseDown={(event) => event.preventDefault()}
      onPointerMove={disabled ? undefined : onActivate}
      onClick={disabled ? undefined : onToggle}
    >
      <Box state={state} />
      <span className="min-w-0 truncate">{label}</span>
      {description !== undefined && (
        <span className="k-text-caption min-w-0 truncate text-(color:--k-content-secondary-foreground) group-data-[active]/row:text-(color:--k-content-body-foreground)">
          {description}
        </span>
      )}
    </div>
  )
}

export type CommandStepsProps = {
  /** Command name: the start of the header sentence. */
  title: ReactNode
  icon?: ReactNode
  steps: readonly PaletteStep[]
  /** Index of the current step. */
  index: number
  selections: StepSelections
  onSelectionsChange: (next: StepSelections) => void
  labels: CommandStepsLabels
  /** Primary button text on the last step (the command's own, else labels.run). */
  runLabel?: string
  /** Placeholder of the filter box when the step has none. */
  placeholder: string
  /** Text when nothing matches the filter. */
  empty: string
  search: string
  onSearchChange: (search: string) => void
  /** Back one step (leaves the command from the first step). */
  onBack: () => void
  /** Primary button: next step, or run on the last. */
  onAdvance: () => void
}

/** 步骤页。焦点留在筛选框；换步时（step.id 变）高亮回到第一行、焦点回到筛选框。 */
export function CommandSteps({
  title,
  icon,
  steps,
  index,
  selections,
  onSelectionsChange,
  labels,
  runLabel,
  placeholder,
  empty,
  search,
  onSearchChange,
  onBack,
  onAdvance,
}: CommandStepsProps) {
  const step = steps[index]!
  const isLast = index === steps.length - 1
  const baseId = useId()
  const input = useRef<HTMLInputElement>(null)
  // 高亮记着是哪一步的：换步时 step.id 对不上，自然回到第一行，不用在 effect 里重置。
  const [highlight, setHighlight] = useState({ step: step.id, key: SELECT_ALL })
  const active = highlight.step === step.id ? highlight.key : SELECT_ALL
  const selected = selections[step.id] ?? []
  const setSelected = (next: readonly string[]) => onSelectionsChange({ ...selections, [step.id]: next })

  useEffect(() => {
    input.current?.focus()
  }, [step.id])

  // 头部句子：到当前步为止，每步有选择才画。
  const sentence = steps.slice(0, index + 1).flatMap((past) => {
    const chosen = selections[past.id] ?? []
    const tags =
      past.kind === 'checklist' ? selectedLabels(past.options, chosen) : (past.tags?.(chosen) ?? chosen.map(String))
    return tags.length > 0 ? [{ step: past, ...sentenceTags(tags) }] : []
  })

  const options = step.kind === 'checklist' ? filterOptions(step.options, search) : []
  const enabled = options.filter((option) => !option.disabled)
  const enabledIds = enabled.map((option) => option.id)
  const allState = checkState(enabledIds, selected)
  // 键盘能走到的行：全选（有可选项时）与没禁用的选项。
  const navIds = enabledIds.length > 0 ? [SELECT_ALL, ...enabledIds] : []
  const current = navIds.includes(active) ? active : (navIds[0] ?? '')
  // DOM id 按选项在表里的序号，不直接用选项 id（可能带空格，aria-activedescendant 要合法的 idref）。
  const rowId = (key: string) =>
    `${baseId}-${key === SELECT_ALL ? 'all' : step.kind === 'checklist' ? step.options.findIndex((o) => o.id === key) : key}`
  const activate = (key: string) => setHighlight({ step: step.id, key })
  const toggle = (key: string) => {
    if (key === SELECT_ALL) setSelected(toggleAll(selected, enabledIds))
    else setSelected(toggleId(selected, key))
  }
  const currentDomId = current === '' ? '' : rowId(current)
  useEffect(() => {
    if (currentDomId !== '') document.getElementById(currentDomId)?.scrollIntoView({ block: 'nearest' })
  }, [currentDomId])

  const needsChoice = step.required !== false && selected.length === 0
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 输入法组字中的按键（Enter 选字、Backspace 删拼音）不是我们的。
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
    const handled = () => {
      event.preventDefault()
      event.stopPropagation()
    }
    if (event.key === 'Backspace' && search === '') {
      // 按住 Backspace 删字删到空，后面连发的不算「退回」。
      handled()
      if (!event.repeat) onBack()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handled()
      if (!needsChoice) onAdvance()
      return
    }
    if (step.kind !== 'checklist') return
    const at = navIds.indexOf(current)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      handled()
      if (navIds.length > 0) activate(navIds[moveActive(at, event.key === 'ArrowDown' ? 1 : -1, navIds.length)]!)
    } else if (event.key === 'Home' || event.key === 'End') {
      handled()
      if (navIds.length > 0) activate(navIds[event.key === 'Home' ? 0 : navIds.length - 1]!)
    } else if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      handled()
      if (current !== '') toggle(current)
    }
  }

  const headingId = `${baseId}-heading`
  const listId = `${baseId}-list`
  return (
    <div data-slot="command-steps" data-step={step.id} className="flex flex-col">
      <div
        data-slot="command-steps-header"
        className="k-text-body flex min-h-11 flex-wrap items-center gap-x-1.5 gap-y-1 border-b border-(color:--k-separable-subtle-borderColor) px-3 py-2"
      >
        {icon !== undefined && (
          <span
            aria-hidden="true"
            className="flex shrink-0 text-(color:--k-content-secondary-foreground) [&_svg:not([class*=size-])]:size-4"
          >
            {icon}
          </span>
        )}
        <span className="text-(color:--k-content-primary-foreground)">{title}</span>
        {sentence.map(({ step: past, shown, hidden }) => (
          <span key={past.id} data-slot="command-steps-part" data-step={past.id} className="contents">
            {past.joiner !== undefined && (
              <span className="text-(color:--k-content-secondary-foreground)">{past.joiner}</span>
            )}
            {shown.map((tag) => (
              <Tag key={tag} data-slot="command-steps-tag" className="max-w-40 truncate" style={TAG_STYLE}>
                {tag}
              </Tag>
            ))}
            {hidden > 0 && (
              <Tag data-slot="command-steps-tag" data-more="" style={TAG_STYLE}>
                +{hidden}
              </Tag>
            )}
          </span>
        ))}
      </div>
      <div
        data-slot="command-input-wrapper"
        className="flex h-10 shrink-0 items-center gap-2 border-b border-(color:--k-separable-subtle-borderColor) px-3"
      >
        <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-(color:--k-content-secondary-foreground)" />
        <input
          ref={input}
          data-slot="command-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          aria-label={step.placeholder ?? placeholder}
          aria-controls={listId}
          aria-activedescendant={step.kind === 'checklist' && current !== '' ? rowId(current) : undefined}
          placeholder={step.placeholder ?? placeholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={onKeyDown}
          className="k-text-body h-full w-full border-0 bg-transparent text-(color:--k-content-primary-foreground) outline-0 placeholder:text-(color:--k-content-secondary-foreground)"
        />
      </div>
      <div
        id={listId}
        role="group"
        aria-labelledby={step.heading !== undefined ? headingId : undefined}
        aria-label={step.heading === undefined ? (step.placeholder ?? placeholder) : undefined}
        data-slot="command-steps-list"
        className="max-h-[300px] overflow-x-hidden overflow-y-auto p-1.5"
      >
        {step.heading !== undefined && (
          <div
            id={headingId}
            className="k-text-micro px-2 pt-2 pb-1 leading-normal text-(color:--k-content-body-foreground) uppercase"
          >
            {step.heading}
          </div>
        )}
        {step.kind === 'checklist' ? (
          options.length === 0 ? (
            <div className="k-text-data py-6 text-center text-(color:--k-content-secondary-foreground)">{empty}</div>
          ) : (
            <>
              {enabledIds.length > 0 && (
                <Row
                  id={rowId(SELECT_ALL)}
                  state={allState}
                  active={current === SELECT_ALL}
                  label={step.selectAllLabel ?? labels.selectAll}
                  onToggle={() => toggle(SELECT_ALL)}
                  onActivate={() => activate(SELECT_ALL)}
                />
              )}
              {options.map((option) => (
                <Row
                  key={option.id}
                  id={rowId(option.id)}
                  state={selected.includes(option.id)}
                  active={current === option.id}
                  disabled={option.disabled}
                  label={option.label}
                  description={option.description}
                  onToggle={() => toggle(option.id)}
                  onActivate={() => activate(option.id)}
                />
              ))}
            </>
          )
        ) : (
          step.render({ selected, onSelectedChange: setSelected, search })
        )}
      </div>
      <div
        data-slot="command-steps-footer"
        className="flex items-center gap-2 border-t border-(color:--k-separable-subtle-borderColor) px-3 py-2"
      >
        <span
          role="status"
          data-slot="command-steps-count"
          className="k-text-data mr-auto text-(color:--k-content-secondary-foreground)"
        >
          {labels.selected(selected.length)}
        </span>
        <Button size="sm" data-slot="command-steps-back" onClick={onBack}>
          {labels.back}
        </Button>
        <Button
          size="sm"
          variant="primary"
          data-slot="command-steps-primary"
          disabled={needsChoice}
          onClick={onAdvance}
        >
          {step.actionLabel ?? (isLast ? (runLabel ?? labels.run) : labels.next)}
        </Button>
      </div>
    </div>
  )
}
