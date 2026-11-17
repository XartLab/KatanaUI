// SPDX-License-Identifier: MIT
import { CopyIcon, FlagIcon, XIcon, ZapIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Skeleton } from '../../katana/skeleton.tsx'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { Button } from '../../primitives/button.tsx'
import { formatPercentChange } from '../../quant/format/index.ts'

// 新闻阅读窗（NewsFeed 点开一条后右侧的窗，主会话 2026-11-15 实测 tradingview.com/news-flow/）：来源徽标、标题、「时间 · 来源 · 2 min read」、品种胶囊带涨跌（SPCX −0.59%）、
// 「KEY POINTS」要点列表（闪电图标）、正文（正文里的品种胶囊由调用方在 body 里用 NewsSymbolChip 放）；右上关闭、举报、复制链接。
// 件不取数：标题、元信息文字、要点、正文都由调用方传；涨跌色走 pnl token（跟 data-updown 互换）。

export type NewsReaderSymbol = {
  code: string
  name?: string
  logo?: string
  /** 涨跌幅百分数（-0.59）；不给不画。 */ change?: number
}

export type NewsReaderLabels = {
  reader: string
  keyPoints: string
  close: string
  report: string
  copyLink: string
  /** 正文加载时读屏读的话；不给就读 reader。 */
  loading?: string
}

export type NewsReaderProps = {
  title: string
  /** 来源名与徽标。 */
  source: string
  sourceLogo?: string
  /** 已写好的元信息（「7 分钟前 · 路透 · 2 分钟阅读」）。 */
  meta: string
  symbols?: readonly NewsReaderSymbol[]
  keyPoints?: readonly string[]
  /** 正文。 */
  children: ReactNode
  /** 正文在加载：给了（含 false）正文就走量出来的骨架，false 时骨架退场、children 淡入；不传和以前一样。 */
  loading?: boolean
  /** 加载时拿来量骨架的示例正文（段数、有没有图跟真的差不多就行）；不给画几行条。 */
  sample?: ReactNode
  labels: NewsReaderLabels
  onClose?: () => void
  onReport?: () => void
  onCopyLink?: () => void
  onSymbolPick?: (symbol: NewsReaderSymbol) => void
  className?: string
}

/** 品种胶囊：徽标 + 代码 + 可选涨跌幅；阅读窗的头部与正文里都用它。 */
export function NewsSymbolChip({
  symbol,
  onPick,
}: {
  symbol: NewsReaderSymbol
  onPick?: (symbol: NewsReaderSymbol) => void
}) {
  const tone = symbol.change === undefined || symbol.change === 0 ? undefined : symbol.change > 0 ? 'up' : 'down'
  return (
    <button type="button" className="k-news-chip" data-symbol={symbol.code} onClick={() => onPick?.(symbol)}>
      <SymbolMark code={symbol.code} name={symbol.name} src={symbol.logo} size={14} />
      <span>{symbol.code}</span>
      {symbol.change !== undefined && (
        <span className="k-news-chip-change" data-tone={tone}>
          {formatPercentChange(symbol.change)}
        </span>
      )}
    </button>
  )
}

export function NewsReader({
  title,
  source,
  sourceLogo,
  meta,
  symbols = [],
  keyPoints = [],
  children,
  loading,
  sample,
  labels,
  onClose,
  onReport,
  onCopyLink,
  onSymbolPick,
  className,
}: NewsReaderProps) {
  return (
    <article className={cn('k-news-reader', className)} aria-label={labels.reader} data-slot="news-reader">
      <header className="k-news-reader-head">
        <span className="k-news-reader-source">
          <SymbolMark code={source} name={source} src={sourceLogo} size={20} />
          <span>{source}</span>
        </span>
        <span className="k-news-reader-actions">
          {onCopyLink && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={labels.copyLink}
              title={labels.copyLink}
              onClick={onCopyLink}
            >
              <CopyIcon aria-hidden="true" />
            </Button>
          )}
          {onReport && (
            <Button size="icon" variant="ghost" aria-label={labels.report} title={labels.report} onClick={onReport}>
              <FlagIcon aria-hidden="true" />
            </Button>
          )}
          {onClose && (
            <Button size="icon" variant="ghost" aria-label={labels.close} title={labels.close} onClick={onClose}>
              <XIcon aria-hidden="true" />
            </Button>
          )}
        </span>
      </header>
      <h2 className="k-news-reader-title">{title}</h2>
      <p className="k-news-reader-meta">{meta}</p>
      {symbols.length > 0 && (
        <div className="k-news-reader-symbols">
          {symbols.map((s) => (
            <NewsSymbolChip key={s.code} symbol={s} onPick={onSymbolPick} />
          ))}
        </div>
      )}
      {keyPoints.length > 0 && (
        <section className="k-news-reader-points" aria-label={labels.keyPoints}>
          <h3>{labels.keyPoints}</h3>
          <ul>
            {keyPoints.map((point) => (
              <li key={point}>
                <ZapIcon size={13} aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="k-news-reader-body">
        {loading === undefined ? (
          children
        ) : loading && sample === undefined ? (
          <Skeleton label={labels.loading ?? labels.reader} lines={6} />
        ) : (
          <MeasuredSkeleton loading={loading} label={labels.loading ?? labels.reader} sample={sample}>
            {children}
          </MeasuredSkeleton>
        )}
      </div>
    </article>
  )
}
