// SPDX-License-Identifier: MIT
// 品种搜索（#77 第 1 条，#22「品种搜索」）：输入框 + 市场分段 + 结果列表；空查询时先列最近搜索。
// 功能参照 TradingView 图表的品种搜索（2026-11-18 在图上实测：打字即开、框里字转大写、分段 All / Stocks / Funds / Futures / Crypto / Indices…、
// 每行 logo + 代码（命中部分高亮）+ 名称与类型标签 + 右侧交易所、↑↓ 走行、回车开图、Esc 关；帮助中心 Symbol search tips，2026-11-15 读）。
// 只学「有哪些部分、键盘怎么走」，实现原创；样子照我们的 token：不用 TradingView 蓝，命中段只靠字重与亮度区分。
// 底座是 primitives/command（cmdk）：焦点一直在输入框，↑↓ 移高亮、回车选中、读屏的 combobox / listbox / option 都是它的。过滤关掉（shouldFilter={false}），
// 搜什么、怎么排由调用方的 onQuery 定（可以异步，换词时上一次的 AbortSignal 会 abort）；组件不带行情。
import { useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '../../lib/cn.ts'
import { focusRing } from '../../lib/focus.ts'
import { usePersistedState, type StorageLike } from '../../lib/use-persisted-state.ts'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../primitives/command.tsx'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../primitives/dialog.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { Tag } from '../../katana/tag.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import {
  isRecentList,
  pushRecent,
  recentInSegment,
  splitMatch,
  type SymbolSearchItem,
  type SymbolSearchSegment,
} from './symbol-search-model.ts'

/** Text shown by the search; the package ships no language. */
export type SymbolSearchLabels = {
  /** Accessible name of the search (and the dialog title, read by screen readers only). */
  title: string
  /** Input placeholder. */
  placeholder?: string
  /** Accessible name of the segment control. */
  segments?: string
  /** Heading of the recent-searches group. */
  recent?: string
  /** Heading of the results group (shown only when recent searches are listed too). */
  results?: string
  /** Shown when the query found nothing. */
  empty?: string
  /** Shown while onQuery is pending. */
  loading?: string
  /** Shown when onQuery threw or rejected. */
  error?: string
  /** Accessible name of the clear button; the button is drawn only when this is given. */
  clear?: string
  /** Announcement for screen readers after results settle (for example `n => \`${n} results\``). */
  resultCount?: (count: number) => string
}

export type SymbolSearchQuery = (
  query: string,
  segment: string,
  signal: AbortSignal,
) => readonly SymbolSearchItem[] | Promise<readonly SymbolSearchItem[]>

export type SymbolSearchProps = {
  /** Search: return matching items for the query and segment; may be async. The previous call's signal aborts when the query changes. */
  onQuery: SymbolSearchQuery
  /** Called when a row is chosen (Enter or click). */
  onSelect: (item: SymbolSearchItem) => void
  /** Market segments, in order; the first is the default. Omit for no segment control. */
  segments?: readonly SymbolSearchSegment[]
  /** Controlled segment id. */
  segment?: string
  /** Initial segment id when uncontrolled. */
  defaultSegment?: string
  /** Called when the segment changes. */
  onSegmentChange?: (segment: string) => void
  /** Initial text in the input (the character typed to open the search). */
  defaultQuery?: string
  /** Controlled recent searches, newest first. */
  recent?: readonly SymbolSearchItem[]
  /** Called with the new recent list after a selection. */
  onRecentChange?: (recent: SymbolSearchItem[]) => void
  /** Storage key to persist recent searches (uncontrolled); without it they live in memory only. */
  recentKey?: string
  /** Storage for recentKey; defaults to localStorage. */
  recentStorage?: StorageLike
  /** Most recent searches kept. Defaults to 8. */
  recentLimit?: number
  /** Segment id that means "every market" for filtering recent searches. Defaults to `all`. */
  allSegment?: string
  /** Delay before onQuery runs after typing, in ms. Defaults to 80. */
  debounceMs?: number
  /** Text. */
  labels: SymbolSearchLabels
  /** Extra class name on the root. */
  className?: string
}

const memoryStorage = (): StorageLike => {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

type Fetch = { status: 'idle' | 'done' | 'error'; items: readonly SymbolSearchItem[]; for: string }

/** 命中段：字重加亮度区分，不加底色、不用品牌色（品牌橙只给焦点角括号）。 */
function Highlight({ text, query, className }: { text: string; query: string; className?: string }) {
  const { before, hit, after } = splitMatch(text, query)
  return (
    <span className={className}>
      {before}
      {hit ? (
        <mark
          data-slot="symbol-search-hit"
          className="bg-transparent font-bold text-(color:--k-content-primary-foreground)"
        >
          {hit}
        </mark>
      ) : null}
      {after}
    </span>
  )
}

function SymbolRow({ item, query, onSelect }: { item: SymbolSearchItem; query: string; onSelect: () => void }) {
  return (
    <CommandItem
      value={item.id}
      onSelect={onSelect}
      data-slot="symbol-search-row"
      data-symbol={item.symbol}
      className="h-11 gap-2.5 rounded-[var(--radius-overlay)] px-2"
    >
      <SymbolMark symbol={item.symbol} name={item.name} src={item.logo} size="md" />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <Highlight
          text={item.symbol}
          query={query}
          className="k-text-data truncate font-medium text-(color:--k-content-body-foreground)"
        />
        {item.name || item.type ? (
          <span className="flex min-w-0 items-center gap-1.5">
            {item.name ? (
              <Highlight
                text={item.name}
                query={query}
                className="k-text-caption truncate text-(color:--k-content-secondary-foreground)"
              />
            ) : null}
            {item.type ? (
              <Tag size="sm" outlined className="shrink-0">
                {item.type}
              </Tag>
            ) : null}
          </span>
        ) : null}
      </span>
      {item.exchange ? (
        <span className="k-text-caption shrink-0 text-(color:--k-content-secondary-foreground)">{item.exchange}</span>
      ) : null}
    </CommandItem>
  )
}

/** 品种搜索面板：可以直接摆在页里，也可以经 SymbolSearchDialog 弹出。 */
export function SymbolSearch({
  onQuery,
  onSelect,
  segments,
  segment: segmentProp,
  defaultSegment,
  onSegmentChange,
  defaultQuery = '',
  recent: recentProp,
  onRecentChange,
  recentKey,
  recentStorage,
  recentLimit = 8,
  allSegment = 'all',
  debounceMs = 80,
  labels,
  className,
}: SymbolSearchProps) {
  const [query, setQuery] = useState(defaultQuery)
  const [segmentState, setSegmentState] = useState(defaultSegment ?? segments?.[0]?.id ?? allSegment)
  const segment = segmentProp ?? segmentState
  const fallbackStorage = useMemo(() => (recentKey ? recentStorage : memoryStorage()), [recentKey, recentStorage])
  const [storedRecent, setStoredRecent] = usePersistedState<SymbolSearchItem[]>(recentKey ?? 'k-symbol-search', [], {
    version: 1,
    storage: fallbackStorage,
    validate: isRecentList,
  })
  const recent = recentProp ?? storedRecent
  const [fetch, setFetch] = useState<Fetch>({ status: 'idle', items: [], for: '' })
  const inputRef = useRef<HTMLInputElement>(null)
  const runQuery = useEffectEvent((text: string, seg: string, signal: AbortSignal) => onQuery(text, seg, signal))

  // 换词或换分段：等 debounceMs 再问；上一次没回来的 abort 掉，回来晚了也不认。
  useEffect(() => {
    const controller = new AbortController()
    const key = `${segment}\u0000${query}`
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(() => runQuery(query, segment, controller.signal))
        .then(
          (items) => {
            if (!controller.signal.aborted) setFetch({ status: 'done', items, for: key })
          },
          () => {
            if (!controller.signal.aborted) setFetch({ status: 'error', items: [], for: key })
          },
        )
    }, debounceMs)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, segment, debounceMs])

  const choose = useCallback(
    (item: SymbolSearchItem) => {
      const next = pushRecent(recent, item, recentLimit)
      if (recentProp === undefined) setStoredRecent(next)
      onRecentChange?.(next)
      onSelect(item)
    },
    [recent, recentLimit, recentProp, setStoredRecent, onRecentChange, onSelect],
  )

  const changeSegment = (next: string) => {
    if (!next) return // 单选分段不许点成空
    if (segmentProp === undefined) setSegmentState(next)
    onSegmentChange?.(next)
    inputRef.current?.focus()
  }

  const trimmed = query.trim()
  const recentRows = trimmed ? [] : recentInSegment(recent, segment, allSegment)
  const recentIds = new Set(recentRows.map((item) => item.id))
  const resultRows = fetch.items.filter((item) => !recentIds.has(item.id))
  // 这次的词与分段还没回来就是加载中（由状态推出来，不在 effect 里另设）。
  const loading = fetch.for !== `${segment}\u0000${query}` || fetch.status === 'idle'

  // 读屏：结果稳定后报一次个数（停 400ms 再报，打字时不刷屏；modern-web-guidance accessibility §8）。
  const [announce, setAnnounce] = useState('')
  useEffect(() => {
    if (fetch.status !== 'done' || !labels.resultCount) return
    const timer = setTimeout(() => setAnnounce(labels.resultCount!(fetch.items.length)), 400)
    return () => clearTimeout(timer)
  }, [fetch, labels])

  let body: ReactNode
  if (fetch.status === 'error' && !loading) {
    body = (
      <div role="alert" className="k-text-data py-6 text-center text-(color:--k-content-secondary-foreground)">
        {labels.error}
      </div>
    )
  } else {
    body = (
      <>
        {recentRows.length ? (
          <CommandGroup heading={labels.recent} data-slot="symbol-search-recent">
            {recentRows.map((item) => (
              <SymbolRow key={item.id} item={item} query={query} onSelect={() => choose(item)} />
            ))}
          </CommandGroup>
        ) : null}
        {resultRows.length ? (
          <CommandGroup heading={recentRows.length ? labels.results : undefined} data-slot="symbol-search-results">
            {resultRows.map((item) => (
              <SymbolRow key={item.id} item={item} query={query} onSelect={() => choose(item)} />
            ))}
          </CommandGroup>
        ) : null}
        {loading && !resultRows.length && !recentRows.length ? (
          <div
            data-slot="symbol-search-loading"
            className="k-text-data py-6 text-center text-(color:--k-content-secondary-foreground)"
          >
            {labels.loading}
          </div>
        ) : (
          <CommandEmpty>{labels.empty}</CommandEmpty>
        )}
      </>
    )
  }

  return (
    <Command
      shouldFilter={false}
      loop
      label={labels.title}
      data-slot="symbol-search"
      className={cn('bg-(--k-surface-raised-background)', className)}
    >
      <div className="relative">
        <CommandInput
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={labels.placeholder}
          spellCheck={false}
          autoComplete="off"
          // 照 TradingView：框里显示成大写（代码都是大写）；传给 onQuery 的是原样。
          className="k-text-data border-0 p-0 pr-8 uppercase placeholder:normal-case"
        />
        {query && labels.clear ? (
          <button
            type="button"
            aria-label={labels.clear}
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className={cn(
              'absolute top-1/2 right-2 inline-flex size-6 cursor-pointer border-0 bg-transparent p-0 -translate-y-1/2 items-center justify-center rounded-full text-(color:--k-content-secondary-foreground) hover:text-(color:--k-content-primary-foreground)',
              focusRing,
            )}
          >
            <XIcon className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {segments?.length ? (
        <div className="flex shrink-0 overflow-x-auto px-3 py-2">
          <ToggleGroup
            size="sm"
            value={segment}
            onValueChange={changeSegment}
            aria-label={labels.segments}
            data-slot="symbol-search-segments"
          >
            {segments.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="h-6 px-2.5">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
      <CommandList aria-busy={loading || undefined} className="max-h-[min(420px,60dvh)] overscroll-contain">
        {body}
      </CommandList>
      <div role="status" className="sr-only">
        {announce}
      </div>
    </Command>
  )
}

export type SymbolSearchDialogProps = SymbolSearchProps & {
  /** Whether the dialog is open. */
  open: boolean
  /** Called to open or close (Esc, click outside, after a selection). */
  onOpenChange: (open: boolean) => void
  /** Keep the dialog open after a selection. Defaults to false. */
  keepOpen?: boolean
}

/**
 * 弹出的品种搜索：Dialog 的 bare 皮（包里自带整套外观的浮层都走它，见 primitives/dialog.tsx）。
 * 每次打开都重新挂载面板，defaultQuery 就是这次打开时带进来的字（useTypeToSearch 给的）。
 */
export function SymbolSearchDialog({
  open,
  onOpenChange,
  keepOpen = false,
  onSelect,
  ...props
}: SymbolSearchDialogProps) {
  const descriptionId = useId()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        bare
        aria-describedby={descriptionId}
        // Radix 默认聚焦第一个输入框时会全选里面的字：打开时带进来的字会被下一个键盖掉。改成光标放到末尾，接着打（照 TradingView）。
        onOpenAutoFocus={(event) => {
          const input = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLInputElement>('[cmdk-input]')
          if (!input) return
          event.preventDefault()
          input.focus({ preventScroll: true })
          input.setSelectionRange(input.value.length, input.value.length)
        }}
        data-slot="symbol-search-dialog"
        className={cn(
          'fixed top-[12dvh] left-1/2 flex max-h-[76dvh] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden overscroll-contain',
          'rounded-[var(--radius-dialog)] border border-(color:--k-overlay-dialog-borderColor) bg-(--k-surface-raised-background) shadow-(--k-overlay-dialog-shadow)',
        )}
      >
        <DialogTitle className="sr-only">{props.labels.title}</DialogTitle>
        <DialogDescription id={descriptionId} className="sr-only">
          {props.labels.placeholder ?? props.labels.title}
        </DialogDescription>
        <SymbolSearch
          {...props}
          onSelect={(item) => {
            onSelect(item)
            if (!keepOpen) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
