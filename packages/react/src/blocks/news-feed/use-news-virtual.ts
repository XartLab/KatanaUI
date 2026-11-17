// SPDX-License-Identifier: MIT
/**
 * Virtual list of the NewsFeed list layout, with computed row heights and scroll anchoring.
 * NewsFeed 列表排法的虚拟化（体检 §7 从 news-feed.tsx 拆出）：行高按文字折行算（news-feed-rows.ts），不靠渲染后再量；
 * 行是绝对定位，浏览器的滚动锚定管不到，新行插在上面时这里补偿 scrollTop。
 */
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DependencyList, type RefObject } from 'react'
import { onTextMeasureReset } from '../../lib/text-measure.ts'
import type { NewsItem } from './news-feed-model.ts'
import { listRowHeight, readRowFonts, type RowFonts, type RowInput } from './news-feed-rows.ts'

type Options = {
  scroller: RefObject<HTMLDivElement | null>
  /** 虚拟化开着（列表排法且条目多于阈值）。 */
  virtual: boolean
  /** 现在画的条目（排好序、筛好的）。 */
  visible: readonly NewsItem[]
  /** 已放进列表的 id；它变了才做滚动锚定（筛选条件变了不跟）。 */
  shown: ReadonlySet<string>
  /** 阅读窗开着的那条：滚出去也留着（键盘焦点在它的标题按钮上）。 */
  selectedId: string | null
  /** 一条的行高输入（标题、来源、时间字…）。 */
  rowOf: (item: NewsItem) => RowInput
  /** rowOf 读到的外部值（文案、当前时间、来源表…）：变了才重算行高。 */
  deps: DependencyList
}

export function useNewsVirtual({ scroller, virtual, visible, shown, selectedId, rowOf, deps }: Options) {
  // 滚动区宽度与字体（字号、行高、具名字体）：行高只依赖它们；宽度变了只重算高度，prepare 在 text-measure 里按「字体+文本」缓存。
  const [width, setWidth] = useState(0)
  const [fonts, setFonts] = useState<RowFonts | null>(null)
  const [epoch, setEpoch] = useState(0)
  // 字体缓存被清（Web 字体加载完、换渲染字体、DPR 变）后行高要重算。
  useEffect(() => onTextMeasureReset(() => setEpoch((n) => n + 1)), [])
  useLayoutEffect(() => {
    const el = scroller.current
    if (!virtual || !el) return
    setFonts(readRowFonts(el))
    setWidth(el.clientWidth)
    // 用 clientWidth（不含滚动条）而不是 contentRect：行宽就是它。
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [virtual, epoch, scroller])

  const sizes = useMemo(
    () => (!virtual || !fonts ? [] : visible.map((item) => listRowHeight(rowOf(item), fonts, width))),
    // oxlint-disable-next-line react/exhaustive-deps -- rowOf 每次是新函数，它读的值经 deps 传进来
    [virtual, fonts, width, visible, epoch, ...deps],
  )

  const selectedIndex = virtual && selectedId !== null ? visible.findIndex((i) => i.id === selectedId) : -1
  // 返回的函数不能被 React Compiler 记忆化，只在 NewsFeed 里用。
  const virtualizer = useVirtualizer({
    count: virtual ? visible.length : 0,
    getScrollElement: () => scroller.current,
    estimateSize: (index) => sizes[index] ?? 32,
    overscan: 8,
    initialRect: { width: 0, height: 600 },
    getItemKey: (index) => visible[index]?.id ?? index,
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range)
      return selectedIndex >= 0 && !indexes.includes(selectedIndex)
        ? [...indexes, selectedIndex].toSorted((a, b) => a - b)
        : indexes
    },
  })
  // estimateSize 不是 virtualizer 缓存的依赖，高度变了要显式 measure()；内容没变就不动，免得 labels 每次新对象造成循环。
  const lastSizes = useRef<number[]>([])
  useLayoutEffect(() => {
    const last = lastSizes.current
    if (last.length === sizes.length && last.every((size, i) => size === sizes[i])) return
    lastSizes.current = sizes
    virtualizer.measure()
  }, [sizes, virtualizer])
  // 滚动锚定：记下首个可见行的位置，放进新行后把 scrollTop 补回去。
  // 只在 scrollTop > 0 且是放进新条目（shown 变了）时补：在最顶上（0）就是要看见最新的，筛选条件变了也不跟。
  const starts = useMemo(() => {
    let total = 0
    return sizes.map((size) => {
      const start = total
      total += size
      return start
    })
  }, [sizes])
  const anchor = useRef<{ id: string; start: number } | null>(null)
  const anchoredShown = useRef(shown)
  useLayoutEffect(() => {
    const el = scroller.current
    const ready = virtual && el && starts.length === visible.length
    if (ready) {
      const previous = anchor.current
      if (previous && anchoredShown.current !== shown && el.scrollTop > 0) {
        const index = visible.findIndex((i) => i.id === previous.id)
        if (index >= 0 && starts[index] !== previous.start) el.scrollTop += starts[index]! - previous.start
      }
      const top = el.scrollTop
      const first = starts.findIndex((start, i) => start + sizes[i]! > top)
      anchor.current = first >= 0 ? { id: visible[first]!.id, start: starts[first]! } : null
    } else anchor.current = null
    anchoredShown.current = shown
  })

  return { virtualizer, sizes }
}
