// SPDX-License-Identifier: MIT
/**
 * Flow builder: an automation laid out top to bottom on a pannable canvas; a + on each line adds a step from your templates, a branch forks into named paths side by side, and a test run lights up the step at work.
 * 流程编排（KATANAview #1908 第三批）：一条自动化（收盘后拉数据 → 条件 → 发提醒 / 交给 Agent）自上而下摆在一块可拖动、两向滚动的画布上，打开时居中。
 * 第一步总是触发；每条线上有个「+」，点开是调用方给的模板菜单（流程为空时是「加触发」与触发模板）；条件步（branch）分出几条有名字的路并排画，每条路又是一列步骤，最后汇回主线。
 * 步骤可上下挪（Alt+↑↓，只在自己那一列里）、删（Backspace，删条件步时第一条路的步骤留在原处）、撤销（Ctrl/⌘+Z）；选中一步回调 onSelect，检查器由调用方开。
 * 测试运行：给了 onRun 且至少两步时出「测试运行」，跑的时候换成「停止」；每步的状态（在跑 / 通过 / 失败 / 跳过）与开始、结束时间由调用方的 run 给，整条路都跳过的变淡，在跑的步写它的 note。
 * 功能参照 affectUI 的 Flow Builder（affectui.com/components/flow-builder，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 为什么不用 Whiteboard（React Flow 的自由画布）做底座：这里的流程是有结构的树（一个触发、条件分出的路最后汇回），结构由数据保证、不靠连线；
 * 键盘照读的次序走步骤（不是按画布坐标）；affectUI 也写明自由连线的图用画布库，那是 Whiteboard 的活。复用的是 Whiteboard 的做法：受控文档、整份回调、撤销存快照。
 * 跟它不同：件不取时间（耗时由 run 的开始结束与调用方的 now 算）；在跑的步不做流光动画，只换边色并写 note。纯逻辑在 flow-model.ts。包里不带语言。
 */
import { Bot, GitBranch, Hourglass, Play, Plus, Square, Undo2, Zap } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu.tsx'
import {
  flowElapsed,
  flowOrder,
  freshId,
  fromTemplate,
  insertStep,
  locateStep,
  moveStep,
  pathSkipped,
  removeStep,
  runCounts,
  type FlowRun,
  type FlowSlot,
  type FlowStep,
  type FlowStepKind,
  type FlowStepStatus,
  type FlowTemplate,
} from './flow-model.ts'

/** Texts of FlowBuilder (the package ships no text). */
export type FlowBuilderLabels = {
  /** Heading when no name is given. */
  untitled: string
  /** Accessible name of the scrolling canvas. */
  canvas: string
  /** Kind words, read with each step. */
  kind: Record<FlowStepKind, string>
  /** Status words read with each step; idle is usually empty. */
  status: Record<FlowStepStatus, string>
  /** Name of the add button below a step. */
  addAfter: (title: string) => string
  /** Name of the add button at the top of a path. */
  addInPath: (path: string) => string
  /** Text of the add button of an empty flow. */
  addTrigger: string
  /** Accessible name of the add menu. */
  menu: string
  /** Test-run, stop and undo buttons. */
  run: string
  stop: string
  undo: string
  /** Hint read with each step: the keys that move and remove it. */
  hint: string
  /** Live lines after adding, removing, moving and undoing. */
  added: (title: string) => string
  removed: (title: string) => string
  moved: (title: string) => string
  undone: string
  /** Live line when a test run ends. */
  finished: (counts: Record<FlowStepStatus, number>) => string
  /** Path names of a new branch whose template names none. */
  defaultPaths: readonly string[]
}

export type FlowBuilderProps = {
  /** Workflow name in the header. */
  name?: ReactNode
  /** Steps, controlled. */
  steps?: readonly FlowStep[]
  /** Steps at first, uncontrolled. */
  defaultSteps?: readonly FlowStep[]
  /** Called with the whole new list after every add, move, remove and undo. */
  onStepsChange?: (steps: readonly FlowStep[]) => void
  /** Test-run state per step id. */
  run?: Readonly<Record<string, FlowRun>>
  /** Clock in milliseconds for the elapsed time of running steps; the component does not tick on its own. */
  now?: number
  /** Whether a test run is going; defaults to whether any step is running. */
  running?: boolean
  /** Selected step id, controlled. */
  selected?: string | null
  /** Selected step id at first, uncontrolled. */
  defaultSelected?: string | null
  /** Called with the selected step id, or null when cleared; open your inspector here. */
  onSelect?: (id: string | null) => void
  /** Shows Test run once the flow has two steps. */
  onRun?: () => void
  /** Shows Stop while a test run is going. */
  onStop?: () => void
  /** Entries of the add menu below the trigger. */
  templates: readonly FlowTemplate[]
  /** Entries of the add menu of an empty flow. */
  triggers: readonly FlowTemplate[]
  /** Canvas height in px. */
  height?: number
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Icon of a step; defaults to one per kind. */
  renderIcon?: (step: FlowStep) => ReactNode
  /** Texts. */
  labels: FlowBuilderLabels
  /** Extra class name on the root. */
  className?: string
}

const KIND_ICON: Record<FlowStepKind, ReactNode> = {
  trigger: <Zap aria-hidden="true" />,
  action: <Play aria-hidden="true" />,
  agent: <Bot aria-hidden="true" />,
  branch: <GitBranch aria-hidden="true" />,
  wait: <Hourglass aria-hidden="true" />,
}

/** 撤销最多记几步：每步存整份步骤快照（几十步的流程很小），照 Whiteboard 的 HISTORY_LIMIT。 */
const HISTORY_LIMIT = 100

export function FlowBuilder({
  name,
  steps: stepsProp,
  defaultSteps,
  onStepsChange,
  run,
  now,
  running: runningProp,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  onRun,
  onStop,
  templates,
  triggers,
  height = 420,
  formatDuration,
  renderIcon,
  labels,
  className,
}: FlowBuilderProps) {
  const [inner, setInner] = useState<readonly FlowStep[]>(defaultSteps ?? [])
  const [innerSelected, setInnerSelected] = useState<string | null>(defaultSelected)
  const [past, setPast] = useState<readonly (readonly FlowStep[])[]>([])
  const [live, setLive] = useState('')
  const steps = stepsProp ?? inner
  const selected = selectedProp !== undefined ? selectedProp : innerSelected
  const running = runningProp ?? Object.values(run ?? {}).some((entry) => entry.status === 'running')
  // 一次测试运行结束（running 由真变假）时播报结果：在渲染时比上一次的值，不用 effect。
  const [wasRunning, setWasRunning] = useState(running)
  if (wasRunning !== running) {
    setWasRunning(running)
    if (!running) setLive(labels.finished(runCounts(run)))
  }
  const hintId = useId()
  const canvas = useRef<HTMLDivElement>(null)
  const items = useRef(new Map<string, HTMLButtonElement>())
  const focusNext = useRef<string | null>(null)
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const order = flowOrder(steps)

  useEffect(() => {
    if (focusNext.current === null) return
    items.current.get(focusNext.current)?.focus()
    focusNext.current = null
  })
  // 打开时把流程摆在画布正中（画布比流程宽时 scrollWidth 等于 clientWidth，不动）。
  useLayoutEffect(() => {
    const el = canvas.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  const write = (next: readonly FlowStep[]) => {
    if (stepsProp === undefined) setInner(next)
    onStepsChange?.(next)
  }
  const commit = (next: readonly FlowStep[], message: string) => {
    setPast([...past, steps].slice(-HISTORY_LIMIT))
    write(next)
    setLive(message)
  }
  const undo = () => {
    const previous = past.at(-1)
    if (previous === undefined) return
    setPast(past.slice(0, -1))
    write(previous)
    setLive(labels.undone)
  }
  const select = (id: string | null) => {
    if (selectedProp === undefined) setInnerSelected(id)
    onSelect?.(id)
  }
  const add = (slot: FlowSlot, template: FlowTemplate) => {
    const id = freshId(steps, template.key)
    const step = fromTemplate(template, id, labels.defaultPaths)
    commit(insertStep(steps, slot, step), labels.added(step.title))
    focusNext.current = id
  }
  const remove = (id: string) => {
    const title = locateStep(steps, id)?.step.title ?? id
    const result = removeStep(steps, id)
    if (result === null) return
    commit(result.steps, labels.removed(title))
    if (selected === id) select(null)
    focusNext.current = result.focus
  }
  const move = (id: string, delta: -1 | 1) => {
    const next = moveStep(steps, id, delta)
    if (next === null) return
    commit(next, labels.moved(locateStep(steps, id)?.step.title ?? id))
    focusNext.current = id
  }
  const focus = (id: string | undefined) => {
    if (id !== undefined) items.current.get(id)?.focus()
  }

  const onStepKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      move(id, event.key === 'ArrowUp' ? -1 : 1)
      return
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const at = order.indexOf(id)
    const target =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? order[Math.min(order.length - 1, at + 1)]
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? order[Math.max(0, at - 1)]
          : event.key === 'Home'
            ? order[0]
            : event.key === 'End'
              ? order.at(-1)
              : undefined
    if (target !== undefined) {
      event.preventDefault()
      focus(target)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      remove(id)
    }
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('input, textarea, [role="menu"]')) return
    if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      undo()
    } else if (event.key === 'Escape' && selected !== null) {
      event.preventDefault()
      select(null)
    }
  }
  // 拖空白处平移画布（点在步骤、「+」或菜单上不拖）。
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const el = canvas.current
    if (el === null || event.button !== 0 || (event.target as HTMLElement).closest('button, [role="menu"]')) return
    pan.current = { x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
    el.setPointerCapture(event.pointerId)
    el.dataset.panning = ''
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = canvas.current
    const start = pan.current
    if (el === null || start === null) return
    el.scrollLeft = start.left - (event.clientX - start.x)
    el.scrollTop = start.top - (event.clientY - start.y)
  }
  const endPan = () => {
    pan.current = null
    if (canvas.current) delete canvas.current.dataset.panning
  }

  const renderAdd = (slot: FlowSlot, label: string, menu: readonly FlowTemplate[], text?: string) =>
    menu.length === 0 ? null : (
      <div className="k-fb-add" data-slot="flow-add" data-wide={text === undefined ? undefined : ''}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="k-fb-plus"
              aria-label={text === undefined ? label : undefined}
              title={text === undefined ? label : undefined}
            >
              <Plus aria-hidden="true" />
              {text}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            aria-label={labels.menu}
            className="k-fb-menu"
            onCloseAutoFocus={(event) => {
              // 选了一项：焦点去新加的那一步，不回「+」。
              if (focusNext.current === null) return
              event.preventDefault()
              focus(focusNext.current)
            }}
          >
            {menu.map((template) => (
              <DropdownMenuItem key={template.key} className="k-fb-menu-item" onSelect={() => add(slot, template)}>
                {KIND_ICON[template.kind]}
                <span>
                  <span>{template.title}</span>
                  {template.detail !== undefined && <small>{template.detail}</small>}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )

  const renderStep = (step: FlowStep) => {
    const entry = run?.[step.id]
    const status = entry?.status ?? 'idle'
    const elapsed = flowElapsed(entry, now)
    const second = status === 'running' && step.note !== undefined ? step.note : step.detail
    return (
      <button
        ref={(node) => {
          if (node) items.current.set(step.id, node)
          else items.current.delete(step.id)
        }}
        type="button"
        className="k-fb-step"
        data-slot="flow-step"
        data-id={step.id}
        data-kind={step.kind}
        data-status={status}
        aria-pressed={selected === step.id}
        aria-label={[labels.kind[step.kind], step.title, labels.status[status]].filter(Boolean).join('，')}
        aria-describedby={hintId}
        title={step.title}
        onClick={() => select(selected === step.id ? null : step.id)}
        onKeyDown={(event) => onStepKey(event, step.id)}
      >
        <span className="k-fb-icon" aria-hidden="true">
          {renderIcon?.(step) ?? KIND_ICON[step.kind]}
        </span>
        <span className="k-fb-text">
          <span className="k-fb-name">{step.title}</span>
          {second !== undefined && <small data-part={second === step.note ? 'note' : 'detail'}>{second}</small>}
        </span>
        {elapsed !== undefined && <span className="k-fb-time">{formatDuration(elapsed)}</span>}
      </button>
    )
  }

  const renderList = (list: readonly FlowStep[], path: string | null, pathLabel = ''): ReactNode => (
    <div className="k-fb-list">
      {path !== null && renderAdd({ path, index: 0 }, labels.addInPath(pathLabel), templates)}
      {list.map((step, index) => (
        <Fragment key={step.id}>
          {renderStep(step)}
          {step.kind === 'branch' && step.paths !== undefined && step.paths.length > 0 && (
            <>
              <i className="k-fb-stub" aria-hidden="true" />
              <div className="k-fb-paths" role="group" aria-label={step.title}>
                {step.paths.map((sub) => (
                  <div
                    key={sub.id}
                    className="k-fb-path"
                    data-slot="flow-path"
                    data-skipped={pathSkipped(sub, run) ? '' : undefined}
                  >
                    <i className="k-fb-stub" aria-hidden="true" />
                    <span className="k-fb-path-label" title={sub.label}>
                      {sub.label}
                    </span>
                    {renderList(sub.steps, sub.id, sub.label)}
                    <i className="k-fb-tail" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </>
          )}
          {renderAdd({ path, index: index + 1 }, labels.addAfter(step.title), templates)}
        </Fragment>
      ))}
    </div>
  )

  return (
    <section className={cn('k-fb', className)} data-slot="flow-builder" onKeyDown={onKeyDown}>
      <header className="k-fb-head">
        <h4 className="k-fb-title">{name ?? labels.untitled}</h4>
        <span className="k-fb-tools">
          <Button size="sm" variant="ghost" disabled={past.length === 0} onClick={undo} data-slot="flow-undo">
            <Undo2 aria-hidden="true" />
            {labels.undo}
          </Button>
          {running && onStop !== undefined ? (
            <Button size="sm" variant="danger" onClick={onStop} data-slot="flow-stop">
              <Square aria-hidden="true" />
              {labels.stop}
            </Button>
          ) : onRun !== undefined ? (
            <Button
              size="sm"
              variant="primary"
              disabled={order.length < 2 || running}
              onClick={onRun}
              data-slot="flow-run"
            >
              <Play aria-hidden="true" />
              {labels.run}
            </Button>
          ) : null}
        </span>
      </header>
      <div
        ref={canvas}
        className="k-fb-canvas"
        style={{ height }}
        role="region"
        aria-label={labels.canvas}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div className="k-fb-flow">
          {steps.length === 0
            ? renderAdd({ path: null, index: 0 }, labels.addTrigger, triggers, labels.addTrigger)
            : renderList(steps, null)}
        </div>
      </div>
      <span id={hintId} hidden>
        {labels.hint}
      </span>
      <span className="k-fb-live" aria-live="polite" data-slot="flow-live">
        {live}
      </span>
    </section>
  )
}
