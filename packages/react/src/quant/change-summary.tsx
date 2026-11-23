// SPDX-License-Identifier: MIT
/**
 * Change summary: what changed since last time, one metric per row with a change text and a good / bad / neutral tone.
 * 变化摘要（KATANAview #1908 第一批）：周报、日报、看板顶上的一块「这段时间变了什么」：一个灰底托盘，头一行图标、标题、区间；
 * 下面每个指标一行：名字、变化的文字（调用方写好，如「1.12 → 1.38」「+2.4 个百分点」）、方向箭头。好坏色只给变化那一格。
 * 「好坏」与「涨跌」分开：回撤变大是 bad，箭头朝上；颜色走状态 token（ok / danger），不用涨跌色。
 * 功能参照 affectUI 的 Change Summary（affectui.com/components/change-summary，2026-11-23 读；页上标 MIT，这里也只学功能，代码原创）。
 * 用 dl：读屏把每个变化跟它的指标名一起读；箭头是装饰，意思在文字里。包里不带语言。
 */
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

/** One row of ChangeSummary. */
export type ChangeItem = {
  /** Stable key. */
  id: string
  /** Metric name. */
  label: string
  /** The change as text, written by the caller (「1.12 → 1.38」). */
  change: string
  /** Whether the change is good, bad or neither; this picks the color, not the arrow. */
  tone: 'good' | 'bad' | 'neutral'
  /** Arrow direction of the value; omit for a flat arrow. */
  direction?: 'up' | 'down'
}

export type ChangeSummaryProps = {
  /** Rows, at most about six. */
  changes: readonly ChangeItem[]
  /** Heading. */
  title: ReactNode
  /** Small period text on the right of the heading (「11-16 → 11-22」). */
  period?: ReactNode
  /** Icon in front of the heading; omit for none. */
  icon?: ReactNode
  /** Text when there are no changes. */
  empty?: string
  /** Extra class name on the root. */
  className?: string
}

export function ChangeSummary({ changes, title, period, icon, empty, className }: ChangeSummaryProps) {
  return (
    <section className={cn('k-chs', className)} data-slot="change-summary">
      <header className="k-chs-head">
        {icon !== undefined && (
          <span className="k-chs-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <h4 className="k-chs-title">{title}</h4>
        {period !== undefined && <span className="k-chs-period">{period}</span>}
      </header>
      {changes.length === 0 ? (
        empty === undefined ? null : (
          <p className="k-chs-empty">{empty}</p>
        )
      ) : (
        <dl className="k-chs-list">
          {changes.map((item) => {
            const Arrow =
              item.direction === 'up' ? ArrowUpIcon : item.direction === 'down' ? ArrowDownIcon : ArrowRightIcon
            return (
              <div key={item.id} className="k-chs-row" data-slot="change-item" data-tone={item.tone}>
                <dt>{item.label}</dt>
                <dd>
                  {item.change}
                  <Arrow aria-hidden="true" />
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </section>
  )
}
