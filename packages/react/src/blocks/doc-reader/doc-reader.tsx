// SPDX-License-Identifier: MIT
/**
 * Long-document reader: an outline from the headings, in-document search with match count and next / previous, and a cite button on every block.
 * 文档阅读器（KATANAview #2395「公告与文件阅读」）：左边目录（标题块抽出来，点了滚到那一节），上边搜索（命中数、上一个 / 下一个、命中字高亮），
 * 正文一块一块排，悬停或聚焦一块右侧出「引用」，点了把这一块交给宿主（宿主拼 kref: 给智能体或对话用；件不认识 kref）。activeId 给了就滚到那一块并标出来（从引用点回来时用）。
 * 件不取数、不解析 PDF：宿主把原文抽成块（标题 / 段落）交进来。功能参照 PDF 阅读器的目录与查找（Acrobat、pdf.js viewer 的 outline / find bar，只取功能），实现原创。
 * 文字全由 props 传。块多（几千段）时只靠浏览器自己的 content-visibility 省排版（theme/doc-reader.css），不做虚拟滚动：查找与锚点要求全部块都在 DOM 里。
 */
import { ChevronDown, ChevronUp, Quote, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { docMatches, docOutline, splitHits, type DocBlock } from './doc-reader-model.ts'

export type { DocBlock, DocOutlineItem } from './doc-reader-model.ts'

export type DocReaderLabels = {
  /** 整个阅读器的读屏名。 */
  reader: string
  outline: string
  search: string
  /** 命中计数（「3 / 12」）。 */
  matches: (current: number, total: number) => string
  noMatch: string
  previous: string
  next: string
  /** 引用钮的读屏名与提示（「引用这一段」）。 */
  cite: string
  empty: string
}

export type DocReaderProps = {
  title: string
  /** 标题下一行（「2026-04-28 · 年度报告 · 128 页」），调用方写好。 */
  meta?: string
  blocks: readonly DocBlock[]
  labels: DocReaderLabels
  /** 滚到这一块并标出来。 */
  activeId?: string
  /** 点了「引用」：拿到这一块。不给就不画引用钮。 */
  onCite?: (block: DocBlock) => void
  /** 不画目录（窄格子里）。 */
  hideOutline?: boolean
  source?: string
  height?: number
  className?: string
}

export function DocReader({
  title,
  meta,
  blocks,
  labels,
  activeId,
  onCite,
  hideOutline = false,
  source,
  height = 560,
  className,
}: DocReaderProps) {
  const [query, setQuery] = useState('')
  const [hitIndex, setHitIndex] = useState(0)
  const body = useRef<HTMLDivElement>(null)
  const searchId = useId()
  const outline = docOutline(blocks)
  const hits = docMatches(blocks, query)
  const current = hits.length === 0 ? null : hits[Math.min(hitIndex, hits.length - 1)]!

  const scrollTo = (id: string) => {
    body.current?.querySelector<HTMLElement>(`[data-block="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'start' })
  }
  useEffect(() => {
    if (activeId) scrollTo(activeId)
  }, [activeId])
  useEffect(() => {
    if (current)
      body.current
        ?.querySelector<HTMLElement>(`[data-block="${CSS.escape(current)}"]`)
        ?.scrollIntoView({ block: 'center' })
  }, [current])

  const step = (delta: number) => {
    if (hits.length === 0) return
    setHitIndex((index) => (Math.min(index, hits.length - 1) + delta + hits.length) % hits.length)
  }
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      step(event.shiftKey ? -1 : 1)
    } else if (event.key === 'Escape') setQuery('')
  }

  return (
    <section
      className={cn('k-doc', hideOutline && 'is-flat', className)}
      data-slot="doc-reader"
      aria-label={labels.reader}
      style={{ height }}
    >
      <header className="k-doc-head">
        <div className="k-doc-titles">
          <h3 className="k-doc-title">{title}</h3>
          {meta && <p className="k-doc-meta">{meta}</p>}
        </div>
        <div className="k-doc-find" role="search">
          <Search size={12} aria-hidden="true" />
          <label htmlFor={searchId} className="k-doc-sr">
            {labels.search}
          </label>
          <input
            id={searchId}
            type="search"
            className="k-doc-input"
            data-slot="doc-reader-search"
            placeholder={labels.search}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setHitIndex(0)
            }}
            onKeyDown={onSearchKey}
          />
          {query.trim() !== '' && (
            <span className="k-doc-count" data-slot="doc-reader-count" aria-live="polite">
              {hits.length === 0
                ? labels.noMatch
                : labels.matches(Math.min(hitIndex, hits.length - 1) + 1, hits.length)}
            </span>
          )}
          <button
            type="button"
            className="k-doc-step"
            aria-label={labels.previous}
            disabled={hits.length === 0}
            onClick={() => step(-1)}
          >
            <ChevronUp size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="k-doc-step"
            aria-label={labels.next}
            disabled={hits.length === 0}
            onClick={() => step(1)}
          >
            <ChevronDown size={12} aria-hidden="true" />
          </button>
        </div>
      </header>
      {blocks.length === 0 ? (
        <p className="k-doc-empty" role="status" data-slot="doc-reader-empty">
          {labels.empty}
        </p>
      ) : (
        <div className="k-doc-main">
          {!hideOutline && outline.length > 0 && (
            <nav className="k-doc-outline" aria-label={labels.outline} data-slot="doc-reader-outline">
              <ol>
                {outline.map((item) => (
                  <li key={item.id} style={{ paddingInlineStart: (item.level - 1) * 12 }}>
                    <button type="button" className="k-doc-toc" onClick={() => scrollTo(item.id)}>
                      {item.text}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="k-doc-body" ref={body} tabIndex={0} data-slot="doc-reader-body">
            {blocks.map((block) => {
              const parts = splitHits(block.text, query)
              const content = parts.map((part, index) =>
                part.hit ? (
                  <mark key={index} className="k-doc-hit">
                    {part.text}
                  </mark>
                ) : (
                  part.text
                ),
              )
              const Tag =
                block.kind === 'heading' ? (`h${Math.min(6, Math.max(4, (block.level ?? 1) + 3))}` as 'h4') : 'p'
              return (
                <div
                  key={block.id}
                  className="k-doc-block"
                  data-block={block.id}
                  data-kind={block.kind}
                  data-active={block.id === activeId ? 'true' : undefined}
                  data-current={block.id === current ? 'true' : undefined}
                >
                  <Tag className={block.kind === 'heading' ? 'k-doc-h' : 'k-doc-p'}>{content}</Tag>
                  {onCite && block.kind === 'paragraph' && (
                    <button
                      type="button"
                      className="k-doc-cite"
                      data-slot="doc-reader-cite"
                      aria-label={labels.cite}
                      title={labels.cite}
                      onClick={() => onCite(block)}
                    >
                      <Quote size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {source && <p className="k-doc-source">{source}</p>}
    </section>
  )
}
