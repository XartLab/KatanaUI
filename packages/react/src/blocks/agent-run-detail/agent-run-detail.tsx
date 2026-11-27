// SPDX-License-Identifier: MIT
/**
 * Agent run detail: one run of an agent as a page or drawer, with a segmented progress bar, a question card when blocked, "run next" suggestions when done, collapsible details and steps.
 * Agent 单次运行详情（KatanaUI #196）：头（返回、运行名、右上一颗随状态变的动作钮）→ 大号百分比 + 分段刻度进度条（约 40 根竖短刻度，已完成的着状态色、未完成的暗、
 * 在跑时当前刻度亮白）+ 一行时间 → 阻塞时的问题卡（warn 色、一颗确认钮）→ 完成时的「接着跑」建议动作（图标 + 名字 + 预估时长）→ 可收起的「详情」键值对 → 可收起的「步骤」。
 * 状态五种：running / blocked / done / paused / failed；状态永不单靠颜色：状态词与灯在百分比旁，步骤右边写状态字，图标形状各不同（勾、转圈、空圈、警示、叉）。
 * 交互与信息结构借自 Jamie Merrill 的 Agent workflow（in progress / blocked / complete）与 Agent drawer（x.com/jamiemerrill，2026-11-24 看截图，只借信息结构与交互，样子是我们自己的 Graphite 风格，没有他的蓝橙绿原色，没抄任何素材）。
 * 分段进度条自己画，没有复用 Meter 的 sync 形态：那个是一条连续填充加齿纹，没有「当前刻度」，也不是一根一根的离散元素；UptimeBars 是历史逐格加悬停读数，语义不同。
 * 键盘：返回、动作钮、确认钮、建议动作都是原生按钮；「接着跑 / 详情 / 步骤」三个标题是按钮，aria-expanded，Enter / Space 收起展开；收起的内容用 hidden="until-found"，浏览器内查找命中会自动展开。
 * 件不读钟：已用时、约剩、阻塞了多久、总用时、预估时长都是毫秒，由调用方给，经 formatDuration 写成字。包里不带语言，文案全在 labels。
 */
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleXIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from 'lucide-react'
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import {
  runHeaderAction,
  runPercent,
  runTone,
  runSegments,
  runHeadingLevel,
  runSubHeadingLevel,
  runTickCount,
  runStepTone,
  runTimeLine,
  type RunHeadingLevel,
  type RunDetailAction,
  type RunDetailSection,
  type RunDetailStatus,
  type RunDetailStep,
  type RunDetailStepStatus,
} from './run-model.ts'

/** One key-value row of the details. */
export type RunDetailRow = {
  /** Stable key. */
  id: string
  /** Key (left). */
  label: string
  /** Icon before the value. */
  icon?: ReactNode
  /** Value (right). */
  value: ReactNode
}

/** A suggested action offered when the run is done. */
export type RunNextAction = {
  /** Stable key; the callback gets it back. */
  id: string
  /** Action name. */
  label: string
  /** Icon before the name. */
  icon?: ReactNode
  /** Estimated duration in milliseconds, written on the right of the button. */
  estimate?: number
}

/** The question a blocked run waits on. */
export type RunQuestion = {
  /** What is missing or unclear (the card title). */
  title: ReactNode
  /** One line of explanation. */
  description?: ReactNode
}

/** Texts of AgentRunDetail (the package ships no text). */
export type AgentRunDetailLabels = {
  /** Back button. */
  back: string
  /** State words; shown beside the percent. */
  status: Record<RunDetailStatus, string>
  /** Names of the header action. */
  actions: Record<RunDetailAction, string>
  /** Accessible name of the progress bar. */
  progress: string
  /** Spoken value of the progress bar, built from the whole percent and the state word (「76%，阻塞」); the caller writes the joining text. */
  progressValue: (percent: number, status: string) => string
  /** Time line texts, each built from a duration already written by `formatDuration`. */
  elapsed: (time: string) => string
  remaining: (time: string) => string
  blocked: (time: string) => string
  completed: (time: string) => string
  /** Confirm button on the question card. */
  confirm: string
  /** Section titles. */
  next: string
  details: string
  steps: string
  /** Estimate on a "run next" button (「~2 分钟」), built from a written duration. */
  estimate: (time: string) => string
  /** Step state words: read by screen readers on every step, written on the right for running, blocked and failed. */
  step: Record<RunDetailStepStatus, string>
}

export type AgentRunDetailProps = {
  /** Run name (the title). */
  name: ReactNode
  /** State of the run. */
  status: RunDetailStatus
  /** Progress, 0 to 1. */
  progress: number
  /** Time used so far, in milliseconds (running, paused, failed). */
  elapsed?: number
  /** Time left, in milliseconds (running). */
  remaining?: number
  /** How long it has been blocked, in milliseconds (blocked). */
  blockedFor?: number
  /** Total time it took, in milliseconds (done). */
  took?: number
  /** How a duration in milliseconds is written (「6m 12s」). */
  formatDuration: (ms: number) => string
  /** Number of ticks in the bar, rounded down and kept between 1 and 120; not a finite number is 40. @default 40 */
  ticks?: number
  /** The question card of a blocked run. */
  question?: RunQuestion
  /** Called by the confirm button on the question card. */
  onConfirm?: () => void
  /** Suggested next actions of a finished run. */
  next?: readonly RunNextAction[]
  /** Called with the id of the chosen suggestion. */
  onNext?: (id: string) => void
  /** Key-value rows of the details. */
  details?: readonly RunDetailRow[]
  /** Steps, in order. */
  steps?: readonly RunDetailStep[]
  /** Shows the back button. */
  onBack?: () => void
  /** Shows the header action (pause, resume, cancel or run again by state); called with which one. */
  onAction?: (action: RunDetailAction) => void
  /** Sections folded when first drawn. */
  defaultCollapsed?: readonly RunDetailSection[]
  /** Called when a section is folded or unfolded. */
  onSectionToggle?: (section: RunDetailSection, open: boolean) => void
  /** Heading level of the run name, 2 to 6 (default 2); the section titles and the question title are one level below. Pass the level that fits the outline of the page. */
  headingLevel?: RunHeadingLevel
  /** Texts. */
  labels: AgentRunDetailLabels
  /** Extra class name on the root. */
  className?: string
}

const ACTION_ICON: Record<RunDetailAction, ReactNode> = {
  pause: <PauseIcon aria-hidden="true" />,
  resume: <PlayIcon aria-hidden="true" />,
  cancel: <XIcon aria-hidden="true" />,
  rerun: <RotateCcwIcon aria-hidden="true" />,
}

const STEP_ICON: Record<RunDetailStepStatus, ReactNode> = {
  done: <CheckIcon aria-hidden="true" />,
  running: <LoaderCircleIcon className="k-status-spin" aria-hidden="true" />,
  pending: null,
  blocked: <CircleAlertIcon aria-hidden="true" />,
  failed: <CircleXIcon aria-hidden="true" />,
}

/** A section whose title is a button: aria-expanded, and the folded content stays findable (hidden="until-found"). */
function Section({
  id,
  title,
  level,
  open,
  onToggle,
  children,
}: {
  id: RunDetailSection
  title: string
  level: RunHeadingLevel
  open: boolean
  onToggle: (open: boolean) => void
  children: ReactNode
}) {
  const panelId = useId()
  const Title = `h${level}` as ElementType
  const panel = useRef<HTMLDivElement>(null)
  // 浏览器内查找命中折起的内容时，浏览器先把 hidden 去掉，这里同步按钮的状态（modern-web-guidance: search-hidden-content）。
  // React 19.3 的 hidden 属性只写 hidden=""（不认 'until-found'，类型也只收 boolean）：渲染时先用 hidden，挂上后改成 until-found。
  useLayoutEffect(() => {
    if (!open) panel.current?.setAttribute('hidden', 'until-found')
  }, [open])
  // 监听只挂一次：onToggle 每次渲染都是新函数，用 useEffectEvent 读它的最新值，不让监听跟着解绑重绑。
  const reveal = useEffectEvent(() => onToggle(true))
  useEffect(() => {
    const node = panel.current
    if (!node) return
    const found = () => reveal()
    node.addEventListener('beforematch', found)
    return () => node.removeEventListener('beforematch', found)
  }, [])
  return (
    <section className="k-ard-section" data-section={id} data-open={open ? '' : undefined}>
      <Title className="k-ard-section-title">
        <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => onToggle(!open)}>
          <span>{title}</span>
          <ChevronUpIcon aria-hidden="true" />
        </button>
      </Title>
      <div id={panelId} ref={panel} className="k-ard-panel" hidden={!open}>
        {children}
      </div>
    </section>
  )
}

export function AgentRunDetail({
  name,
  status,
  progress,
  elapsed,
  remaining,
  blockedFor,
  took,
  formatDuration,
  ticks,
  question,
  onConfirm,
  next,
  onNext,
  details,
  steps,
  onBack,
  onAction,
  defaultCollapsed = [],
  onSectionToggle,
  headingLevel,
  labels,
  className,
}: AgentRunDetailProps) {
  const [folded, setFolded] = useState<ReadonlySet<RunDetailSection>>(() => new Set(defaultCollapsed))
  const titleId = useId()
  const questionId = useId()
  const Name = `h${runHeadingLevel(headingLevel)}` as ElementType
  const Sub = `h${runSubHeadingLevel(headingLevel)}` as ElementType
  const subLevel = runSubHeadingLevel(headingLevel)
  const questionTextId = useId()
  const percent = status === 'done' ? 100 : runPercent(progress)
  const tickCount = runTickCount(ticks)
  const { filled, current } = runSegments(progress, tickCount, status)
  const line = runTimeLine(status)
  const action = runHeaderAction(status)
  const tone = runTone(status)
  const duration = (ms: number | undefined) => (ms === undefined ? null : formatDuration(Math.max(0, ms)))
  const left = {
    elapsed: duration(elapsed) === null ? null : labels.elapsed(duration(elapsed)!),
    blocked: duration(blockedFor) === null ? null : labels.blocked(duration(blockedFor)!),
    completed: duration(took) === null ? null : labels.completed(duration(took)!),
  }[line.left]
  const right =
    line.remaining && remaining !== undefined ? labels.remaining(formatDuration(Math.max(0, remaining))) : null

  const open = (section: RunDetailSection) => !folded.has(section)
  const setOpen = (section: RunDetailSection) => (value: boolean) => {
    setFolded((prev) => {
      const nextSet = new Set(prev)
      if (value) nextSet.delete(section)
      else nextSet.add(section)
      return nextSet
    })
    onSectionToggle?.(section, value)
  }

  const showQuestion = status === 'blocked' && question !== undefined
  const showNext = status === 'done' && next !== undefined && next.length > 0
  const showDetails = details !== undefined && details.length > 0
  const showSteps = steps !== undefined && steps.length > 0

  return (
    <article
      className={cn('k-ard', className)}
      data-slot="agent-run-detail"
      data-status={status}
      data-tone={tone}
      aria-labelledby={titleId}
    >
      <header className="k-ard-head">
        {onBack !== undefined && (
          <Button variant="icon" size="icon" aria-label={labels.back} onClick={onBack} data-slot="run-back">
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
        )}
        <Name id={titleId} className="k-ard-name">
          {name}
        </Name>
        {onAction !== undefined && (
          // 阻塞时的「取消」是 danger 样式（离问题卡的「确认」很近，要分得开）；要不要二次确认由调用方定，件不加。
          <Button
            size="sm"
            variant={action === 'cancel' ? 'danger' : 'default'}
            onClick={() => onAction(action)}
            data-slot="run-action"
            data-action={action}
          >
            {ACTION_ICON[action]}
            {labels.actions[action]}
          </Button>
        )}
      </header>

      <div className="k-ard-progress">
        <div className="k-ard-pct-row">
          <span className="k-ard-pct" aria-hidden="true" data-slot="run-percent">
            {percent}%
          </span>
          <span className="k-ard-state" role="status" data-slot="run-state">
            <i className="k-ard-lamp" aria-hidden="true" />
            {labels.status[status]}
          </span>
        </div>
        <div
          className="k-ard-ticks"
          role="progressbar"
          aria-label={labels.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={labels.progressValue(percent, labels.status[status])}
          style={{ '--ard-ticks': tickCount } as CSSProperties}
          data-slot="run-progress"
        >
          {Array.from({ length: tickCount }, (_, n) => (
            <i key={n} aria-hidden="true" data-tick={n < filled ? 'lit' : n === current ? 'current' : 'dark'} />
          ))}
        </div>
        <p className="k-ard-time" data-slot="run-time">
          <span>{left}</span>
          {right !== null && <span>{right}</span>}
        </p>
      </div>

      {showQuestion && (
        <section className="k-ard-question" aria-labelledby={questionId} data-slot="run-question">
          <CircleAlertIcon className="k-ard-question-icon" aria-hidden="true" />
          <div className="k-ard-question-body">
            <Sub id={questionId} className="k-ard-question-title">
              {question.title}
            </Sub>
            {question.description !== undefined && (
              <p id={questionTextId} className="k-ard-question-text">
                {question.description}
              </p>
            )}
            {onConfirm !== undefined && (
              <Button
                variant="primary"
                size="sm"
                onClick={onConfirm}
                aria-describedby={question.description !== undefined ? `${questionId} ${questionTextId}` : questionId}
                data-slot="run-confirm"
              >
                {labels.confirm}
              </Button>
            )}
          </div>
        </section>
      )}

      {showNext && (
        <Section level={subLevel} id="next" title={labels.next} open={open('next')} onToggle={setOpen('next')}>
          <ul className="k-ard-next" data-slot="run-next">
            {next.map((item) => (
              <li key={item.id}>
                <button type="button" className="k-ard-next-button" data-id={item.id} onClick={() => onNext?.(item.id)}>
                  <span className="k-ard-next-main">
                    {item.icon !== undefined && <span aria-hidden="true">{item.icon}</span>}
                    {item.label}
                  </span>
                  {item.estimate !== undefined && (
                    <span className="k-ard-next-estimate">{labels.estimate(formatDuration(item.estimate))}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {showDetails && (
        <Section
          level={subLevel}
          id="details"
          title={labels.details}
          open={open('details')}
          onToggle={setOpen('details')}
        >
          <dl className="k-ard-details" data-slot="run-details">
            {details.map((row) => (
              <div key={row.id}>
                <dt>{row.label}</dt>
                <dd>
                  {row.icon !== undefined && <span aria-hidden="true">{row.icon}</span>}
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {showSteps && (
        <Section level={subLevel} id="steps" title={labels.steps} open={open('steps')} onToggle={setOpen('steps')}>
          <ol className="k-ard-steps" data-slot="run-steps">
            {steps.map((step) => (
              <li
                key={step.id}
                data-status={step.status}
                data-tone={runStepTone(step.status)}
                aria-current={step.status === 'running' || step.status === 'blocked' ? 'step' : undefined}
              >
                <span className="k-ard-step-icon" aria-hidden="true">
                  {STEP_ICON[step.status]}
                </span>
                <span className="k-ard-step-name">
                  {step.name}
                  <span className="k-ard-sr">{labels.step[step.status]}</span>
                </span>
                {/* 完成步骤的耗时读屏要读到；在跑、阻塞、失败写的是状态词，跟上面的读屏词重复，才隐藏。 */}
                <span className="k-ard-step-meta" aria-hidden={step.status === 'done' ? undefined : true}>
                  {step.status === 'done'
                    ? duration(step.duration)
                    : step.status === 'pending'
                      ? null
                      : labels.step[step.status]}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </article>
  )
}
