// SPDX-License-Identifier: MIT
// 品种名后的上标徽标（板块、风险标记）：上标小字，颜色取次要文字色，不抢品种名；皮肤在 ../theme/badge.css。
// 搬自 src/ui/Badges.tsx（#1860）：徽标有哪些、全称怎么写（含按界面语言翻）是应用的事（市场包的 badgesOf），这里只管画。
// 一个徽标是一个 role=img，名字是全称，读屏读「科创板：涨跌幅 20%」而不是单字「科」。

export type BadgeItem = {
  id: string
  /** 上标上的字（单字）。 */
  label: string
  /** 全称：读屏名，也是悬停提示。 */
  text: string
}

/** 一排上标徽标；没有徽标时什么都不画。 */
export function BadgeGroup({ items }: { items: readonly BadgeItem[] }) {
  if (items.length === 0) return null
  return (
    <span className="k-badges">
      {items.map(({ id, label, text }) => (
        <sup key={id} className="k-badge" role="img" aria-label={text} title={text}>
          {label}
        </sup>
      ))}
    </span>
  )
}
