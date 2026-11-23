// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type LimitStatusLabels } from './labels.ts'
import { limitStatusTone, normalizeLimitStatus, type LimitStatusValue } from './badge-model.ts'

// 涨停状态胶囊（#110）：封板 / 炸板 / 回封 / 跌停 / 一字 / 竞价涨停，可带封单额。色调：涨停一族涨色（跟 data-updown）、炸板警示、跌停跌色；
// 状态不只靠颜色，字就是状态名。取不到写「—」，reason 放悬停。

export type LimitStatusProps = {
  /**
   * The status key, or an object with the seal amount (yuan) and a reason; null status means unavailable.
   * 状态，或带封单额（元）与原因的对象；status 为 null 是取不到。
   */
  status: LimitStatusValue | null | undefined
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: LimitStatusLabels
  /** Extra class names. */
  className?: string
}

export function LimitStatus({ status, labels = cnLabelsZh.limitStatus, className }: LimitStatusProps) {
  const value = normalizeLimitStatus(status)
  if (value.status === null) {
    return (
      <span
        className={cn('k-cn-chip k-cn-limit', className)}
        data-slot="limit-status"
        data-unavailable="true"
        title={value.reason ?? labels.unavailable}
      >
        —
      </span>
    )
  }
  const amount = value.sealAmount === null ? null : formatCnAmount(value.sealAmount)
  return (
    <span
      className={cn('k-cn-chip k-cn-limit', className)}
      data-slot="limit-status"
      data-status={value.status}
      data-tone={limitStatusTone(value.status)}
      title={amount === null ? undefined : labels.sealAmount(amount)}
    >
      {labels.status[value.status]}
      {amount !== null && <span className="k-cn-limit-amount">{amount}</span>}
    </span>
  )
}
