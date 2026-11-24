// SPDX-License-Identifier: MIT
// 万能框 Omnibox（#224）：品种、命令、页面、插件、问 AI 在一个入口里，选中一个对象不直接打开、而是变成输入框里的标签，结果换成「对它能做什么」。
// 交互借 Jamie Merrill 的搜索系列（2026-11-24 看的录屏帧：Keyboard navigation、搜索检测意图、搜索建议、Search popover、输入搜索、基于接近度的悬停），
// 只借「有哪些部分、键盘怎么走」，实现原创；样子是我们自己的（Graphite token，皮肤在 theme/omnibox.css），不用它的白底圆角卡。
// 底座是 primitives/command（cmdk 1.1.1）：焦点一直在输入框，↑↓ 移高亮、读屏的 combobox / listbox / option 都是它的；过滤关掉，搜什么、怎么排由调用方的 onQuery 定
// （可以异步，换词时上一次的 AbortSignal 会 abort）。cmdk 的 aria-selected 说的是当前高亮，不是「已选」。组件不带行情、不带文案、不带语言。
// 输入法：回车、Esc、退格先判 isImeEvent（isComposing 或 keyCode 229）；组字中不触发回车、不切意图、不搜索，组字结束后才认最终的字。
import { CornerDownLeftIcon, SearchIcon, XIcon } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { detectPlatform } from '../hotkeys-model.ts'
import { focusRing } from '../../lib/focus.ts'
import { useProximityHighlight } from '../../lib/proximity-highlight.ts'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '../../primitives/command.tsx'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../primitives/dialog.tsx'
import {
  buildSections,
  countByCategory,
  cycleCategory,
  flattenRows,
  isImeEvent,
  intentStrength,
  isScopable,
  pushRecentItem,
  rowHint,
  splitMatch,
  stepCategory,
  type OmniboxCategory,
  type OmniboxItem,
  type OmniboxRow,
} from './omnibox-model.ts'

/** Text shown by the omnibox; the package ships no language. Optional ones are simply not drawn when missing. */
export type OmniboxLabels = {
  /** Accessible name of the omnibox (and the dialog title, read by screen readers only). */
  title: string
  /** Input placeholder; also what shows after the example carousel has run. */
  placeholder?: string
  /** Input placeholder while a scope tag is set. */
  scopedPlaceholder?: string
  /** Accessible name of the category tabs. */
  categories?: string
  /** Heading of the recent group. */
  recent?: string
  /** Button at the end of the recent heading that clears the list; drawn only when this is given. */
  clearRecent?: string
  /** Shown when nothing matches. */
  empty?: string
  /** Shown while onQuery is pending and no older rows can stay. */
  loading?: string
  /** Shown when onQuery threw or rejected. */
  error?: string
  /** Text of the "show all" row at the end of a category in the all tab. */
  showAll?: (count: number, categoryLabel: string) => string
  /** Heading above the scope's actions (for example `name => \`${name}: actions\``). */
  scopeHeading?: (scopeLabel: string) => string
  /** Accessible name of the button that removes the scope tag. */
  removeScope?: (scopeLabel: string) => string
  /** Enter hint at the end of the highlighted command row. */
  hintRun?: string
  /** Enter hint at the end of the highlighted page row. */
  hintOpen?: string
  /** Enter hint at the end of the highlighted object row (Enter makes it a scope tag). */
  hintViewOptions?: string
  /** Enter hint while Ctrl or Command is held (the row opens in a new tab). */
  hintNewTab?: string
  /** Text next to the Enter key on the right of the input when the text reads as a question. Without it questions are not detected. */
  ask?: string
  /** Footer key hints; the footer is drawn only when this is given. */
  footer?: { navigate: string; select: string; newTab: string; close: string }
  /** Text of the button (next to the "ask" hint) that turns a question back into a search when it also found results; ↓ does the same. Drawn only when given. */
  searchInstead?: string
  /** Line under the empty text that says Enter will ask the typed text (when `onAsk` is given and nothing matched). */
  askInstead?: (text: string) => string
  /** Announcement when the category changes (tabs are switched with the keyboard from the input, so the focus never moves). */
  categorySet?: (categoryLabel: string, count: number) => string
  /** Announcement for screen readers after results settle (the count is the rows drawn). */
  resultCount?: (count: number) => string
  /** Announcement when a scope tag is set. */
  scopeSet?: (scopeLabel: string) => string
  /** Announcement when the scope tag is removed. */
  scopeCleared?: string
}

export type OmniboxQuery = (
  query: string,
  scope: OmniboxItem | null,
  signal: AbortSignal,
) => readonly OmniboxItem[] | Promise<readonly OmniboxItem[]>

export type OmniboxSelectInfo = {
  /** True when chosen with Ctrl or Command held (open in a new tab; the caller does it). */
  newTab: boolean
  /** The scope tag that was set when the row was chosen (an action of that object), or null. */
  scope: OmniboxItem | null
}

export type OmniboxProps = {
  /** Search: return the matching items of every category (or, with a scope, that object's actions); may be async. The previous call's signal aborts when the query changes. */
  onQuery: OmniboxQuery
  /** Called when a command or page is chosen (Enter or click), or any row with Ctrl or Command held. */
  onSelect: (item: OmniboxItem, info: OmniboxSelectInfo) => void
  /** Called with the text and the scope when the text reads as a question and Enter is pressed. Without it questions are not detected. */
  onAsk?: (text: string, scope: OmniboxItem | null) => void
  /** Categories in order; the first is the "all" tab. Items match them by `category`. */
  categories: readonly OmniboxCategory[]
  /** Controlled category id. */
  category?: string
  /** Initial category id when uncontrolled. Defaults to the first one. */
  defaultCategory?: string
  /** Called when the category changes. */
  onCategoryChange?: (category: string) => void
  /** Controlled scope (the object turned into a tag), or null for none. */
  scope?: OmniboxItem | null
  /** Initial scope when uncontrolled. */
  defaultScope?: OmniboxItem | null
  /** Called when a scope tag is set or removed. */
  onScopeChange?: (scope: OmniboxItem | null) => void
  /** Controlled recent items, newest first. */
  recent?: readonly OmniboxItem[]
  /** Called with the new recent list after a choice or after clearing. Uncontrolled keeps them in memory only. */
  onRecentChange?: (recent: OmniboxItem[]) => void
  /** Most recent items kept. Defaults to 5. */
  recentLimit?: number
  /** Rows per category in the all tab before the "show all" row. Defaults to 4. */
  perCategory?: number
  /** Example queries that rotate as the placeholder while the box is empty. They stop on hover and after `placeholderCycles` rounds. */
  placeholders?: readonly string[]
  /** Milliseconds each example stays. Defaults to 2800. */
  placeholderInterval?: number
  /** How many rounds through the examples before it settles on `labels.placeholder`. Defaults to 1. */
  placeholderCycles?: number
  /** Decides whether the text reads as a question: true always asks, `'weak'` asks only when the search found nothing (long product names reach the length threshold), false never. Defaults to a function built on `intentStrength` (question mark, question word, long text). */
  detectIntent?: (text: string) => boolean | 'weak'
  /** Initial text in the input. */
  defaultQuery?: string
  /** Delay before onQuery runs after typing, in ms. Defaults to 80. */
  debounceMs?: number
  /** Text. */
  labels: OmniboxLabels
  /** Extra class name on the root. */
  className?: string
}

const NO_ITEMS: readonly OmniboxItem[] = []

const defaultIntent = (text: string): boolean | 'weak' => {
  const strength = intentStrength(text)
  return strength === 'weak' ? 'weak' : strength === 'strong'
}

type Result = { status: 'idle' | 'done' | 'error'; items: readonly OmniboxItem[]; for: string; scope: string }

function Highlight({ text, query }: { text: string; query: string }) {
  const { before, hit, after } = splitMatch(text, query)
  return (
    <>
      {before}
      {hit ? <mark data-slot="omnibox-hit">{hit}</mark> : null}
      {after}
    </>
  )
}

/** 万能框面板：可以直接摆进页里，也可以经 OmniboxDialog 弹出。 */
export function Omnibox({
  onQuery,
  onSelect,
  onAsk,
  categories,
  category: categoryProp,
  defaultCategory,
  onCategoryChange,
  scope: scopeProp,
  defaultScope = null,
  onScopeChange,
  recent: recentProp,
  onRecentChange,
  recentLimit = 5,
  perCategory = 4,
  placeholders,
  placeholderInterval = 2800,
  placeholderCycles = 1,
  detectIntent = defaultIntent,
  defaultQuery = '',
  debounceMs = 80,
  labels,
  className,
}: OmniboxProps) {
  const allId = categories[0]?.id ?? 'all'
  const [query, setQuery] = useState(defaultQuery)
  // 组字中的输入不进搜索与意图：settled 是最近一次不在组字时的内容。
  const [settled, setSettled] = useState(defaultQuery)
  const [composing, setComposing] = useState(false)
  const composingRef = useRef(false)
  const [categoryState, setCategoryState] = useState(defaultCategory ?? allId)
  const category = categoryProp ?? categoryState
  const [scopeState, setScopeState] = useState<OmniboxItem | null>(defaultScope)
  const scope = scopeProp === undefined ? scopeState : scopeProp
  const [recentState, setRecentState] = useState<OmniboxItem[]>([])
  const recent = recentProp ?? recentState
  const [result, setResult] = useState<Result>({ status: 'idle', items: [], for: '', scope: '' })
  const [highlighted, setHighlighted] = useState('')
  const [modifierHeld, setModifierHeld] = useState(false)
  const [announce, setAnnounce] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const clickNewTab = useRef(false)
  // 结果还没回来时按的回车：先记着（连同当时的作用域、查询、页签），这次的结果一到、上下文还对得上才对第一行生效（不对着上一次的旧行动手）。
  const pendingEnter = useRef<{ newTab: boolean; context: string } | null>(null)
  const askId = useId()
  const altId = useId()
  const scopeTagId = useId()
  const modLabel = useMemo(() => (detectPlatform() === 'mac' ? '\u2318' : 'Ctrl'), [])

  const scopeId = scope?.id ?? ''
  const runQuery = useEffectEvent((text: string, signal: AbortSignal) => onQuery(text, scope, signal))

  // 换词或换作用域：等 debounceMs 再问；上一次没回来的 abort 掉，回来晚了也不认。问句模式下也照查：搜出结果时给「改为搜索」的出口，长的品种名也不会被收起。
  useEffect(() => {
    const controller = new AbortController()
    const key = `${scopeId}\u0000${settled}`
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(() => runQuery(settled, controller.signal))
        .then(
          (items) => {
            if (!controller.signal.aborted) setResult({ status: 'done', items, for: key, scope: scopeId })
          },
          () => {
            if (!controller.signal.aborted) setResult({ status: 'error', items: [], for: key, scope: scopeId })
          },
        )
    }, debounceMs)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [settled, scopeId, debounceMs])

  // 作用域换了以后，上一个作用域的行不能再显示：只留同作用域的旧行（换词时先留着旧行，不闪空）。
  const items = useMemo(() => (result.scope === scopeId ? result.items : NO_ITEMS), [result, scopeId])
  const loading = result.for !== `${scopeId}\u0000${settled}` || result.status === 'idle'
  const emptyQuery = settled.trim() === ''
  // 页签计数：查询一变、新结果还没到时旧数不能留着（也不能被读屏播报）。空查询的结果记下来，清空输入时同步用它；没有就先写「…」。
  const [emptyCache, setEmptyCache] = useState<{ scope: string; items: readonly OmniboxItem[] } | null>(null)
  if (
    result.status === 'done' &&
    !loading &&
    settled.trim() === '' &&
    (emptyCache?.items !== result.items || emptyCache.scope !== scopeId)
  ) {
    setEmptyCache({ scope: scopeId, items: result.items })
  }
  const countItems =
    !loading || result.for === `${scopeId}\u0000${settled}`
      ? items
      : emptyQuery && emptyCache?.scope === scopeId
        ? emptyCache.items
        : null
  const counts = useMemo(() => countByCategory(countItems ?? NO_ITEMS), [countItems])

  // 问句模式：强意图（问号、疑问词）一律收起结果；弱意图（只是够长）要等搜索回来、确实没有结果才收起。
  // 用户按 ↓ 或点「搜索」改回搜索后，记下当时的文字（forcedFor），文字再变就重新判定。
  const [forcedFor, setForcedFor] = useState<string | null>(null)
  const intent = onAsk !== undefined && labels.ask !== undefined ? detectIntent(settled) : false
  const settledEmpty = !loading && result.status === 'done' && items.length === 0
  const asking = intent !== false && forcedFor !== settled && (intent === true || settledEmpty)
  const hasResults = !loading && items.length > 0
  const contextKey = `${scopeId}\u0000${settled}\u0000${category}`

  // 问句模式下不画行：结果区是收起的，cmdk 也就没有高亮行，输入框的 aria-activedescendant 不会指到读不到的 option。
  const sections = useMemo(
    () =>
      asking
        ? []
        : buildSections({
            items,
            categories,
            category,
            scoped: scope !== null,
            recent,
            empty: emptyQuery,
            perCategory,
            recentHeading: labels.recent,
          }),
    [asking, items, categories, category, scope, recent, emptyQuery, perCategory, labels.recent],
  )
  const rowsByKey = useMemo(() => flattenRows(sections), [sections])
  // 新结果到了、换了页签或作用域：高亮回到第一行可选的行（cmdk 对已在列表里的行不会自己挪）。渲染期里调整，不用 effect。
  const highlightKey = `${result.for}\u0000${category}\u0000${scopeId}\u0000${asking}`
  const [highlightFor, setHighlightFor] = useState('')
  if (highlightFor !== highlightKey) {
    setHighlightFor(highlightKey)
    const first = sections.flatMap((section) => section.rows).find((row) => row.type === 'more' || !row.item.disabled)
    if (first) setHighlighted(first.key)
  }
  const highlightedRow = rowsByKey.get(highlighted)

  const changeCategory = (next: string) => {
    pendingEnter.current = null
    if (categoryProp === undefined) setCategoryState(next)
    onCategoryChange?.(next)
    // 页签是在输入框里用键盘切的，焦点不动，读屏要靠播报才知道换了。
    const count = next === allId ? items.length : (counts[next] ?? 0)
    const label = categories.find((entry) => entry.id === next)?.label ?? ''
    setAnnounce(labels.categorySet?.(label, count) ?? '')
  }
  const changeScope = (next: OmniboxItem | null) => {
    pendingEnter.current = null
    if (scopeProp === undefined) setScopeState(next)
    onScopeChange?.(next)
    setQuery('')
    setSettled('')
    // 回到「全部」：受控时也要通知（不然删了标签页签还停在原来那类，跟不受控不一致）。
    if (category !== allId) changeCategory(allId)
    setAnnounce(next ? (labels.scopeSet?.(next.label) ?? '') : (labels.scopeCleared ?? ''))
    inputRef.current?.focus()
  }
  const changeRecent = (next: OmniboxItem[]) => {
    if (recentProp === undefined) setRecentState(next)
    onRecentChange?.(next)
  }

  // 选中一行：对象（默认）变成作用域标签；命令与页面回调；按着 ⌘ / Ctrl 的一律直接回调并带「新标签」。
  const commit = (row: OmniboxRow, newTab: boolean) => {
    if (row.type === 'more') {
      changeCategory(row.category)
      inputRef.current?.focus()
      return
    }
    const { item } = row
    if (item.disabled) return
    // 作用域下的动作带着上下文，进不了「最近」（再点它就丢了对象）；对象、命令、页面进。
    if (scope === null) changeRecent(pushRecentItem(recent, item, recentLimit))
    if (isScopable(item) && !newTab) {
      changeScope(item)
      return
    }
    onSelect(item, { newTab, scope })
  }

  const categoryIds = categories.map((entry) => entry.id)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    setModifierHeld(event.metaKey || event.ctrlKey)
    if (isImeEvent(event)) return
    const plain = !event.metaKey && !event.ctrlKey && !event.altKey
    switch (event.key) {
      case 'Tab': {
        if (!plain || scope !== null || asking || categories.length < 2) return
        // 停在最后一个页签再按 Tab（或停在第一个再按 Shift+Tab）把焦点放出去：摆在页里的面板没有 Esc，不能把键盘用户锁在输入框里（WCAG 2.1.2）。
        const next = stepCategory(categoryIds, category, event.shiftKey ? -1 : 1)
        if (next === null) return
        event.preventDefault()
        changeCategory(next)
        return
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        // 输入框里有字时左右键是移光标；空的时候才换页签。
        if (!plain || event.shiftKey || query !== '' || scope !== null || asking || categories.length < 2) return
        event.preventDefault()
        changeCategory(cycleCategory(categoryIds, category, event.key === 'ArrowRight' ? 1 : -1))
        return
      }
      case 'Backspace': {
        if (query === '' && scope !== null && plain) {
          event.preventDefault()
          changeScope(null)
        }
        return
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        // 用户用方向键选了行：记着的回车作废，不再覆盖他的选择。
        pendingEnter.current = null
        // 问句模式：↓ 在搜出了结果时改回搜索；没有行可走，别让 cmdk 处理。
        if (asking) {
          event.preventDefault()
          if (event.key === 'ArrowDown' && hasResults) setForcedFor(settled)
        }
        return
      }
      case 'Enter': {
        if (asking) {
          event.preventDefault()
          const text = settled.trim()
          if (text) onAsk?.(text, scope)
          return
        }
        // 刚打开时「最近」是本地数据，高亮在它上面就照常选，不等第一次搜索回来。
        const onRecent = emptyQuery && highlightedRow?.type === 'item' && highlightedRow.recent
        if (loading && !onRecent) {
          // 这次的结果还没到：显示的是上一次的旧行，不拿它们动手；有字时记下，结果一到（上下文还对得上）再选第一行。
          event.preventDefault()
          pendingEnter.current = settled.trim() ? { newTab: event.metaKey || event.ctrlKey, context: contextKey } : null
          return
        }
        // 没有任何结果又给了 onAsk：回车把打的字拿去问，不白按。
        if (settledEmpty && rowsByKey.size === 0 && onAsk !== undefined && labels.ask !== undefined && settled.trim()) {
          event.preventDefault()
          onAsk(settled.trim(), scope)
          return
        }
        if (event.metaKey || event.ctrlKey) {
          // cmdk 对带修饰键的回车也照常选中；这里接过来，带「新标签」。
          event.preventDefault()
          if (highlightedRow) commit(highlightedRow, true)
        }
        return
      }
    }
  }

  // 占位轮播：空框、没有标签、不在组字、没被悬停时每 placeholderInterval 换一条；转完 placeholderCycles 轮停下，回到静态占位。
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselDone, setCarouselDone] = useState(false)
  const pausedRef = useRef(false)
  const exampleCount = placeholders?.length ?? 0
  const carouselRuns = exampleCount > 1 && query === '' && scope === null && !composing && !carouselDone
  useEffect(() => {
    if (!carouselRuns) return
    let ticks = 0
    const timer = setInterval(() => {
      if (pausedRef.current) return
      ticks += 1
      if (ticks >= exampleCount * placeholderCycles) {
        setCarouselDone(true)
        return
      }
      setCarouselIndex(ticks % exampleCount)
    }, placeholderInterval)
    return () => clearInterval(timer)
  }, [carouselRuns, exampleCount, placeholderCycles, placeholderInterval])
  const example =
    exampleCount > 0 && query === '' && scope === null && !composing && !carouselDone
      ? placeholders![Math.min(carouselIndex, exampleCount - 1)]
      : undefined

  // 接近度高亮：一块底色在行间滑动（theme/proximity-highlight.css 给过渡）；跟 cmdk 的高亮行走，鼠标只负责让它早一点动身。
  const { highlightRef } = useProximityHighlight(listRef, {
    itemSelector: '[cmdk-item]',
    activeSelector: '[cmdk-item][aria-selected="true"]',
  })

  // 预览卡：高亮的对象行停留一小会儿才浮出（指针快速划过不闪），放在面板右侧、放不下换左侧、两边都放不下就不出。
  const [preview, setPreview] = useState<{ key: string; top: number; side: 'right' | 'left'; node: ReactNode } | null>(
    null,
  )
  const previewNode = highlightedRow?.type === 'item' ? highlightedRow.item.preview : undefined
  useEffect(() => {
    if (previewNode == null || asking) return
    const timer = setTimeout(() => {
      const root = rootRef.current
      const row = listRef.current?.querySelector<HTMLElement>(`[cmdk-item][data-value="${CSS.escape(highlighted)}"]`)
      if (!root || !row) return
      const box = root.getBoundingClientRect()
      const rect = row.getBoundingClientRect()
      const room = 280 // 卡宽 260 加 12 的间隙，再留 8
      const side = window.innerWidth - box.right >= room ? 'right' : box.left >= room ? 'left' : null
      setPreview(side ? { key: highlighted, top: rect.top - box.top, side, node: previewNode } : null)
    }, 140)
    return () => clearTimeout(timer)
  }, [highlighted, previewNode, asking])

  // 只认高亮还停在同一行的预览：换行或收起时立刻不显示（不在 effect 里清状态）。
  const shownPreview = preview && preview.key === highlighted && previewNode != null && !asking ? preview : null

  // 读屏：结果稳定后报一次个数（停 400ms 再报，打字时不刷屏）。报的是画出来的条数（被每类前几条截过、不含「显示全部」与清除），不是搜到的总数。
  const drawnCount = useMemo(() => [...rowsByKey.values()].filter((row) => row.type === 'item').length, [rowsByKey])
  const announceCount = useEffectEvent(() => setAnnounce(labels.resultCount?.(drawnCount) ?? ''))
  useEffect(() => {
    if (result.status !== 'done' || asking) return
    const timer = setTimeout(announceCount, 400)
    return () => clearTimeout(timer)
  }, [result, asking])

  // 记着的回车：这次的结果到了就对高亮（刚重置到第一行）的行生效；之后清掉。
  const settleEnter = useEffectEvent(() => {
    const pending = pendingEnter.current
    pendingEnter.current = null
    // 上下文（作用域、查询、页签）换了就作废：不拿别处的第一行动手。
    if (pending && pending.context === contextKey && !asking && highlightedRow) commit(highlightedRow, pending.newTab)
  })
  useEffect(() => {
    if (!loading) settleEnter()
  }, [loading, result])

  const onInputChange = (value: string) => {
    pendingEnter.current = null
    setQuery(value)
    if (!composingRef.current) setSettled(value)
  }

  // 没有任何结果又能问：空态下告诉用户回车会拿去问。
  const askFallback =
    settledEmpty &&
    onAsk !== undefined &&
    labels.ask !== undefined &&
    labels.askInstead !== undefined &&
    settled.trim() !== ''

  // cmdk 的输入框把 aria-expanded 写死成 true（它的属性排在传进去的 props 后面，盖不掉）：问句模式列表收起了，直接改 DOM 属性；
  // aria-activedescendant 不用管：问句模式不画行，cmdk 没有高亮行时它自己是空的。
  useEffect(() => {
    inputRef.current?.setAttribute('aria-expanded', asking ? 'false' : 'true')
  }, [asking])

  let body: ReactNode
  if (result.status === 'error' && !loading) {
    body = (
      <div role="alert" className="k-omnibox-note">
        {labels.error}
      </div>
    )
  } else {
    body = (
      <>
        {sections.map((section) => (
          <CommandGroup
            key={section.id || '\u0000'}
            heading={section.id === 'scope' && scope ? labels.scopeHeading?.(scope.label) : section.heading}
            data-slot={section.recent ? 'omnibox-recent' : 'omnibox-section'}
            data-section={section.id}
            className="relative"
          >
            {section.rows.map((row) =>
              row.type === 'more' ? (
                <CommandItem
                  key={row.key}
                  value={row.key}
                  onSelect={() => commit(row, false)}
                  data-slot="omnibox-more"
                  data-category={row.category}
                  className="k-omnibox-row k-omnibox-more"
                >
                  {labels.showAll?.(row.count, categories.find((entry) => entry.id === row.category)?.label ?? '') ??
                    String(row.count)}
                </CommandItem>
              ) : (
                <CommandItem
                  key={row.key}
                  value={row.key}
                  disabled={row.item.disabled}
                  onSelect={() => {
                    const newTab = clickNewTab.current
                    clickNewTab.current = false
                    commit(row, newTab)
                  }}
                  onClickCapture={(event) => {
                    clickNewTab.current = event.metaKey || event.ctrlKey
                  }}
                  data-slot="omnibox-row"
                  data-omnibox-id={row.item.id}
                  data-kind={row.item.kind ?? 'command'}
                  className="k-omnibox-row"
                >
                  {row.item.icon != null ? <span className="k-omnibox-icon">{row.item.icon}</span> : null}
                  <span className="k-omnibox-text">
                    <span className="k-omnibox-label">
                      <Highlight text={row.item.label} query={row.recent ? '' : settled} />
                    </span>
                    {row.item.description ? (
                      <span className="k-omnibox-desc">
                        <Highlight text={row.item.description} query={row.recent ? '' : settled} />
                      </span>
                    ) : null}
                  </span>
                  {row.item.meta != null ? <span className="k-omnibox-meta">{row.item.meta}</span> : null}
                  <Hint
                    text={rowHint(row.item, modifierHeld, {
                      run: labels.hintRun,
                      open: labels.hintOpen,
                      viewOptions: labels.hintViewOptions,
                      newTab: labels.hintNewTab,
                    })}
                  />
                </CommandItem>
              ),
            )}
            {section.recent && labels.clearRecent ? (
              // 「清除」是列表里最后一个真选项（读屏与键盘能到），用样式摆到「最近」标题的右端。
              <CommandItem
                value="clear-recent"
                onSelect={() => {
                  changeRecent([])
                  inputRef.current?.focus()
                }}
                data-slot="omnibox-clear-recent"
                className="k-omnibox-clear"
              >
                {labels.clearRecent}
              </CommandItem>
            ) : null}
          </CommandGroup>
        ))}
        {sections.length === 0 ? (
          loading ? (
            <div data-slot="omnibox-loading" className="k-omnibox-note">
              {labels.loading}
            </div>
          ) : (
            <CommandEmpty>
              {labels.empty}
              {askFallback ? (
                <span data-slot="omnibox-ask-instead" className="k-omnibox-ask-instead">
                  {labels.askInstead?.(settled.trim())}
                </span>
              ) : null}
            </CommandEmpty>
          )
        ) : null}
      </>
    )
  }

  const showTabs = scope === null && categories.length > 1
  const showAlt = asking && hasResults && labels.searchInstead !== undefined
  const describedBy = [scope ? scopeTagId : null, asking ? askId : null, showAlt ? altId : null]
    .filter(Boolean)
    .join(' ')
  const platformKeys = labels.footer
  return (
    <div ref={rootRef} data-slot="omnibox" data-asking={asking ? '' : undefined} className={cn('k-omnibox', className)}>
      <Command
        shouldFilter={false}
        loop
        label={labels.title}
        value={highlighted}
        onValueChange={setHighlighted}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => setModifierHeld(event.metaKey || event.ctrlKey)}
        onBlur={() => setModifierHeld(false)}
        className="k-omnibox-panel"
      >
        <div
          className="k-omnibox-bar"
          onPointerEnter={() => (pausedRef.current = true)}
          onPointerLeave={() => (pausedRef.current = false)}
        >
          <SearchIcon aria-hidden="true" className="k-omnibox-search-icon" />
          {scope ? (
            <span data-slot="omnibox-scope" className="k-omnibox-scope">
              {scope.icon != null ? <span className="k-omnibox-scope-icon">{scope.icon}</span> : null}
              <span id={scopeTagId} className="k-omnibox-scope-label">
                {scope.label}
              </span>
              <button
                type="button"
                aria-label={labels.removeScope?.(scope.label)}
                // 点 × 不让输入框丢焦点。
                onMouseDown={(event) => event.preventDefault()}
                // Enter、空格在 × 上是按这个按钮：不让它冒泡到根（cmdk 会 preventDefault 并去选高亮行，按钮的 click 就没有了）。
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
                }}
                onClick={() => changeScope(null)}
                className={cn('k-omnibox-scope-remove', focusRing)}
              >
                <XIcon aria-hidden="true" />
              </button>
            </span>
          ) : null}
          <div className="k-omnibox-field" data-example={example !== undefined ? '' : undefined}>
            <CommandPrimitive.Input
              ref={inputRef}
              value={query}
              onValueChange={onInputChange}
              onCompositionStart={() => {
                composingRef.current = true
                setComposing(true)
              }}
              onCompositionEnd={(event) => {
                composingRef.current = false
                setComposing(false)
                setSettled(event.currentTarget.value)
              }}
              placeholder={scope ? (labels.scopedPlaceholder ?? labels.placeholder) : labels.placeholder}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              aria-describedby={describedBy || undefined}
              data-slot="omnibox-input"
              className="k-omnibox-input"
            />
            {example !== undefined ? (
              <span key={example} aria-hidden="true" data-slot="omnibox-example" className="k-omnibox-example">
                {example}
              </span>
            ) : null}
          </div>
          {asking ? (
            <span data-slot="omnibox-ask" className="k-omnibox-ask">
              {showAlt ? (
                <button
                  type="button"
                  // ↓ 键做同一件事；按钮只给鼠标，不进 Tab 次序，点它不让输入框丢焦点。
                  tabIndex={-1}
                  data-slot="omnibox-search-instead"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setForcedFor(settled)}
                  className="k-omnibox-ask-alt"
                >
                  <span id={altId}>{labels.searchInstead}</span>
                  <kbd className="k-kbd" aria-hidden="true">
                    {'\u2193'}
                  </kbd>
                </button>
              ) : null}
              <span id={askId}>{labels.ask}</span>
              <kbd className="k-kbd" aria-hidden="true">
                {'↵'}
              </kbd>
            </span>
          ) : null}
        </div>
        <div className="k-omnibox-body" data-collapsed={asking ? '' : undefined}>
          <div className="k-omnibox-body-inner" inert={asking}>
            {showTabs ? (
              <div role="tablist" aria-label={labels.categories} className="k-omnibox-tabs" data-slot="omnibox-tabs">
                {categories.map((entry) => {
                  const count =
                    countItems === null ? null : entry.id === allId ? countItems.length : (counts[entry.id] ?? 0)
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="tab"
                      // Tab 键在输入框里轮转页签，按钮本身不进 Tab 次序；鼠标点也不抢输入框的焦点。
                      tabIndex={-1}
                      aria-selected={category === entry.id}
                      data-category={entry.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        changeCategory(entry.id)
                        inputRef.current?.focus()
                      }}
                      className="k-omnibox-tab"
                    >
                      {entry.label}
                      {count === null ? (
                        <span className="k-omnibox-tab-count" data-pending="" aria-hidden="true">
                          {'\u2026'}
                        </span>
                      ) : count > 0 ? (
                        <span className="k-omnibox-tab-count">{count}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
            <CommandList
              ref={listRef}
              aria-busy={loading || undefined}
              className="k-omnibox-list"
              data-slot="omnibox-list"
            >
              <div ref={highlightRef} aria-hidden="true" role="presentation" className="k-proximity-highlight" />
              {body}
            </CommandList>
            {platformKeys ? (
              <div className="k-omnibox-footer" data-slot="omnibox-footer" aria-hidden="true">
                <span className="k-omnibox-key">
                  {platformKeys.navigate}
                  <span className="k-keys">
                    <kbd className="k-kbd">{'↑'}</kbd>
                    <kbd className="k-kbd">{'↓'}</kbd>
                  </span>
                </span>
                <span className="k-omnibox-key">
                  {platformKeys.select}
                  <span className="k-keys">
                    <kbd className="k-kbd">{'↵'}</kbd>
                  </span>
                </span>
                <span className="k-omnibox-key">
                  {platformKeys.newTab}
                  <span className="k-keys">
                    <kbd className="k-kbd">{modLabel}</kbd>
                    <kbd className="k-kbd">{'↵'}</kbd>
                  </span>
                </span>
                <span className="k-omnibox-key k-omnibox-key-end">
                  {platformKeys.close}
                  <span className="k-keys">
                    <kbd className="k-kbd">Esc</kbd>
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Command>
      {shownPreview ? (
        <div
          aria-hidden="true"
          data-slot="omnibox-preview"
          data-side={shownPreview.side}
          className="k-omnibox-preview"
          style={{ translate: `0 ${shownPreview.top}px` }}
        >
          {shownPreview.node}
        </div>
      ) : null}
      <div role="status" className="sr-only">
        {announce}
      </div>
    </div>
  )
}

/** 行尾的回车提示：只在高亮行显示（样式按 data-selected），替掉行尾的 meta。 */
function Hint({ text }: { text: string | undefined }) {
  if (!text) return null
  return (
    <span data-slot="omnibox-hint" aria-hidden="true" className="k-omnibox-hint">
      {text}
      <CornerDownLeftIcon />
    </span>
  )
}

export type OmniboxDialogProps = OmniboxProps & {
  /** Whether the dialog is open. */
  open: boolean
  /** Called to open or close (Esc, click outside, after a choice or a question). */
  onOpenChange: (open: boolean) => void
  /** Keep the dialog open after a choice. Defaults to false. */
  keepOpen?: boolean
}

/**
 * 弹出的万能框：Dialog 的 bare 皮，顶部 12dvh、宽 min(640px, 100vw−24px)。选中命令、页面与提问后默认关上（keepOpen 留着）；对象变成标签时不关。
 * 每次打开重新挂载面板（作用域、查询、页签都从头来）。组字中按 Esc 不关（那是输入法在取消组字）。
 */
export function OmniboxDialog({ open, onOpenChange, keepOpen = false, onSelect, onAsk, ...props }: OmniboxDialogProps) {
  const descriptionId = useId()
  // 最近的记录放在对话框这一层：每次打开面板都重新挂载，放在面板里关一次就丢了。
  const [recentState, setRecentState] = useState<OmniboxItem[]>([])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        bare
        aria-describedby={descriptionId}
        // 组字中的 Esc 是输入法取消组字，不关对话框。
        onEscapeKeyDown={(event) => {
          if (event.isComposing || event.keyCode === 229) event.preventDefault()
        }}
        // Radix 默认聚焦第一个输入框时会全选里面的字：改成光标放到末尾，接着打。
        onOpenAutoFocus={(event) => {
          const input = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLInputElement>('[cmdk-input]')
          if (!input) return
          event.preventDefault()
          input.focus({ preventScroll: true })
          input.setSelectionRange(input.value.length, input.value.length)
        }}
        data-slot="omnibox-dialog"
        className="k-omnibox-dialog fixed top-[12dvh] left-1/2 w-[min(640px,calc(100vw-24px))] -translate-x-1/2"
      >
        <DialogTitle className="sr-only">{props.labels.title}</DialogTitle>
        <DialogDescription id={descriptionId} className="sr-only">
          {props.labels.placeholder ?? props.labels.title}
        </DialogDescription>
        <Omnibox
          {...props}
          recent={props.recent ?? recentState}
          onRecentChange={(next) => {
            if (props.recent === undefined) setRecentState(next)
            props.onRecentChange?.(next)
          }}
          onSelect={(item, info) => {
            onSelect(item, info)
            if (!keepOpen) onOpenChange(false)
          }}
          onAsk={
            onAsk
              ? (text, scope) => {
                  onAsk(text, scope)
                  if (!keepOpen) onOpenChange(false)
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  )
}
