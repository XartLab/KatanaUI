// SPDX-License-Identifier: MIT
/**
 * Rule builder: a WHEN condition tree plus THEN actions (if true / if false), controlled as one serializable JSON value.
 * 规则构建器（KatanaUI #223）：告警、风控、选股条件、自动化触发共用的「条件树 + 动作」编辑器。
 * WHEN：每条条件 = 字段（分组下拉）· 运算符（随字段类型变）· 值（数字带单位、区间、选项、多选标签、可引用另一个字段）；条件可组成组（组内 And / Or 点一下切），组可嵌套（默认最多 3 层）；
 * 左侧画树形连线，And / Or 小标签坐在线上；调用方可给锁定的起始条件（锁图标，不能删、不能拖，只改值）。
 * THEN：分「若为真 / 若为假」两段的动作列表；动作 = 类型 · 若干参数（每个有自己的类型与校验）；「只出草稿」的动作（下单草稿）行上带草稿标。
 * 编辑：拖把手换序（只在自己那一组或那一段里，拖出去不落）；键盘 Tab 走各格，Alt+↑↓ 在组内挪行，在把手上按 Delete 删行（含锁定条件的组删不掉，按钮与按键都不动并说明原因），Ctrl/⌘+Z 撤销、Ctrl/⌘+Shift+Z（或 Ctrl+Y）重做。
 * 校验：必填、数值范围、区间次序、选项存在、引用；错的行红框，原因写在行下并用 aria-describedby 接到出错的格子；默认改过的行才显示（showIssues="all" 全显）；点状态栏的「N 个问题」全部显示并把焦点移到第一个出错的格子。
 * 顶部一行用调用方给的文案模板把整棵规则回读成一句话。值是纯 JSON，纯函数 ruleToText、validateRule 在 rule-model.ts，组件读的就是它们的结果。
 * 交互与信息结构借自 Jamie Merrill 的「规则构建器」「高级规则构建器」（x.com/Jamie_Merrill，2026-11-24 读两张图；只借交互，皮肤是 Graphite，实现原创）；
 * 评估过 react-querybuilder（MIT）：模型形状借了它的「组 = 组合方式 + 子节点」，代码没引（核心带 redux，没有锁定 / 引用字段 / 动作段 / 组内换序），见 PR。
 * 撤销存整份规则快照（照 FlowBuilder 与 Whiteboard 的做法），同一格里连着打字合成一步。包里不带语言，文案与模板全由调用方传。
 */
import { Check, FolderPlus, GripVertical, ListPlus, Lock, Plus, Redo2, Trash2, Undo2, X } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import type { RuleBuilderLabels } from './rule-labels.ts'
import {
  actionDefOf,
  actionText,
  carryFieldValue,
  carryValue,
  conditionCount,
  conditionText,
  emptyValue,
  fieldOf,
  freshId,
  hasLocked,
  insertAction,
  insertNode,
  isSameDocument,
  issuesById,
  liveIds,
  locate,
  locateAction,
  maxDepthOf,
  moveAction,
  moveNode,
  operatorOf,
  operatorsOf,
  removeAction,
  removeNode,
  ruleToText,
  sameDomain,
  setMode,
  slotToIndex,
  stepNode,
  updateAction,
  updateNode,
  validateRule,
  type Rule,
  type RuleAction,
  type RuleActionParam,
  type RuleBranch,
  type RuleCondition,
  type RuleGroup,
  type RuleIssue,
  type RuleNode,
  type RuleSchema,
  type RuleTextTemplates,
  type RuleValue,
} from './rule-model.ts'
import { fieldGroups, NumberField, RuleSelect, ValueEditor } from './rule-value.tsx'

export type { RuleBuilderLabels } from './rule-labels.ts'

export type RuleBuilderProps = {
  /** Fields, operators per field type and actions. */
  schema: RuleSchema
  /** The rule, controlled. */
  value?: Rule
  /** The rule at first, uncontrolled. */
  defaultValue?: Rule
  /** Called with the whole new rule after every edit, move, add, remove, undo and redo. */
  onValueChange?: (rule: Rule) => void
  /** Templates of the one-line readback. */
  templates: RuleTextTemplates
  /** Texts. */
  labels: RuleBuilderLabels
  /** When problems show on rows: touched (the default) shows a row's problems once it was edited; all shows every problem. */
  showIssues?: 'touched' | 'all'
  /** Extra class name on the root. */
  className?: string
}

const EMPTY: Rule = { when: { type: 'group', id: 'root', mode: 'and', children: [] }, ifTrue: [], ifFalse: [] }

/** 撤销最多记几步：每步存整份规则快照（几十条的规则很小），照 FlowBuilder 的 HISTORY_LIMIT。 */
const HISTORY_LIMIT = 100

/** 拖出所在列表这么多 px 就算拖到了别处（不落）。 */
const OUTSIDE = { left: 64, right: 16, top: 32, bottom: 32 }

type Drag = {
  kind: 'node' | 'action'
  id: string
  /** 列表的标识：组 id，或 ifTrue / ifFalse。 */
  list: string
  from: number
  /** 落在第几条缝前（0 到 n）；null 是拖到了别处。 */
  slot: number | null
}

export function RuleBuilder({
  schema,
  value,
  defaultValue,
  onValueChange,
  templates,
  labels,
  showIssues = 'touched',
  className,
}: RuleBuilderProps) {
  const [inner, setInner] = useState<Rule>(defaultValue ?? EMPTY)
  const rule = value ?? inner
  const [past, setPast] = useState<readonly Rule[]>([])
  const [future, setFuture] = useState<readonly Rule[]>([])
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [reveal, setReveal] = useState(false)
  // 受控时，value 换成另一份规则（不是自己刚写出去的那份）就是「换了文档」：撤销栈与「改过的行」属于旧文档，一并清掉。
  const [written, setWritten] = useState<Rule | null>(null)
  const [seen, setSeen] = useState(value)
  const [live, setLive] = useState('')
  const [drag, setDragState] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const dragEl = useRef<{ pointerId: number; list: HTMLElement } | null>(null)
  const lastKey = useRef<string | null>(null)
  const focusNext = useRef<string | null>(null)
  const root = useRef<HTMLElement>(null)
  const uid = useId()
  const hintId = `${uid}-hint`
  const maxDepth = maxDepthOf(schema)
  const hasActions = (schema.actions?.length ?? 0) > 0

  if (value !== seen) {
    setSeen(value)
    if (value !== undefined && !isSameDocument(value, written)) {
      setPast([])
      setFuture([])
      setTouched(new Set())
      setReveal(false)
    }
  }
  useEffect(() => {
    lastKey.current = null
  }, [seen])

  const issues = validateRule(rule, schema)
  const byId = issuesById(issues)
  const sentence = ruleToText(rule, schema, templates)

  useEffect(() => {
    if (focusNext.current === null) return
    root.current?.querySelector<HTMLElement>(focusNext.current)?.focus()
    focusNext.current = null
  })

  const setDrag = (next: Drag | null) => {
    dragRef.current = next
    setDragState(next)
  }
  const write = (next: Rule) => {
    if (value === undefined) setInner(next)
    setWritten(next)
    // 「改过的行」只留还在这份规则里的：删了的行 id 会被新加的行复用，留着就一上来标红。
    const alive = liveIds(next)
    setTouched((previous) => new Set([...previous].filter((id) => alive.has(id))))
    onValueChange?.(next)
  }
  const touch = (...ids: string[]) => setTouched((previous) => new Set([...previous, ...ids]))
  /** 提交一次改动：进撤销栈（同一个 key 连着的合成一步）、清重做栈、标记被改的行、播报。 */
  const commit = (next: Rule, options: { key?: string; say?: string; touch?: string[] } = {}) => {
    if (next === rule) return
    if (options.key === undefined || options.key !== lastKey.current) setPast([...past, rule].slice(-HISTORY_LIMIT))
    lastKey.current = options.key ?? null
    setFuture([])
    write(next)
    if (options.touch !== undefined) touch(...options.touch)
    if (options.say !== undefined) setLive(options.say)
  }
  const undo = () => {
    const previous = past.at(-1)
    if (previous === undefined) return
    setPast(past.slice(0, -1))
    setFuture([rule, ...future])
    lastKey.current = null
    write(previous)
    setLive(labels.undone)
  }
  const redo = () => {
    const next = future[0]
    if (next === undefined) return
    setFuture(future.slice(1))
    setPast([...past, rule].slice(-HISTORY_LIMIT))
    lastKey.current = null
    write(next)
    setLive(labels.redone)
  }

  const handleSel = (id: string) => `[data-id="${CSS.escape(id)}"] [data-part="handle"]`
  const firstSel = (id: string) =>
    `[data-id="${CSS.escape(id)}"] :is([data-part="handle"], [data-part="field"], [data-part="kind"], [data-part="value"])`
  const addSel = (listId: string) => `[data-add="${CSS.escape(listId)}"] button`

  // ------------------------------------------------------------ 加、删、挪
  const addCondition = (groupId: string) => {
    const field = schema.fields[0]
    if (field === undefined) return
    const operator = operatorsOf(schema, field)[0]
    const node: RuleCondition = {
      type: 'condition',
      id: freshId(rule, 'c'),
      field: field.key,
      op: operator?.value ?? '',
      value: emptyValue(operator),
    }
    const next = insertNode(rule, groupId, node, schema)
    if (next === null) return
    focusNext.current = `[data-id="${CSS.escape(node.id)}"] [data-part="field"]`
    commit(next, { say: labels.added(conditionText(node, schema, templates)) })
  }
  const addGroup = (groupId: string) => {
    const field = schema.fields[0]
    if (field === undefined) return
    const operator = operatorsOf(schema, field)[0]
    const child: RuleCondition = {
      type: 'condition',
      id: freshId(rule, 'c'),
      field: field.key,
      op: operator?.value ?? '',
      value: emptyValue(operator),
    }
    const group: RuleGroup = { type: 'group', id: freshId(rule, 'g'), mode: 'and', children: [child] }
    const next = insertNode(rule, groupId, group, schema)
    if (next === null) return
    focusNext.current = `[data-id="${CSS.escape(child.id)}"] [data-part="field"]`
    commit(next, { say: labels.added(labels.group(1, labels.mode.and)) })
  }
  const addAction = (branch: RuleBranch) => {
    const def = schema.actions?.[0]
    if (def === undefined) return
    const action: RuleAction = { id: freshId(rule, 'a'), kind: def.kind }
    focusNext.current = `[data-id="${CSS.escape(action.id)}"] [data-part="kind"]`
    commit(insertAction(rule, branch, action), { say: labels.added(actionText(action, schema, templates)) })
  }
  const removeRow = (kind: 'node' | 'action', id: string, listId: string, summary: string) => {
    if (kind === 'node') {
      const found = locate(rule.when, id)
      if (found === null) return
      // 子树里有锁定条件的组删不掉（不会连风控前提一起删）；按键走到这里时说一声为什么没动。
      if (hasLocked(found.node)) {
        setLive(labels.removeBlocked(summary))
        return
      }
      const result = removeNode(rule, id)
      if (result === null) return
      focusNext.current = result.focus === null ? addSel(found.parent.id) : firstSel(result.focus)
      commit(result.rule, { say: labels.removed(summary), touch: [found.parent.id] })
    } else {
      const result = removeAction(rule, id)
      if (result === null) return
      focusNext.current = result.focus === null ? addSel(listId) : firstSel(result.focus)
      commit(result.rule, { say: labels.removed(summary), touch: [listId] })
    }
  }
  const moveRow = (kind: 'node' | 'action', id: string, to: number, summary: string, total: number, say = true) => {
    const next = kind === 'node' ? moveNode(rule, id, to) : moveAction(rule, id, to)
    if (next === null) return
    const placed = kind === 'node' ? locate(next.when, id)?.index : locateAction(next, id)?.index
    focusNext.current = handleSel(id)
    commit(next, { say: say && placed !== undefined ? labels.moved(summary, placed + 1, total) : undefined })
  }

  // ------------------------------------------------------------ 拖动
  // 指针事件（不用原生拖放）：把手捕获指针，落点按同一个列表里各行的版面中点算——别的组的行不在比较之列，所以跨组天然落不进去；
  // 指针出了这个列表的范围就是「拖到别处」，松手不动。
  const startDrag = (event: PointerEvent<HTMLButtonElement>, kind: 'node' | 'action', id: string) => {
    if (event.button !== 0) return
    const item = event.currentTarget.closest<HTMLElement>('li[data-row]')
    const list = item?.parentElement
    if (!item || !list) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragEl.current = { pointerId: event.pointerId, list }
    const from = [...list.children].indexOf(item)
    setDrag({ kind, id, list: list.dataset.list ?? '', from, slot: from })
  }
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const el = dragEl.current
    const current = dragRef.current
    if (!el || !current || event.pointerId !== el.pointerId) return
    const box = el.list.getBoundingClientRect()
    const outside =
      event.clientX < box.left - OUTSIDE.left ||
      event.clientX > box.right + OUTSIDE.right ||
      event.clientY < box.top - OUTSIDE.top ||
      event.clientY > box.bottom + OUTSIDE.bottom
    if (outside) {
      if (current.slot !== null) setDrag({ ...current, slot: null })
      return
    }
    const rows = [...el.list.children] as HTMLElement[]
    let slot = rows.findIndex((row) => {
      const rect = row.getBoundingClientRect()
      return event.clientY < rect.top + rect.height / 2
    })
    if (slot < 0) slot = rows.length
    const locked = rows.findIndex((row) => row.dataset.locked === undefined)
    slot = Math.max(slot, locked < 0 ? rows.length : locked)
    if (slot !== current.slot) setDrag({ ...current, slot })
  }
  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const el = dragEl.current
    const current = dragRef.current
    if (!el || !current || event.pointerId !== el.pointerId) return
    dragEl.current = null
    setDrag(null)
    if (current.slot === null) return
    const to = slotToIndex(current.from, current.slot)
    if (to === current.from) return
    const total = el.list.children.length
    const summary =
      current.kind === 'node'
        ? nodeSummary(locate(rule.when, current.id)?.node)
        : actionSummary(locateAction(rule, current.id)?.action)
    moveRow(current.kind, current.id, to, summary, total)
  }
  const cancelDrag = (event?: PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current === null) return
    if (event && dragEl.current && event.pointerId !== dragEl.current.pointerId) return
    dragEl.current = null
    setDrag(null)
    setLive(labels.dragCancelled)
  }

  // ------------------------------------------------------------ 文字与显示时机
  const nodeSummary = (node: RuleNode | undefined): string =>
    node === undefined
      ? ''
      : node.type === 'group'
        ? labels.group(conditionCount(node), labels.mode[node.mode])
        : conditionText(node, schema, templates)
  const actionSummary = (action: RuleAction | undefined): string =>
    action === undefined ? '' : actionText(action, schema, templates)
  const shownIssues = (id: string): RuleIssue[] =>
    showIssues === 'all' || reveal || touched.has(id) ? (byId.get(id) ?? []) : []
  const issueLine = (id: string, shown: readonly RuleIssue[]) => {
    const messages = [...new Set(shown.map((issue) => labels.issue(issue)))]
    return messages.length === 0 ? null : (
      <p id={`${uid}-issue-${id}`} className="k-rb-issue" data-slot="rule-issue" data-for={id}>
        {messages.join('. ')}
      </p>
    )
  }

  /** 点状态栏：全部问题显示出来，焦点移到第一个出错的格子（问题按阅读次序排，第一条就是最上面的）。 */
  const focusIssue = () => {
    setReveal(true)
    const first = issues[0]
    if (first === undefined) return
    const id = CSS.escape(first.id)
    const selectors =
      first.part === 'param'
        ? [`[data-id="${id}"] [data-part="param"][data-key="${CSS.escape(first.key ?? '')}"]`]
        : first.part === 'row'
          ? [`[data-id="${id}"] [data-part="kind"]`, addSel(first.id)]
          : [`[data-id="${id}"] [data-part="${first.part}"]`]
    for (const selector of [...selectors, firstSel(first.id), addSel(first.id)]) {
      const target = root.current?.querySelector<HTMLElement>(selector)
      if (target) {
        target.focus()
        return
      }
    }
  }

  // ------------------------------------------------------------ 键盘
  const onRowKey = (event: KeyboardEvent<HTMLElement>, kind: 'node' | 'action', id: string, listId: string) => {
    if (dragRef.current !== null) return
    const summary =
      kind === 'node' ? nodeSummary(locate(rule.when, id)?.node) : actionSummary(locateAction(rule, id)?.action)
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      const delta = event.key === 'ArrowUp' ? -1 : 1
      if (kind === 'node') {
        const found = locate(rule.when, id)
        if (found === null) return
        const next = stepNode(rule, id, delta)
        if (next === null) return
        focusNext.current = handleSel(id)
        commit(next, { say: labels.moved(summary, locate(next.when, id)!.index + 1, found.parent.children.length) })
      } else {
        const found = locateAction(rule, id)
        if (found === null) return
        moveRow('action', id, found.index + delta, summary, rule[found.branch].length)
      }
      return
    }
    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.target as HTMLElement).dataset.part === 'handle'
    ) {
      event.preventDefault()
      removeRow(kind, id, listId, summary)
    }
  }
  const onRootKey = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('input, textarea')) return
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault()
      redo()
    }
  }

  // ------------------------------------------------------------ 画行
  const handleButton = (kind: 'node' | 'action', id: string, summary: string) => (
    <button
      type="button"
      className="k-rb-handle"
      data-part="handle"
      data-slot="rule-handle"
      aria-label={labels.handle(summary)}
      aria-describedby={hintId}
      onPointerDown={(event) => startDrag(event, kind, id)}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && dragRef.current !== null) {
          event.stopPropagation()
          cancelDrag()
        }
      }}
    >
      <GripVertical aria-hidden="true" />
    </button>
  )
  // blocked：组里有锁定条件，删不掉。用 aria-disabled 而不是 disabled，焦点还能到，读屏能读到为什么删不了。
  const removeButton = (kind: 'node' | 'action', id: string, listId: string, summary: string, blocked = false) => (
    <Button
      variant="icon"
      className="k-rb-remove"
      data-slot="rule-remove"
      data-blocked={blocked ? '' : undefined}
      aria-disabled={blocked ? true : undefined}
      aria-label={blocked ? labels.removeBlocked(summary) : labels.remove(summary)}
      title={blocked ? labels.removeBlocked(summary) : undefined}
      onClick={() => removeRow(kind, id, listId, summary)}
    >
      <Trash2 aria-hidden="true" />
    </Button>
  )

  /** 列表里一行外面的 li：连线、落点标记、拖动中的淡化。 */
  const listItem = (
    listId: string,
    index: number,
    count: number,
    id: string,
    type: string,
    locked: boolean,
    body: ReactNode,
  ) => {
    const dragging = drag !== null && drag.id === id
    const here =
      drag !== null && drag.list === listId && drag.slot !== null && slotToIndex(drag.from, drag.slot) !== drag.from
    const mark = !here
      ? undefined
      : drag.slot === index
        ? 'before'
        : drag.slot === count && index === count - 1
          ? 'after'
          : undefined
    return (
      <li
        key={id}
        className="k-rb-item"
        data-row=""
        data-type={type}
        data-locked={locked ? '' : undefined}
        data-dragging={dragging ? '' : undefined}
        data-drop={mark}
      >
        {body}
      </li>
    )
  }

  const renderCondition = (condition: RuleCondition) => {
    const field = fieldOf(schema, condition.field)
    const operators = operatorsOf(schema, field)
    const operator = operatorOf(schema, field, condition.op)
    const shown = shownIssues(condition.id)
    const bad = (part: string) => shown.some((issue) => issue.part === part)
    const locked = condition.locked === true
    const summary = conditionText(condition, schema, templates)
    const describedBy = `${uid}-issue-${condition.id}`
    const listId = locate(rule.when, condition.id)?.parent.id ?? ''
    const setField = (key: string) => {
      const nextField = fieldOf(schema, key)
      const ops = operatorsOf(schema, nextField)
      const nextOp = ops.find((item) => item.value === condition.op) ?? ops[0]
      // 换字段：同类型、同单位（选项也相同）才留值；口径不同的清空要求重填（亿 → % 不能悄悄带过去）；引用一律清掉。
      const nextValue = carryFieldValue(condition.value, field, nextField, nextOp)
      const cleared =
        (condition.value.kind === 'ref' || !sameDomain(field, nextField)) &&
        JSON.stringify(nextValue) !== JSON.stringify(condition.value)
      commit(
        updateNode(rule, condition.id, (node) => ({
          ...(node as RuleCondition),
          field: key,
          op: nextOp?.value ?? '',
          value: nextValue,
        })),
        { touch: [condition.id], say: cleared ? labels.valueCleared : undefined },
      )
    }
    const setOp = (op: string) => {
      const nextOp = operatorOf(schema, field, op)
      commit(
        updateNode(rule, condition.id, (node) => ({
          ...(node as RuleCondition),
          op,
          value: carryValue((node as RuleCondition).value, nextOp, field),
        })),
        { touch: [condition.id] },
      )
    }
    const setValue = (next: RuleValue) =>
      commit(
        updateNode(rule, condition.id, (node) => ({ ...(node as RuleCondition), value: next })),
        {
          key: `value:${condition.id}`,
          touch: [condition.id],
        },
      )
    return (
      <>
        <div
          className="k-rb-row"
          data-slot="rule-condition"
          data-id={condition.id}
          data-locked={locked ? '' : undefined}
          data-invalid={shown.length > 0 ? '' : undefined}
          onKeyDown={locked ? undefined : (event) => onRowKey(event, 'node', condition.id, listId)}
        >
          {locked ? (
            <span className="k-rb-lock" role="img" aria-label={labels.locked}>
              <Lock aria-hidden="true" />
            </span>
          ) : (
            handleButton('node', condition.id, summary)
          )}
          {locked ? (
            <span className="k-rb-fixed" data-part="field-text">
              {field?.label}
            </span>
          ) : (
            <RuleSelect
              value={condition.field}
              onValueChange={setField}
              groups={fieldGroups(schema.fields)}
              label={labels.field}
              part="field"
              invalid={bad('field')}
              describedBy={describedBy}
            />
          )}
          {locked ? (
            <span className="k-rb-fixed" data-part="op-text">
              {operator?.label}
            </span>
          ) : (
            <RuleSelect
              value={condition.op}
              onValueChange={setOp}
              groups={[{ group: '', items: operators.map((item) => ({ value: item.value, label: item.label })) }]}
              label={labels.operator}
              part="op"
              invalid={bad('op')}
              describedBy={describedBy}
              className="k-rb-op"
            />
          )}
          {field !== undefined && operator !== undefined && (
            <ValueEditor
              condition={condition}
              field={field}
              operator={operator}
              schema={schema}
              labels={labels}
              issues={shown}
              describedBy={describedBy}
              onChange={setValue}
            />
          )}
          {!locked && removeButton('node', condition.id, listId, summary)}
        </div>
        {issueLine(condition.id, shown)}
      </>
    )
  }

  const renderParam = (
    action: RuleAction,
    param: RuleActionParam,
    describedBy: string,
    shown: readonly RuleIssue[],
  ) => {
    const invalid = shown.some((issue) => issue.part === 'param' && issue.key === param.key)
    const current = action.params?.[param.key]
    const setParam = (next: string | number | undefined) =>
      commit(
        updateAction(rule, action.id, (item) => {
          const params = { ...item.params }
          if (next === undefined) delete params[param.key]
          else params[param.key] = next
          return { id: item.id, kind: item.kind, ...(Object.keys(params).length > 0 ? { params } : {}) }
        }),
        { key: `param:${action.id}:${param.key}`, touch: [action.id] },
      )
    return (
      <Fragment key={param.key}>
        {param.connector !== undefined && <span className="k-rb-connector">{param.connector}</span>}
        {param.input === 'option' && (
          <RuleSelect
            value={typeof current === 'string' ? current : ''}
            onValueChange={setParam}
            groups={[{ group: '', items: param.options ?? [] }]}
            label={param.label}
            placeholder={labels.valuePlaceholder}
            part="param"
            dataKey={param.key}
            invalid={invalid}
            describedBy={describedBy}
          />
        )}
        {param.input === 'number' && (
          <NumberField
            value={typeof current === 'number' ? current : null}
            onValueChange={(next) => setParam(next ?? undefined)}
            unit={param.unit}
            label={param.label}
            part="param"
            dataKey={param.key}
            invalid={invalid}
            describedBy={describedBy}
          />
        )}
        {param.input === 'text' && (
          <Input
            autoComplete="off"
            value={typeof current === 'string' ? current : ''}
            aria-label={param.label}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? describedBy : undefined}
            data-part="param"
            data-key={param.key}
            className="k-rb-text-input"
            onChange={(event) => setParam(event.target.value === '' ? undefined : event.target.value)}
          />
        )}
      </Fragment>
    )
  }

  const renderAction = (action: RuleAction, listId: string) => {
    const def = actionDefOf(schema, action.kind)
    const shown = shownIssues(action.id)
    const bad = (part: string) => shown.some((issue) => issue.part === part)
    const summary = actionSummary(action)
    const describedBy = `${uid}-issue-${action.id}`
    return (
      <>
        <div
          className="k-rb-row"
          data-slot="rule-action"
          data-id={action.id}
          data-invalid={shown.length > 0 ? '' : undefined}
          data-draft={def?.draft ? '' : undefined}
          onKeyDown={(event) => onRowKey(event, 'action', action.id, listId)}
        >
          {handleButton('action', action.id, summary)}
          <RuleSelect
            value={action.kind}
            // 换种类：参数各种类不同，清掉重填。
            onValueChange={(kind) =>
              commit(
                updateAction(rule, action.id, (item) => ({ id: item.id, kind })),
                { touch: [action.id] },
              )
            }
            groups={[
              { group: '', items: (schema.actions ?? []).map((item) => ({ value: item.kind, label: item.label })) },
            ]}
            label={labels.action}
            part="kind"
            invalid={bad('row')}
            describedBy={describedBy}
          />
          {(def?.params ?? []).map((param) => renderParam(action, param, describedBy, shown))}
          {def?.draft === true && (
            <span className="k-rb-draft" data-slot="rule-draft">
              {labels.draft}
            </span>
          )}
          {removeButton('action', action.id, listId, summary)}
        </div>
        {issueLine(action.id, shown)}
      </>
    )
  }

  const renderGroup = (group: RuleGroup, depth: number): ReactNode => {
    const isRoot = depth === 1
    const count = conditionCount(group)
    const shown = shownIssues(group.id)
    const children = group.children
    const parent = isRoot ? null : locate(rule.when, group.id)?.parent.id
    const nextMode = group.mode === 'and' ? 'or' : 'and'
    const title = labels.group(count, labels.mode[group.mode])
    const blocked = hasLocked(group)
    return (
      <div
        className="k-rb-group"
        data-slot="rule-group"
        data-id={isRoot ? group.id : undefined}
        data-depth={depth}
        data-mode={group.mode}
        data-root={isRoot ? '' : undefined}
        data-invalid={shown.length > 0 ? '' : undefined}
        role="group"
        aria-label={isRoot ? labels.rootGroup(count, labels.mode[group.mode]) : title}
      >
        {!isRoot && (
          <div
            className="k-rb-grouphead"
            data-id={group.id}
            onKeyDown={(event) => onRowKey(event, 'node', group.id, parent ?? '')}
          >
            {handleButton('node', group.id, title)}
            <span className="k-rb-title">{title}</span>
            {removeButton('node', group.id, parent ?? '', title, blocked)}
          </div>
        )}
        <div className="k-rb-tree">
          <ul className="k-rb-list" data-list={group.id}>
            {children.map((node, index) =>
              listItem(
                group.id,
                index,
                children.length,
                node.id,
                node.type,
                node.type === 'condition' && node.locked === true,
                node.type === 'group' ? renderGroup(node, depth + 1) : renderCondition(node),
              ),
            )}
          </ul>
          {children.length > 1 && (
            <button
              type="button"
              className="k-rb-mode"
              data-slot="rule-mode"
              data-mode={group.mode}
              aria-label={labels.switchMode(labels.mode[group.mode], labels.mode[nextMode])}
              onClick={() =>
                commit(setMode(rule, group.id, nextMode), {
                  say: labels.modeChanged(labels.mode[nextMode]),
                  touch: [group.id],
                })
              }
            >
              {labels.mode[group.mode]}
            </button>
          )}
        </div>
        {issueLine(group.id, shown)}
        <div className="k-rb-adds" data-add={group.id}>
          <Button size="sm" data-slot="rule-add-condition" onClick={() => addCondition(group.id)}>
            <ListPlus aria-hidden="true" />
            {labels.addCondition}
          </Button>
          {depth < maxDepth && (
            <Button size="sm" data-slot="rule-add-group" onClick={() => addGroup(group.id)}>
              <FolderPlus aria-hidden="true" />
              {labels.addGroup}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderBranch = (branch: RuleBranch) => {
    const list = rule[branch]
    const shown = branch === 'ifTrue' ? shownIssues('ifTrue') : []
    return (
      <div className="k-rb-branch-block" data-slot="rule-branch" data-branch={branch}>
        <h5 className="k-rb-branch" data-tone={branch === 'ifTrue' ? 'ok' : 'danger'}>
          {branch === 'ifTrue' ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
          {branch === 'ifTrue' ? labels.ifTrue : labels.ifFalse}
        </h5>
        <div className="k-rb-tree" data-static="">
          <ul className="k-rb-list" data-list={branch}>
            {list.map((action, index) =>
              listItem(branch, index, list.length, action.id, 'action', false, renderAction(action, branch)),
            )}
          </ul>
        </div>
        {branch === 'ifTrue' && issueLine('ifTrue', shown)}
        <div className="k-rb-adds" data-add={branch}>
          <Button size="sm" data-slot="rule-add-action" onClick={() => addAction(branch)}>
            <Plus aria-hidden="true" />
            {labels.addAction}
          </Button>
        </div>
      </div>
    )
  }

  const status = issues.length === 0 ? labels.valid : labels.issueCount(issues.length)
  return (
    <section
      ref={root}
      className={cn('k-rb', className)}
      data-slot="rule-builder"
      data-drag={drag === null ? undefined : drag.slot === null ? 'blocked' : 'on'}
      onKeyDown={onRootKey}
      onBlur={() => {
        lastKey.current = null
      }}
    >
      <header className="k-rb-head">
        {/* <p> 不能带名字（aria-label 在它身上读屏不认）：用一个有名字的组，名字是不显示的文字。 */}
        <div className="k-rb-readback-wrap" role="group" aria-labelledby={`${uid}-readback`}>
          <span id={`${uid}-readback`} className="k-rb-sr">
            {labels.readback}
          </span>
          <p className="k-rb-readback" data-slot="rule-text">
            {sentence}
          </p>
        </div>
        <span className="k-rb-tools">
          {issues.length === 0 ? (
            <span className="k-rb-status" data-slot="rule-status" data-tone="ok">
              {status}
            </span>
          ) : (
            <button
              type="button"
              className="k-rb-status"
              data-slot="rule-status"
              data-tone="warn"
              aria-label={labels.issueAction(issues.length)}
              onClick={focusIssue}
            >
              {status}
            </button>
          )}
          <Button size="sm" variant="ghost" disabled={past.length === 0} onClick={undo} data-slot="rule-undo">
            <Undo2 aria-hidden="true" />
            {labels.undo}
          </Button>
          <Button size="sm" variant="ghost" disabled={future.length === 0} onClick={redo} data-slot="rule-redo">
            <Redo2 aria-hidden="true" />
            {labels.redo}
          </Button>
        </span>
      </header>
      <section className="k-rb-part" data-part-name="when" aria-labelledby={`${uid}-when`}>
        <h4 id={`${uid}-when`} className="k-rb-heading">
          {labels.when}
        </h4>
        {renderGroup(rule.when, 1)}
      </section>
      {hasActions && (
        <section className="k-rb-part" data-part-name="actions" aria-labelledby={`${uid}-actions`}>
          <h4 id={`${uid}-actions`} className="k-rb-heading">
            {labels.actions}
          </h4>
          {renderBranch('ifTrue')}
          {renderBranch('ifFalse')}
        </section>
      )}
      <span id={hintId} hidden>
        {labels.hint}
      </span>
      <span className="k-rb-live" aria-live="polite" data-slot="rule-live">
        {live}
      </span>
    </section>
  )
}
