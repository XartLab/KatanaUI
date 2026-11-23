// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { normalizeStreak, type StreakValue } from './badge-model.ts'
import { cnLabelsZh, type ThemeCardLabels } from './labels.ts'
import { StreakBadge } from './streak-badge.tsx'
import { parseClock, formatClock } from './session.ts'
import { DASH } from './value.ts'

// 题材卡（#110，信息结构取自复盘吧看盘工作台的题材异动，样子是 Graphite 的）：卡头是序号、题材名与两枚小胶囊（几只涨停、最高几板），
// 一行催化（省略号截断，悬停看全文与来源），成员表（涨停时间、名称、连板徽标），卡脚「查看 n 只涨停」。多张卡用 ThemeCards 横排；排序由调用方排。
// 不带文案语言：字走 labels（默认简体中文）。取不到写「—」。不画样本数据。

export type ThemeMember = {
  code: string
  name: string
  /** 涨停（首次封板）时刻，「09:36」；取不到写 —。 */
  time?: string | null
  streak?: number | StreakValue | null
}

export type ThemeCatalyst = { text: string; source?: string }

export type ThemeCardData = {
  /** Stable key of the theme. */
  key: string
  /** Theme name. */
  name: string
  /**
   * Number of limit-up stocks; counted from the members when omitted, null writes a dash.
   * 涨停家数；不给就数成员；null 写「—」。
   */
  limitUpCount?: number | null
  /**
   * Highest board; taken from the members when omitted, and nothing is drawn below two boards.
   * 最高几板；不给就取成员里的最高板；两板以下不画胶囊。
   */
  highestBoard?: number | null
  /**
   * The catalyst line with its source; null or empty writes a dash.
   * 催化：一句话与来源；null 或空写「—」。
   */
  catalyst?: ThemeCatalyst | null
  /**
   * Why the catalyst is unavailable (shown on hover).
   * 催化取不到的原因（悬停）。
   */
  catalystReason?: string
  /** Member stocks in display order. */
  members: readonly ThemeMember[]
}

export type ThemeCardProps = {
  /**
   * The theme to show: name, counts, catalyst and members.
   * 这张卡的题材：名称、家数、催化与成员。
   */
  theme: ThemeCardData
  /**
   * Position number shown before the name (written 01, 02…); omit for none.
   * 序号（写成 01、02…）；不给就不画。
   */
  index?: number
  /**
   * Called by the footer button with the theme key; without it the footer is plain text.
   * 卡脚按钮的回调（题材 key）；不给卡脚就是普通文字。
   */
  onOpen?: (key: string) => void
  /**
   * Called when a member row is picked; without it the rows are plain.
   * 点成员行的回调；不给成员行就是普通行。
   */
  onSelectMember?: (member: ThemeMember, theme: ThemeCardData) => void
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: ThemeCardLabels
  /** Extra class names. */
  className?: string
}

const clockText = (time: string | null | undefined) => {
  const minutes = parseClock(time ?? undefined)
  return minutes === null ? DASH : formatClock(minutes)
}

/** 题材卡里的数：涨停家数（不给就数成员）与最高板（不给就取成员里最高的，两板以下返回 null 不画胶囊）。纯函数。 */
export function themeCardFigures(theme: ThemeCardData): { count: number | null; highest: number | null } {
  const count = theme.limitUpCount === undefined ? theme.members.length : theme.limitUpCount
  const boards = theme.members.map((member) => normalizeStreak(member.streak).boards ?? 0)
  const raw = theme.highestBoard === undefined ? Math.max(0, ...boards) : theme.highestBoard
  return { count, highest: raw !== null && raw >= 2 ? raw : null }
}

export function ThemeCard({
  theme,
  index,
  onOpen,
  onSelectMember,
  labels = cnLabelsZh.themeCard,
  className,
}: ThemeCardProps) {
  const { count, highest } = themeCardFigures(theme)
  const catalyst = theme.catalyst && theme.catalyst.text.trim() !== '' ? theme.catalyst : null
  return (
    <section
      className={cn('k-theme-card', className)}
      data-slot="theme-card"
      data-key={theme.key}
      aria-label={labels.card(theme.name)}
    >
      <header className="k-theme-head">
        {index !== undefined && <span className="k-theme-index">{String(index).padStart(2, '0')}</span>}
        <h3 className="k-theme-name">{theme.name}</h3>
        <span className="k-cn-chip" data-tone="up" data-slot="theme-count">
          {count === null ? DASH : labels.limitUpCount(count)}
        </span>
        {highest !== null && (
          <span className="k-cn-chip" data-tone="up" data-slot="theme-board">
            {labels.highestBoard(highest)}
          </span>
        )}
      </header>
      <p
        className="k-theme-catalyst"
        data-slot="theme-catalyst"
        data-unavailable={catalyst === null ? 'true' : undefined}
        tabIndex={0}
        title={
          catalyst === null
            ? (theme.catalystReason ?? labels.noCatalyst)
            : catalyst.source
              ? `${catalyst.text}\n${labels.catalystSource(catalyst.source)}`
              : catalyst.text
        }
      >
        {catalyst === null ? DASH : catalyst.text}
      </p>
      {theme.members.length === 0 ? (
        <p className="k-theme-empty">{labels.noMembers}</p>
      ) : (
        <ul className="k-theme-members">
          {theme.members.map((member) => {
            const body = (
              <>
                <span className="k-theme-time">{clockText(member.time)}</span>
                <span className="k-theme-member-name">{member.name}</span>
                <StreakBadge streak={member.streak} />
              </>
            )
            return (
              <li key={member.code} data-slot="theme-member" data-code={member.code}>
                {onSelectMember ? (
                  <button type="button" className="k-theme-row" onClick={() => onSelectMember(member, theme)}>
                    {body}
                  </button>
                ) : (
                  <div className="k-theme-row">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <footer className="k-theme-foot">
        {(() => {
          const text = count === null ? DASH : labels.viewAll(count)
          return onOpen ? (
            <button type="button" className="k-theme-open" data-slot="theme-open" onClick={() => onOpen(theme.key)}>
              <span>{text}</span>
              <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <span className="k-theme-open" data-slot="theme-open">
              {text}
            </span>
          )
        })()}
      </footer>
    </section>
  )
}

export type ThemeCardsProps = {
  /**
   * The themes in display order; the caller sorts (by limit-up count, time, boards or change).
   * 题材，按显示次序；排序由调用方排（涨停家数、时间、连板、涨幅）。
   */
  themes: readonly ThemeCardData[]
  /**
   * Called by each card's footer button with the theme key.
   * 每张卡卡脚按钮的回调（题材 key）。
   */
  onOpen?: (key: string) => void
  /**
   * Called when a member row is picked.
   * 点成员行的回调。
   */
  onSelectMember?: (member: ThemeMember, theme: ThemeCardData) => void
  /**
   * Text pack shared by the cards; the Simplified Chinese default is used when omitted.
   * 每张卡共用的文案；不传用简体中文默认。
   */
  labels?: ThemeCardLabels
  /** Extra class names. */
  className?: string
}

/** 多张题材卡横排：一行排不下就横向滚动，卡宽不加固定值（最窄 220px，有空就均分）。 */
export function ThemeCards({
  themes,
  onOpen,
  onSelectMember,
  labels = cnLabelsZh.themeCard,
  className,
}: ThemeCardsProps) {
  return (
    <div className={cn('k-theme-cards', className)} data-slot="theme-cards" role="list" aria-label={labels.row}>
      {themes.map((theme, position) => (
        <div role="listitem" key={theme.key} className="k-theme-cell">
          <ThemeCard
            theme={theme}
            index={position + 1}
            onOpen={onOpen}
            onSelectMember={onSelectMember}
            labels={labels}
          />
        </div>
      ))}
    </div>
  )
}
