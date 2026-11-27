// SPDX-License-Identifier: MIT
/**
 * Command palette on top of CommandDialog with a "Recent" group: selected commands are remembered (controlled, persisted or local).
 * 命令面板（#77 G9）：CommandDialog 加「最近」分组。选过的命令记在最前（去重、最多 recentLimit 条）；
 * 「最近」只在没输入时出现（输入时 cmdk 照常过滤全部命令，免得同一条出现两次）；记录受控（recent / onRecentChange）、
 * 或存进 localStorage（recentKey，经 usePersistedState），都不给就只记在这一页的内存里（刷新就没）。
 * 出处：TradingView 快速搜索（Ctrl/Cmd+K）会记住用过的命令作「最近」（其快速搜索帮助页，#22 G9）；2026-11-18 实看时那个账号没有最近记录，面板只显示占位。
 *
 * 行内说明与多步命令（#194）：行可带前缀图标、主文字后的灰色说明（description）、元信息徽标（meta，如「2 步」）；
 * 命令声明 steps 后，选中它面板不关、换成步骤页（command-steps.tsx）：头部句子（命令名 + 已做的选择小标签）、筛选框过滤当前步选项、
 * 多选清单（全选三态）、脚栏「已选 N · 返回 · 主操作」；最后一步的主操作调 onRun(命令 id, 各步的选择) 后关面板。
 * Backspace（输入为空）与「返回」退回上一步（第一步退回命令列表，选择清空）；Esc 直接关面板，焦点回打开前的元素（Dialog 的行为）。
 * 向后兼容：不带 description / meta / steps 的命令画得跟以前一样，onSelect 仍是同一个用法。
 * 交互参照 Jamie Merrill 的 Command menu 系列（2026-11-24 看）：只借交互，样子是我们的。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePersistedState } from '../lib/use-persisted-state.ts'
import { Tag } from '../katana/tag.tsx'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../primitives/command.tsx'
import { CommandSteps, DEFAULT_STEP_LABELS, type CommandStepsLabels, type PaletteStep } from './command-steps.tsx'
import { stepBack, type Flow, type StepSelections } from './command-steps-model.ts'

/** 面板里的一条命令。 */
export type PaletteCommand = {
  /** 稳定的 id（「最近」记它）。 */
  id: string
  label: string
  /** 分组名（调用方写好的字）；同名的排在一组，按第一次出现的先后。 */
  group?: string
  /** 搜索时也认的词（别名、英文名）。 */
  keywords?: readonly string[]
  /** 行尾的快捷键提示（写好的字或 Kbd）。 */
  shortcut?: ReactNode
  icon?: ReactNode
  /** Gray text after the label (plain text is also searched). */
  description?: string
  /** Small badge after the label, for example "2 steps"; commands with steps get labels.steps(count) when this is not given. */
  meta?: ReactNode
  /** Steps to walk through before running: selecting the command opens the first step instead of closing the palette. */
  steps?: readonly PaletteStep[]
  /** Text of the primary button on the last step; defaults to labels.steps.run. */
  runLabel?: string
  disabled?: boolean
  /** Called when the command is selected; not used for commands with steps (see onRun on the palette). */
  onSelect?: () => void
}

export type CommandPaletteLabels = {
  /** Dialog title for screen readers (not shown). */
  title: string
  /** Dialog description for screen readers (not shown). */
  description: string
  /** Placeholder of the search box. */
  placeholder: string
  /** Text when nothing matches. */
  empty: string
  /** Heading of the recent group. */
  recent: string
  /** Heading of commands without a group; defaults to none. */
  ungrouped?: string
  /** Texts of the step pages (badge, count, buttons); English fallbacks for any left out. */
  steps?: Partial<CommandStepsLabels>
}

export type CommandPaletteProps = {
  /** Whether the palette is open (controlled). */
  open: boolean
  /** Called when the palette opens or closes; selecting a command closes it. */
  onOpenChange: (open: boolean) => void
  /** All commands. */
  commands: readonly PaletteCommand[]
  /** Texts written by the caller. */
  labels: CommandPaletteLabels
  /** Recent command ids, newest first (controlled). */
  recent?: readonly string[]
  /** Called with the new recent list after a command is selected. */
  onRecentChange?: (next: string[]) => void
  /** localStorage key to keep the recent list when it is not controlled. */
  recentKey?: string
  /** How many recent commands to keep and show. Default 5. */
  recentLimit?: number
  /** Called when the primary button of the last step is pressed, with the command id and the chosen ids per step id; the palette closes after it. */
  onRun?: (commandId: string, selections: StepSelections) => void
}

/** 选了一条以后的最近列表：放到最前、去重、截到 limit（纯函数）。 */
export function pushRecent(recent: readonly string[], id: string, limit = 5): string[] {
  return [id, ...recent.filter((other) => other !== id)].slice(0, limit)
}

/** 最近的 id 换成还在的命令（删掉的命令不显示）。 */
export const recentCommands = (
  recent: readonly string[],
  commands: readonly PaletteCommand[],
  limit = 5,
): PaletteCommand[] =>
  recent
    .map((id) => commands.find((command) => command.id === id))
    .filter((command): command is PaletteCommand => command !== undefined)
    .slice(0, limit)

// 没给 recentKey 时的内存存储：只活在这个页面里（刷新就没），不写 localStorage。
const memory = new Map<string, string>()
const MEMORY = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  labels,
  recent: controlled,
  onRecentChange,
  recentKey,
  recentLimit = 5,
  onRun,
}: CommandPaletteProps) {
  // 不受控时：给了 recentKey 存进 localStorage，否则记在页内存里。
  const [stored, setStored] = usePersistedState<string[]>(recentKey ?? 'katana-ui:command-palette:memory', [], {
    version: 1,
    validate: isStringArray,
    storage: recentKey ? undefined : MEMORY,
  })
  const [search, setSearch] = useState('')
  const [flow, setFlow] = useState<Flow | null>(null)
  const recent = controlled ?? stored
  const remember = (id: string) => {
    const next = pushRecent(recent, id, recentLimit)
    if (controlled === undefined) setStored(next)
    onRecentChange?.(next)
  }
  // 每次重新打开都从命令列表开始：在 open 变 true 的那一次渲染里清掉（渲染期调整状态，不闪一帧旧的步骤页）。
  // 关的时候不清：退场动画里内容要留着，换成命令列表会在淡出时闪一下。
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setFlow(null)
      setSearch('')
    }
  }
  const flowCommand = flow === null ? undefined : commands.find((command) => command.id === flow.id)
  const flowSteps = flowCommand?.steps ?? []
  const pick = (command: PaletteCommand) => {
    if (command.steps !== undefined && command.steps.length > 0) {
      // 多步命令：面板不关，进第一步。
      setFlow({ id: command.id, index: 0, selections: {} })
      setSearch('')
      return
    }
    remember(command.id)
    onOpenChange(false)
    setSearch('')
    command.onSelect?.()
  }
  const stepLabels: CommandStepsLabels = { ...DEFAULT_STEP_LABELS, ...labels.steps }
  // 从第一步退回命令列表时，输入框是新挂上的，要把焦点还给它。不能用 autoFocus：它在 Radix 记下「打开前的焦点」之前就抢了焦点，关闭后焦点就回不到触发处。
  const input = useRef<HTMLInputElement>(null)
  const focusInput = useRef(false)
  useEffect(() => {
    if (flow === null && focusInput.current) input.current?.focus()
    focusInput.current = false
  }, [flow])
  const goBack = () => {
    if (flow === null) return
    const next = stepBack(
      flow,
      flowSteps.map((step) => step.id),
    )
    focusInput.current = next === null
    setFlow(next)
    setSearch('')
  }
  const advance = () => {
    if (flow === null || flowCommand === undefined) return
    if (flow.index < flowSteps.length - 1) {
      setFlow({ ...flow, index: flow.index + 1 })
      setSearch('')
      return
    }
    const selections = Object.fromEntries(flowSteps.map((step) => [step.id, flow.selections[step.id] ?? []]))
    remember(flowCommand.id)
    onOpenChange(false)
    onRun?.(flowCommand.id, selections)
  }
  const recentList = search === '' ? recentCommands(recent, commands, recentLimit) : []
  const groups = Map.groupBy(commands, (command) => command.group ?? '')
  const row = (command: PaletteCommand, prefix: string) => {
    const meta = command.meta ?? (command.steps?.length ? stepLabels.steps(command.steps.length) : undefined)
    return (
      <CommandItem
        key={`${prefix}${command.id}`}
        value={`${prefix}${command.id}`}
        keywords={[command.label, ...(command.keywords ?? []), ...(command.description ? [command.description] : [])]}
        disabled={command.disabled}
        onSelect={() => pick(command)}
        data-command={command.id}
        className="group/row"
      >
        {command.icon}
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{command.label}</span>
          {command.description !== undefined && (
            <span
              data-slot="command-description"
              // 高亮行的底变亮，次要色在 Console 下只有 4.4:1（axe 要 4.5），高亮时换成正文色。
              className="k-text-data min-w-0 truncate text-(color:--k-content-secondary-foreground) group-data-[selected=true]/row:text-(color:--k-content-body-foreground)"
            >
              {command.description}
            </span>
          )}
          {meta !== undefined && <Tag data-slot="command-meta">{meta}</Tag>}
        </span>
        {command.shortcut !== undefined && <CommandShortcut>{command.shortcut}</CommandShortcut>}
      </CommandItem>
    )
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch('')
        onOpenChange(next)
      }}
      title={labels.title}
      description={labels.description}
    >
      {flow !== null && flowCommand !== undefined && flowSteps.length > 0 ? (
        <CommandSteps
          title={flowCommand.label}
          icon={flowCommand.icon}
          steps={flowSteps}
          index={flow.index}
          selections={flow.selections}
          onSelectionsChange={(selections) => setFlow({ ...flow, selections })}
          labels={stepLabels}
          runLabel={flowCommand.runLabel}
          placeholder={labels.placeholder}
          empty={labels.empty}
          search={search}
          onSearchChange={setSearch}
          onBack={goBack}
          onAdvance={advance}
        />
      ) : (
        <>
          <CommandInput ref={input} placeholder={labels.placeholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            {recentList.length > 0 && (
              <CommandGroup heading={labels.recent} data-slot="command-recent">
                {recentList.map((command) => row(command, 'recent:'))}
              </CommandGroup>
            )}
            {[...groups].map(([group, list]) => (
              <CommandGroup key={group || '\u0000'} heading={group || labels.ungrouped}>
                {list.map((command) => row(command, ''))}
              </CommandGroup>
            ))}
          </CommandList>
        </>
      )}
    </CommandDialog>
  )
}
