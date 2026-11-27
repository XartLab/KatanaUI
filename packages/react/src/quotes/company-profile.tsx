// SPDX-License-Identifier: MIT
// 公司简介卡（CompanyProfile）：公司名，下面几项事实（行业、细分行业、员工数、总部、网站…，标签与值都由调用方写），再下面是简介正文，过长时折成几行、可展开。
// 功能参照 TradingView 小组件 Company Profile（tradingview.com/widget-docs/widgets/symbol-details/company-profile，2026-11-23 读：页面写「公司简介加几个关键类别：sector 与 industry」，
// 别的栏、正文折不折叠没写，待核对）。只取功能，不嵌、不抄代码与样式值。
// 没有数据（没给事实也没给正文）就画空态，文字由调用方传（未连接 / 未实装）；包里不带语言、不带数据源。
// 折叠用 CSS 的 line-clamp；要不要出「展开」按钮靠量：正文被截断（scrollHeight 大于可见高）才出，宽度变了重量。
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

export type CompanyProfileFact = {
  /** Stable id of the fact (sector, industry, employees). */
  id: string
  /** Small grey label ("Sector"), written by the caller. */
  label: string
  /** The value, already written by the caller; an em dash is drawn when omitted. */
  value?: ReactNode
}

export type CompanyProfileLabels = {
  /** Text of the button that expands a clamped description ("Show more"). */
  more: string
  /** Text of the button that collapses it again ("Show less"). */
  less: string
  /** Text of the empty state when there are no facts and no description. */
  empty: string
}

export type CompanyProfileProps = {
  /** Company name; the heading and the accessible name of the card. */
  name: string
  /** Facts under the name, in reading order (sector and industry first, as in TradingView). */
  facts?: readonly CompanyProfileFact[]
  /** Plain-text company description. */
  description?: string
  /**
   * Lines of the description shown before it is expanded; 4 by default.
   * 正文折叠时显示几行，默认 4（卡片在侧栏里约占一屏的三分之一，视觉取值，待定）。
   */
  collapsedLines?: number
  /** Expanded at first render (uncontrolled). */
  defaultExpanded?: boolean
  /** Small line at the bottom (source, as-of date), written by the caller. */
  source?: ReactNode
  /** Button and empty-state texts, written by the caller (required). */
  labels: CompanyProfileLabels
  /** Extra class name on the root. */
  className?: string
}

export function CompanyProfile({
  name,
  facts = [],
  description,
  collapsedLines = 4,
  defaultExpanded = false,
  source,
  labels,
  className,
}: CompanyProfileProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [clamped, setClamped] = useState(false)
  const body = useRef<HTMLParagraphElement>(null)
  const bodyId = useId()
  // 量正文有没有被截断：只在折叠时量（展开时 scrollHeight 等于可见高，量了会把按钮弄没）；宽度变了重量。
  useLayoutEffect(() => {
    const element = body.current
    if (!element || expanded) return
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1)
    measure()
    const size = new ResizeObserver(measure)
    size.observe(element)
    return () => size.disconnect()
  }, [description, expanded, collapsedLines])

  const empty = facts.length === 0 && !description
  return (
    <section className={cn('k-mat-card k-profile', className)} data-slot="company-profile" aria-label={name}>
      <h3 className="k-profile-name">{name}</h3>
      {empty ? (
        <p className="k-profile-empty" data-slot="company-profile-empty">
          {labels.empty}
        </p>
      ) : (
        <>
          {facts.length > 0 && (
            <dl className="k-profile-facts">
              {facts.map((fact) => (
                <div key={fact.id} className="k-profile-fact" data-slot="company-profile-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          )}
          {description && (
            <div className="k-profile-about">
              <p
                ref={body}
                id={bodyId}
                className="k-profile-text"
                data-slot="company-profile-text"
                data-expanded={expanded}
                style={expanded ? undefined : { WebkitLineClamp: collapsedLines }}
              >
                {description}
              </p>
              {(clamped || expanded) && (
                <button
                  type="button"
                  className="k-profile-toggle"
                  aria-expanded={expanded}
                  aria-controls={bodyId}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? labels.less : labels.more}
                </button>
              )}
            </div>
          )}
        </>
      )}
      {source && <p className="k-profile-source">{source}</p>}
    </section>
  )
}
