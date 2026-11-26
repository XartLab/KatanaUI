// SPDX-License-Identifier: MIT
// 规则构建器的纯逻辑（KatanaUI #223）：一条规则 = WHEN 条件树 + THEN 两段动作（若为真 / 若为假）。整份是可序列化的 JSON：
//   { when: { type:'group', id, mode:'and'|'or', children:[条件 | 组…] }, ifTrue:[动作…], ifFalse:[动作…] }
// 条件 = 字段 · 运算符 · 值；值按运算符的 input 分五种（number / range / text / list / ref，ref 是引用另一个数值字段，如「收盘价 上穿 MA20」）。
// 字段、运算符、动作全由调用方的 schema 给，这里不带任何行情或语言。地址一律用 id；树的操作都返回新对象，原对象不动。
// 树形结构的取舍：模型形状（组 = 组合方式 + 子节点）借自 react-querybuilder（MIT）的 RuleGroup 概念，代码没有引它——
// 评估见 PR #223：它的核心带 redux、没有「锁定」「引用字段」「动作段」「组内换序」，校验与回读也得自己写，整个模型加起来不到 300 行，不值得引一个依赖。
// 不带 React 与 DOM。

/** How the children of a group combine. */
export type RuleMode = 'and' | 'or'

/** What kind of values a field holds; the operators offered follow it. */
export type RuleFieldType = 'number' | 'enum' | 'text'

/** How a value is entered for an operator. */
export type RuleInput = 'number' | 'range' | 'option' | 'list' | 'text'

/** One choice of an enum field or of an action parameter. */
export type RuleOption = { value: string; label: string }

/** One operator of a field type, such as >, between, crosses above, is any of. */
export type RuleOperator = {
  /** Stable key stored in the JSON. */
  value: string
  /** Text shown on the operator select and in the readback. */
  label: string
  /** number: one number; range: min and max; option: one choice; list: several choices; text: free text. */
  input: RuleInput
  /** A number input may switch to another number field (close crosses above MA20). */
  allowRef?: boolean
}

/** One field a condition can test. */
export type RuleField = {
  /** Stable key stored in the JSON. */
  key: string
  /** Text shown on the field select. */
  label: string
  /** Group heading in the field select. */
  group?: string
  /** number, enum or text; decides the operators. */
  type: RuleFieldType
  /** Unit written after a number, such as % or 100M. */
  unit?: string
  /** Smallest number allowed. */
  min?: number
  /** Largest number allowed. */
  max?: number
  /** Step of the number box's arrow keys. */
  step?: number
  /** Choices of an enum field. */
  options?: readonly RuleOption[]
}

/** One parameter of an action, such as the channel of an alert or the side of an order draft. */
export type RuleActionParam = {
  /** Stable key of the parameter in RuleAction.params. */
  key: string
  /** Accessible name of the parameter control. */
  label: string
  /** option: pick one of options; text: free text; number: a number. */
  input: 'option' | 'text' | 'number'
  /** Choices when input is option. */
  options?: readonly RuleOption[]
  /** Word shown between the action and the parameter, such as "to". */
  connector?: string
  /** Unit of a number parameter. */
  unit?: string
  /** Smallest number of a number parameter. */
  min?: number
  /** Largest number of a number parameter. */
  max?: number
  /** The parameter may stay empty. */
  optional?: boolean
}

/** One kind of action the THEN part can hold. */
export type RuleActionDef = {
  /** Stable key stored in the JSON. */
  kind: string
  /** Text shown on the action select and in the readback. */
  label: string
  /** The parameters in the order they are shown; each is required unless it says optional. */
  params?: readonly RuleActionParam[]
  /** The action only produces a draft for a person to confirm (an order draft); the row carries a draft mark. */
  draft?: boolean
}

/** Everything the caller defines: fields, operators per field type, actions. */
export type RuleSchema = {
  /** The fields a condition can test. */
  fields: readonly RuleField[]
  /** Operators offered for each field type. */
  operators: Readonly<Record<RuleFieldType, readonly RuleOperator[]>>
  /** Action kinds; without them the builder has no THEN part. */
  actions?: readonly RuleActionDef[]
  /** The if-true list must hold at least one action; default false (a screening rule may have only WHEN). */
  requireActions?: boolean
  /** Deepest nesting of groups, the root counts as 1; default 3. */
  maxDepth?: number
}

/** The value of a condition; its kind follows the operator's input (ref when a number is replaced by another field). */
export type RuleValue =
  | { kind: 'number'; value: number | null }
  | { kind: 'range'; min: number | null; max: number | null }
  | { kind: 'text'; value: string }
  | { kind: 'list'; values: readonly string[] }
  | { kind: 'ref'; field: string | null }

/** One condition: field, operator and value. A locked one cannot be removed or moved, and its field and operator cannot change. */
export type RuleCondition = {
  type: 'condition'
  id: string
  field: string
  op: string
  value: RuleValue
  locked?: boolean
}

/** A group of conditions and groups combined with and / or. */
export type RuleGroup = {
  type: 'group'
  id: string
  mode: RuleMode
  children: readonly RuleNode[]
}

export type RuleNode = RuleCondition | RuleGroup

/** One action of the THEN part; params holds the value of each parameter by its key. */
export type RuleAction = {
  id: string
  kind: string
  params?: Readonly<Record<string, string | number>>
}

/** The whole rule, the controlled value of RuleBuilder. */
export type Rule = {
  /** The condition tree; its root group is always there. */
  when: RuleGroup
  /** Actions when the conditions hold; may be empty unless schema.requireActions says so. */
  ifTrue: readonly RuleAction[]
  /** Actions when they do not. */
  ifFalse: readonly RuleAction[]
}

/** Which of the two action lists. */
export type RuleBranch = 'ifTrue' | 'ifFalse'

export const DEFAULT_MAX_DEPTH = 3

const isGroup = (node: RuleNode): node is RuleGroup => node.type === 'group'

// ---------------------------------------------------------------- schema 查询

export const fieldOf = (schema: RuleSchema, key: string): RuleField | undefined =>
  schema.fields.find((field) => field.key === key)

export const operatorsOf = (schema: RuleSchema, field: RuleField | undefined): readonly RuleOperator[] =>
  field === undefined ? [] : schema.operators[field.type]

export const operatorOf = (schema: RuleSchema, field: RuleField | undefined, op: string): RuleOperator | undefined =>
  operatorsOf(schema, field).find((operator) => operator.value === op)

export const actionDefOf = (schema: RuleSchema, kind: string): RuleActionDef | undefined =>
  schema.actions?.find((def) => def.kind === kind)

export const maxDepthOf = (schema: RuleSchema): number => schema.maxDepth ?? DEFAULT_MAX_DEPTH

/** 字段按分组归拢：保持字段次序，组按首次出现的次序；没有分组的放末尾（heading 为空串）。 */
export function groupedFields(fields: readonly RuleField[]): { group: string; fields: RuleField[] }[] {
  const groups = new Map<string, RuleField[]>()
  for (const field of fields) groups.set(field.group ?? '', [...(groups.get(field.group ?? '') ?? []), field])
  const named = [...groups].filter(([group]) => group !== '')
  const rest = groups.get('')
  return [...named, ...(rest ? [['', rest] as const] : [])].map(([group, list]) => ({ group, fields: [...list] }))
}

// ---------------------------------------------------------------- 值

/** 运算符要的值的空模板。 */
export function emptyValue(operator: RuleOperator | undefined): RuleValue {
  switch (operator?.input) {
    case 'range':
      return { kind: 'range', min: null, max: null }
    case 'option':
    case 'text':
      return { kind: 'text', value: '' }
    case 'list':
      return { kind: 'list', values: [] }
    default:
      return { kind: 'number', value: null }
  }
}

/** 换字段或运算符后值怎么带过去：种类一样的保留（数、文字、选项、引用），不一样的清空；换了字段后选项不在新字段里的清掉。 */
export function carryValue(
  previous: RuleValue,
  operator: RuleOperator | undefined,
  field: RuleField | undefined,
): RuleValue {
  const blank = emptyValue(operator)
  if (operator === undefined) return blank
  const known = (value: string) =>
    field?.options === undefined || field.options.some((option) => option.value === value)
  if (previous.kind === 'ref') return operator.allowRef === true && operator.input === 'number' ? previous : blank
  if (previous.kind !== blank.kind) return blank
  if (previous.kind === 'text' && operator.input === 'option') return known(previous.value) ? previous : blank
  if (previous.kind === 'list') return { kind: 'list', values: previous.values.filter(known) }
  return previous
}

/** 两个字段的值是不是同一个口径：类型、单位相同，枚举的选项也相同。口径不同的值换过去会悄悄变意思（亿 → %）。 */
export function sameDomain(a: RuleField | undefined, b: RuleField | undefined): boolean {
  if (a === undefined || b === undefined || a.type !== b.type || a.unit !== b.unit) return false
  const keys = (field: RuleField) => (field.options ?? []).map((option) => option.value).toSorted()
  return JSON.stringify(keys(a)) === JSON.stringify(keys(b))
}

/**
 * 换字段后值怎么办：类型或单位不同、选项不同的清空要求重填；同类同单位才保留；引用另一个字段的值一律清空（换了被比的一方，意思就变了）。
 * 只换运算符时用 carryValue。
 */
export function carryFieldValue(
  previous: RuleValue,
  from: RuleField | undefined,
  to: RuleField | undefined,
  operator: RuleOperator | undefined,
): RuleValue {
  if (previous.kind === 'ref' || !sameDomain(from, to)) return emptyValue(operator)
  return carryValue(previous, operator, to)
}

/** 受控的 value 换了不算「换了一份规则」的情形：还是自己上一次写出去的那份（引用相同或内容相同，调用方存盘再读回来、拷贝一份都不算换）。 */
export function isSameDocument(next: Rule, written: Rule | null): boolean {
  return written !== null && (next === written || JSON.stringify(next) === JSON.stringify(written))
}

// ---------------------------------------------------------------- 树的查找与改

/** 一个节点的位置：父组、在父组里的下标、层数（根组是 1）。 */
export type RuleLocation = { parent: RuleGroup; index: number; depth: number; node: RuleNode }

/** 按 id 找节点；根组自己不在结果里（它没有父）。 */
export function locate(root: RuleGroup, id: string): RuleLocation | null {
  const walk = (group: RuleGroup, depth: number): RuleLocation | null => {
    for (const [index, node] of group.children.entries()) {
      if (node.id === id) return { parent: group, index, depth: depth + 1, node }
      if (isGroup(node)) {
        const inner = walk(node, depth + 1)
        if (inner !== null) return inner
      }
    }
    return null
  }
  return walk(root, 1)
}

/** 组所在的层数（根组是 1）；找不到返回 null。 */
export function depthOf(root: RuleGroup, id: string): number | null {
  if (root.id === id) return 1
  const found = locate(root, id)
  return found === null ? null : found.depth
}

/** 整棵规则里所有 id（条件、组、动作），用来造不重复的新 id。 */
export function allIds(rule: Rule): Set<string> {
  const ids = new Set<string>([rule.when.id])
  const walk = (group: RuleGroup) => {
    for (const node of group.children) {
      ids.add(node.id)
      if (isGroup(node)) walk(node)
    }
  }
  walk(rule.when)
  for (const action of [...rule.ifTrue, ...rule.ifFalse]) ids.add(action.id)
  return ids
}

/** 现存的 id 再加上两段动作列表的名字（组件拿它给「改过的行」去掉已经不存在的，免得删了再加、新行顶着旧 id 一上来就红）。 */
export function liveIds(rule: Rule): Set<string> {
  return new Set([...allIds(rule), 'ifTrue', 'ifFalse'])
}

/** 新 id：前缀 + 序号，跳过已有的；同样的规则每次造出同样的 id（测试与快照稳定）。 */
export function freshId(rule: Rule, prefix: string): string {
  const ids = allIds(rule)
  for (let n = 1; ; n += 1) {
    const id = `${prefix}-${n}`
    if (!ids.has(id)) return id
  }
}

/** 改一个组里的节点（沿路径重建，别的不动）。找不到 id 返回原对象。 */
function mapGroup(group: RuleGroup, id: string, update: (node: RuleNode) => RuleNode): RuleGroup {
  let changed = false
  const children = group.children.map((node) => {
    if (node.id === id) {
      changed = true
      return update(node)
    }
    if (!isGroup(node)) return node
    const inner = mapGroup(node, id, update)
    if (inner !== node) changed = true
    return inner
  })
  return changed ? { ...group, children } : group
}

/** 改某个组自己（根组也行）：update 拿到旧组，返回新组。 */
function mapOwner(root: RuleGroup, id: string, update: (group: RuleGroup) => RuleGroup): RuleGroup {
  if (root.id === id) return update(root)
  return mapGroup(root, id, (node) => (isGroup(node) ? update(node) : node))
}

/** 替换一个节点（按 id）；锁定的条件只许改值。 */
export function updateNode(rule: Rule, id: string, update: (node: RuleNode) => RuleNode): Rule {
  const when = mapGroup(rule.when, id, (node) => {
    const next = update(node)
    if (node.type === 'condition' && node.locked === true && next.type === 'condition') {
      return { ...node, value: next.value }
    }
    return next
  })
  return when === rule.when ? rule : { ...rule, when }
}

/** 切一个组的 and / or。 */
export function setMode(rule: Rule, groupId: string, mode: RuleMode): Rule {
  const when = mapOwner(rule.when, groupId, (group) => (group.mode === mode ? group : { ...group, mode }))
  return when === rule.when ? rule : { ...rule, when }
}

/** 在组里的第 index 个位置插入（默认末尾）；超出层数上限的组插不进去，返回 null。 */
export function insertNode(
  rule: Rule,
  groupId: string,
  node: RuleNode,
  schema: RuleSchema,
  index?: number,
): Rule | null {
  const depth = depthOf(rule.when, groupId)
  if (depth === null) return null
  if (isGroup(node) && depth + 1 > maxDepthOf(schema)) return null
  const when = mapOwner(rule.when, groupId, (group) => {
    const at = Math.min(Math.max(index ?? group.children.length, 0), group.children.length)
    return { ...group, children: [...group.children.slice(0, at), node, ...group.children.slice(at)] }
  })
  return { ...rule, when }
}

/** 节点自己是锁定条件，或它的子树里有锁定条件。 */
export function hasLocked(node: RuleNode): boolean {
  return node.type === 'condition' ? node.locked === true : node.children.some(hasLocked)
}

/** 删一个节点；锁定的条件删不掉，子树里含锁定条件的组也删不掉（返回 null：不会连带删掉风控前提）。返回新规则与删后该聚焦的节点 id（前一个，没有就后一个，都没有 null）。 */
export function removeNode(rule: Rule, id: string): { rule: Rule; focus: string | null } | null {
  const found = locate(rule.when, id)
  if (found === null) return null
  if (hasLocked(found.node)) return null
  const siblings = found.parent.children
  const focus = (siblings[found.index - 1] ?? siblings[found.index + 1])?.id ?? null
  const when = mapOwner(rule.when, found.parent.id, (group) => ({
    ...group,
    children: group.children.filter((node) => node.id !== id),
  }))
  return { rule: { ...rule, when }, focus }
}

const isLocked = (node: RuleNode | undefined): boolean => node?.type === 'condition' && node.locked === true

/** 同一组里有几个排在最前面的锁定条件；别的节点不许挪到它们前面。 */
export function lockedPrefix(children: readonly RuleNode[]): number {
  let count = 0
  while (isLocked(children[count])) count += 1
  return count
}

/** 在同一个组里挪到第 to 个位置（to 是挪走自己之后的下标）。跨组不允许；锁定的不能挪、别人也不能挪到锁定的前面；没变化返回 null。 */
export function moveNode(rule: Rule, id: string, to: number): Rule | null {
  const found = locate(rule.when, id)
  if (found === null || isLocked(found.node)) return null
  const children = found.parent.children
  const target = Math.min(Math.max(to, lockedPrefix(children)), children.length - 1)
  if (target === found.index) return null
  const rest = children.filter((node) => node.id !== id)
  const next = [...rest.slice(0, target), found.node, ...rest.slice(target)]
  const when = mapOwner(rule.when, found.parent.id, (group) => ({ ...group, children: next }))
  return { ...rule, when }
}

/** 上下挪一格（Alt+↑↓）；挪不动返回 null。 */
export function stepNode(rule: Rule, id: string, delta: -1 | 1): Rule | null {
  const found = locate(rule.when, id)
  if (found === null) return null
  return moveNode(rule, id, found.index + delta)
}

/** 拖动落点：在第 slot 个缝（0 到 n，n 是末尾）前放下，换算成挪走自己之后的下标。 */
export const slotToIndex = (from: number, slot: number): number => (slot > from ? slot - 1 : slot)

// ---------------------------------------------------------------- 动作

/** 动作列表的上下挪、增、删、改，规则同条件：只在自己那一段里。 */
export function insertAction(rule: Rule, branch: RuleBranch, action: RuleAction, index?: number): Rule {
  const list = rule[branch]
  const at = Math.min(Math.max(index ?? list.length, 0), list.length)
  return { ...rule, [branch]: [...list.slice(0, at), action, ...list.slice(at)] }
}

export function removeAction(rule: Rule, id: string): { rule: Rule; focus: string | null } | null {
  for (const branch of ['ifTrue', 'ifFalse'] as const) {
    const index = rule[branch].findIndex((action) => action.id === id)
    if (index < 0) continue
    const list = rule[branch]
    return {
      rule: { ...rule, [branch]: list.filter((action) => action.id !== id) },
      focus: (list[index - 1] ?? list[index + 1])?.id ?? null,
    }
  }
  return null
}

export function updateAction(rule: Rule, id: string, update: (action: RuleAction) => RuleAction): Rule {
  for (const branch of ['ifTrue', 'ifFalse'] as const) {
    if (!rule[branch].some((action) => action.id === id)) continue
    return { ...rule, [branch]: rule[branch].map((action) => (action.id === id ? update(action) : action)) }
  }
  return rule
}

export function moveAction(rule: Rule, id: string, to: number): Rule | null {
  for (const branch of ['ifTrue', 'ifFalse'] as const) {
    const list = rule[branch]
    const from = list.findIndex((action) => action.id === id)
    if (from < 0) continue
    const target = Math.min(Math.max(to, 0), list.length - 1)
    if (target === from) return null
    const rest = list.filter((action) => action.id !== id)
    return { ...rule, [branch]: [...rest.slice(0, target), list[from]!, ...rest.slice(target)] }
  }
  return null
}

/** 动作在哪一段、第几个。 */
export function locateAction(rule: Rule, id: string): { branch: RuleBranch; index: number; action: RuleAction } | null {
  for (const branch of ['ifTrue', 'ifFalse'] as const) {
    const index = rule[branch].findIndex((action) => action.id === id)
    if (index >= 0) return { branch, index, action: rule[branch][index]! }
  }
  return null
}

// ---------------------------------------------------------------- 校验

/** What is wrong with a row. */
export type RuleIssueCode =
  | 'unknown-field'
  | 'unknown-operator'
  | 'required'
  | 'out-of-range'
  | 'range-order'
  | 'unknown-option'
  | 'ref-invalid'
  | 'ref-self'
  | 'empty-group'
  | 'too-deep'
  | 'unknown-action'
  | 'no-action'

/** Which control of the row the issue belongs to. */
export type RuleIssuePart = 'field' | 'op' | 'value' | 'min' | 'max' | 'param' | 'row'

/** One problem found by validateRule. id is the condition, group or action; 'ifTrue' for a missing action list. */
export type RuleIssue = {
  id: string
  code: RuleIssueCode
  part: RuleIssuePart
  /** Key of the action parameter, for part param. */
  key?: string
  /** The field's smallest number, for out-of-range. */
  min?: number
  /** The field's largest number, for out-of-range. */
  max?: number
}

function checkNumber(
  value: number | null,
  bounds: { min?: number; max?: number },
  id: string,
  part: 'value' | 'min' | 'max',
): RuleIssue | null {
  if (value === null || !Number.isFinite(value)) return { id, code: 'required', part }
  if ((bounds.min !== undefined && value < bounds.min) || (bounds.max !== undefined && value > bounds.max)) {
    return { id, code: 'out-of-range', part, min: bounds.min, max: bounds.max }
  }
  return null
}

/** 校验一个条件的值，返回这一行所有问题（字段与运算符没问题才查值）。 */
export function validateCondition(condition: RuleCondition, schema: RuleSchema): RuleIssue[] {
  const { id } = condition
  const field = fieldOf(schema, condition.field)
  if (field === undefined) return [{ id, code: 'unknown-field', part: 'field' }]
  const operator = operatorOf(schema, field, condition.op)
  if (operator === undefined) return [{ id, code: 'unknown-operator', part: 'op' }]
  const value = condition.value
  const bounds = { min: field.min, max: field.max }
  const issues: (RuleIssue | null)[] = []
  if (value.kind === 'ref') {
    if (operator.allowRef !== true || operator.input !== 'number') return [{ id, code: 'ref-invalid', part: 'value' }]
    if (value.field === null || value.field === '') return [{ id, code: 'required', part: 'value' }]
    if (value.field === field.key) return [{ id, code: 'ref-self', part: 'value' }]
    const target = fieldOf(schema, value.field)
    if (target === undefined || target.type !== 'number') return [{ id, code: 'ref-invalid', part: 'value' }]
    return []
  }
  switch (operator.input) {
    case 'number':
      issues.push(
        value.kind === 'number'
          ? checkNumber(value.value, bounds, id, 'value')
          : { id, code: 'required', part: 'value' },
      )
      break
    case 'range': {
      if (value.kind !== 'range') {
        issues.push({ id, code: 'required', part: 'min' }, { id, code: 'required', part: 'max' })
        break
      }
      issues.push(checkNumber(value.min, bounds, id, 'min'), checkNumber(value.max, bounds, id, 'max'))
      if (!issues.some((issue) => issue !== null) && value.min! > value.max!) {
        issues.push({ id, code: 'range-order', part: 'max' })
      }
      break
    }
    case 'option':
    case 'text': {
      const text = value.kind === 'text' ? value.value : ''
      if (text.trim() === '') issues.push({ id, code: 'required', part: 'value' })
      else if (operator.input === 'option' && field.options?.some((option) => option.value === text) === false) {
        issues.push({ id, code: 'unknown-option', part: 'value' })
      }
      break
    }
    case 'list': {
      const values = value.kind === 'list' ? value.values : []
      if (values.length === 0) issues.push({ id, code: 'required', part: 'value' })
      else if (
        field.options !== undefined &&
        values.some((item) => !field.options!.some((option) => option.value === item))
      ) {
        issues.push({ id, code: 'unknown-option', part: 'value' })
      }
      break
    }
  }
  return issues.filter((issue): issue is RuleIssue => issue !== null)
}

/** 校验一个动作：种类要在定义里，每个参数（没标 optional 的）必填、数字参数在范围内、选项要存在。 */
export function validateAction(action: RuleAction, schema: RuleSchema): RuleIssue[] {
  const { id } = action
  const def = actionDefOf(schema, action.kind)
  if (def === undefined) return [{ id, code: 'unknown-action', part: 'row' }]
  const issues: RuleIssue[] = []
  for (const param of def.params ?? []) {
    const value = action.params?.[param.key]
    const empty = value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')
    if (empty) {
      if (param.optional !== true) issues.push({ id, code: 'required', part: 'param', key: param.key })
      continue
    }
    if (param.input === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        issues.push({ id, code: 'required', part: 'param', key: param.key })
      } else if ((param.min !== undefined && value < param.min) || (param.max !== undefined && value > param.max)) {
        issues.push({ id, code: 'out-of-range', part: 'param', key: param.key, min: param.min, max: param.max })
      }
    } else if (param.input === 'option' && param.options?.some((option) => option.value === value) === false) {
      issues.push({ id, code: 'unknown-option', part: 'param', key: param.key })
    }
  }
  return issues
}

/**
 * Checks the whole rule and returns every problem in reading order (empty when it is valid).
 * 整棵校验：条件的值（必填、数值范围、区间次序、选项存在、引用）、空组、超出层数、动作种类与各个参数、schema.requireActions 为真时若为真至少一个动作。
 * 组件的红框与读屏说明读的就是这份结果，所以它和件里看到的错误一定一致。
 */
export function validateRule(rule: Rule, schema: RuleSchema): RuleIssue[] {
  const issues: RuleIssue[] = []
  const max = maxDepthOf(schema)
  const walk = (group: RuleGroup, depth: number) => {
    if (depth > max) issues.push({ id: group.id, code: 'too-deep', part: 'row' })
    if (group.children.length === 0) issues.push({ id: group.id, code: 'empty-group', part: 'row' })
    for (const node of group.children) {
      if (isGroup(node)) walk(node, depth + 1)
      else issues.push(...validateCondition(node, schema))
    }
  }
  walk(rule.when, 1)
  if (schema.actions !== undefined && schema.actions.length > 0) {
    if (schema.requireActions === true && rule.ifTrue.length === 0) {
      issues.push({ id: 'ifTrue', code: 'no-action', part: 'row' })
    }
    for (const action of [...rule.ifTrue, ...rule.ifFalse]) issues.push(...validateAction(action, schema))
  }
  return issues
}

/** 按 id 归拢问题，组件逐行取。 */
export function issuesById(issues: readonly RuleIssue[]): Map<string, RuleIssue[]> {
  const map = new Map<string, RuleIssue[]>()
  for (const issue of issues) map.set(issue.id, [...(map.get(issue.id) ?? []), issue])
  return map
}

// ---------------------------------------------------------------- 自然语言回读

/** One action parameter in the readback: its text (blank when not filled in) and the connector word before it, if any. */
export type RuleTextParam = { text: string; connector: string | undefined }

/** Texts that turn a rule into a sentence; the caller supplies all of them (the package ships no language). */
export type RuleTextTemplates = {
  /** Wraps the whole condition text, such as (body) => `When ${body}`. */
  when: (body: string) => string
  /** Between two conditions of an and group. */
  and: string
  /** Between two conditions of an or group. */
  or: string
  /** Wraps a nested group with more than one member, such as (inner) => `(${inner})`. */
  group: (inner: string) => string
  /** One condition from its field, operator and value text. */
  condition: (field: string, operator: string, value: string) => string
  /** A number with its unit. */
  number: (value: number, unit: string | undefined) => string
  /** A range from its two number texts. */
  range: (min: string, max: string) => string
  /** A list of choices, such as (labels) => labels.join(' / '). */
  list: (labels: readonly string[]) => string
  /** Stands for a value that is not filled in yet. */
  blank: string
  /** Stands for a rule with no conditions. */
  empty: string
  /** Wraps the actions that run when the conditions hold, such as (actions) => `then ${actions}`. */
  ifTrue: (actions: string) => string
  /** Wraps the actions that run when they do not, such as (actions) => `otherwise ${actions}`. */
  ifFalse: (actions: string) => string
  /** One action from its label and its parameters (text and connector word each, in the order they are shown). */
  action: (label: string, params: readonly RuleTextParam[]) => string
  /** Between two actions. */
  actionJoin: string
  /** Between the condition part and the action parts. */
  join: string
}

const numberText = (value: number | null, unit: string | undefined, templates: RuleTextTemplates): string =>
  value === null || !Number.isFinite(value) ? templates.blank : templates.number(value, unit)

/** 一个条件的回读文字：字段、运算符、值。 */
export function conditionText(condition: RuleCondition, schema: RuleSchema, templates: RuleTextTemplates): string {
  const field = fieldOf(schema, condition.field)
  if (field === undefined) return templates.blank
  const operator = operatorOf(schema, field, condition.op)
  const value = condition.value
  const optionLabel = (key: string) => field.options?.find((option) => option.value === key)?.label ?? key
  let text: string
  if (value.kind === 'ref') {
    text = value.field === null ? templates.blank : (fieldOf(schema, value.field)?.label ?? templates.blank)
  } else if (value.kind === 'number') text = numberText(value.value, field.unit, templates)
  else if (value.kind === 'range') {
    text =
      value.min === null && value.max === null
        ? templates.blank
        : templates.range(numberText(value.min, field.unit, templates), numberText(value.max, field.unit, templates))
  } else if (value.kind === 'list') {
    text = value.values.length === 0 ? templates.blank : templates.list(value.values.map(optionLabel))
  } else {
    text =
      value.value.trim() === ''
        ? templates.blank
        : operator?.input === 'option'
          ? optionLabel(value.value)
          : value.value
  }
  return templates.condition(field.label, operator?.label ?? templates.blank, text)
}

/** 一个动作的回读文字：每个参数一段（没填的写 blank，没标 optional 但没填的也写 blank，optional 没填的不写）。 */
export function actionText(action: RuleAction, schema: RuleSchema, templates: RuleTextTemplates): string {
  const def = actionDefOf(schema, action.kind)
  if (def === undefined) return templates.blank
  const params: RuleTextParam[] = []
  for (const param of def.params ?? []) {
    const value = action.params?.[param.key]
    if (value === undefined || value === '') {
      if (param.optional !== true) params.push({ text: templates.blank, connector: param.connector })
      continue
    }
    let text: string
    if (param.input === 'option') text = param.options?.find((option) => option.value === value)?.label ?? String(value)
    else if (param.input === 'number' && typeof value === 'number') text = templates.number(value, param.unit)
    else text = String(value)
    params.push({ text, connector: param.connector })
  }
  return templates.action(def.label, params)
}

function groupText(group: RuleGroup, schema: RuleSchema, templates: RuleTextTemplates, nested: boolean): string {
  // 嵌套的空组不能悄悄消失：占位写 blank，读的人才知道这里还缺东西。
  const parts = group.children.map((node) =>
    isGroup(node)
      ? node.children.length === 0
        ? templates.blank
        : groupText(node, schema, templates, true)
      : conditionText(node, schema, templates),
  )
  const joined = parts.join(group.mode === 'and' ? templates.and : templates.or)
  return nested && parts.length > 1 ? templates.group(joined) : joined
}

/**
 * Reads the whole rule back as one sentence, with the caller's templates.
 * 回读整棵规则：「当 市场 是 A 股 且（成交额 > 5 亿 或 换手率 > 3%），那么 发告警」。嵌套的组（成员多于一个）加括号；没填的值写 blank；没有动作的段不写。
 */
export function ruleToText(rule: Rule, schema: RuleSchema, templates: RuleTextTemplates): string {
  const body = rule.when.children.length === 0 ? templates.empty : groupText(rule.when, schema, templates, false)
  const actions = (list: readonly RuleAction[]) =>
    list.map((action) => actionText(action, schema, templates)).join(templates.actionJoin)
  return [
    templates.when(body),
    rule.ifTrue.length > 0 ? templates.ifTrue(actions(rule.ifTrue)) : '',
    rule.ifFalse.length > 0 ? templates.ifFalse(actions(rule.ifFalse)) : '',
  ]
    .filter((part) => part !== '')
    .join(templates.join)
}

/** 条件有几个直接成员（组里的组算一个）。 */
export const memberCount = (group: RuleGroup): number => group.children.length

/** 数一个组里有多少个条件（含嵌套的组），组头写「Group · N conditions」用。 */
export function conditionCount(group: RuleGroup): number {
  return group.children.reduce((sum, node) => sum + (isGroup(node) ? conditionCount(node) : 1), 0)
}
