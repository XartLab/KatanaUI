// SPDX-License-Identifier: MIT
// 适配层的文案：KatanaUI 的件自己不带文字，所以这里给智能体没传的读屏名与状态词补英文兜底；智能体按用户语言写的 labels 优先。
// 这是 a2ui 入口里唯一带英文的地方，主入口不引它。每个字段都能被覆盖，覆盖用 {name} 占位符放变量。
import type { DecisionQueueLabels, HypothesisLedgerLabels } from '../blocks/index.ts'
import type { DateTimeLabels } from '../index.ts'
import { fill } from './support.tsx'

export type TextMap = Readonly<Record<string, string | undefined>>

const pick = (map: TextMap | undefined, key: string, fallback: string) => map?.[key] ?? fallback
const day = (time: number) => new Date(time).toISOString().slice(0, 10)

const span = (seconds: number, text: TextMap | undefined) =>
  seconds < 60
    ? fill(pick(text, 'secondsAgo', '{n}s ago'), { n: seconds })
    : seconds < 3600
      ? fill(pick(text, 'minutesAgo', '{n} min ago'), { n: Math.floor(seconds / 60) })
      : fill(pick(text, 'hoursAgo', '{n} h ago'), { n: Math.floor(seconds / 3600) })

/** 日期时间输入的读屏名：label 是智能体给的字段名。 */
export function dateTimeLabels(text: TextMap | undefined): DateTimeLabels {
  return {
    date: (label) => fill(pick(text, 'date', '{label} date'), { label }),
    pickDate: (label) => fill(pick(text, 'pickDate', 'Pick {label} date'), { label }),
    calendar: (label) => fill(pick(text, 'calendar', '{label} calendar'), { label }),
    time: (label) => fill(pick(text, 'time', '{label} time'), { label }),
    previousMonth: pick(text, 'previousMonth', 'Previous month'),
    nextMonth: pick(text, 'nextMonth', 'Next month'),
  }
}

/** 建议队列的全部文案：text 里写了的覆盖兜底。 */
export function decisionLabels(text: TextMap | undefined): DecisionQueueLabels {
  return {
    queue: pick(text, 'queue', 'Suggestions'),
    filters: pick(text, 'filters', 'Filter by status'),
    filter: {
      pending: pick(text, 'filterPending', 'Pending'),
      accepted: pick(text, 'filterAccepted', 'Accepted'),
      rejected: pick(text, 'filterRejected', 'Rejected'),
      expired: pick(text, 'filterExpired', 'Expired'),
    },
    accept: pick(text, 'accept', 'Accept'),
    reject: pick(text, 'reject', 'Reject'),
    snooze: pick(text, 'snooze', 'Later'),
    acceptHint: pick(text, 'acceptHint', 'Hold to confirm'),
    accepted: pick(text, 'acceptedButton', 'Accepted'),
    snoozed: pick(text, 'snoozed', 'Snoozed'),
    status: {
      pending: pick(text, 'statusPending', 'Pending'),
      snoozed: pick(text, 'statusSnoozed', 'Snoozed'),
      accepted: pick(text, 'statusAccepted', 'Accepted'),
      rejected: pick(text, 'statusRejected', 'Rejected'),
      expired: pick(text, 'statusExpired', 'Expired'),
    },
    confidence: (percent) => fill(pick(text, 'confidence', 'Confidence {percent}%'), { percent }),
    basis: pick(text, 'basis', 'Basis'),
    sources: pick(text, 'sources', 'Sources'),
    details: pick(text, 'details', 'Details'),
    createdAgo: (seconds) => fill(pick(text, 'createdAgo', 'Created {ago}'), { ago: span(seconds, text) }),
    expiresIn: (seconds) =>
      fill(pick(text, 'expiresIn', '{time} left'), {
        time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
      }),
    expired: pick(text, 'expired', 'Expired'),
    resolvedBy: (by, ago) => fill(pick(text, 'resolvedBy', '{by} · {ago}'), { by, ago }),
    ago: (seconds) => span(seconds, text),
    absolute: (time) => new Date(time).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    empty: {
      pending: pick(text, 'emptyPending', 'Nothing pending'),
      accepted: pick(text, 'emptyAccepted', 'Nothing accepted yet'),
      rejected: pick(text, 'emptyRejected', 'Nothing rejected yet'),
      expired: pick(text, 'emptyExpired', 'Nothing expired'),
    },
  }
}

/** 假说账的全部文案。 */
export function hypothesisLabels(text: TextMap | undefined): HypothesisLedgerLabels {
  return {
    ledger: pick(text, 'ledger', 'Hypotheses'),
    views: pick(text, 'views', 'View'),
    viewLedger: pick(text, 'viewLedger', 'Ledger'),
    viewWatch: pick(text, 'viewWatch', 'Watch table'),
    statusFilter: pick(text, 'statusFilter', 'Filter by status'),
    layerFilter: pick(text, 'layerFilter', 'Filter by layer'),
    clearLayers: pick(text, 'clearLayers', 'All layers'),
    all: pick(text, 'all', 'All'),
    layer: {
      strategy: pick(text, 'layerStrategy', 'Strategy'),
      credit: pick(text, 'layerCredit', 'Credit'),
      fiscal: pick(text, 'layerFiscal', 'Fiscal'),
      crossborder: pick(text, 'layerCrossborder', 'Cross-border'),
      industry: pick(text, 'layerIndustry', 'Industry'),
      profit: pick(text, 'layerProfit', 'Profit'),
      allocation: pick(text, 'layerAllocation', 'Allocation'),
      haven: pick(text, 'layerHaven', 'Haven'),
    },
    status: {
      pending: pick(text, 'statusPending', 'Pending'),
      supported: pick(text, 'statusSupported', 'Supported'),
      refuted: pick(text, 'statusRefuted', 'Refuted'),
      expired: pick(text, 'statusExpired', 'Expired'),
    },
    kind: {
      scholar: pick(text, 'kindScholar', 'Scholar'),
      policy: pick(text, 'kindPolicy', 'Policy'),
      data: pick(text, 'kindData', 'Data'),
      filing: pick(text, 'kindFiling', 'Filing'),
    },
    stance: { support: pick(text, 'stanceSupport', 'Supports'), oppose: pick(text, 'stanceOppose', 'Opposes') },
    failure: pick(text, 'failure', 'Fails if'),
    evidence: pick(text, 'evidence', 'Evidence'),
    assets: pick(text, 'assets', 'Assets'),
    noEvidence: pick(text, 'noEvidence', 'No evidence yet'),
    tally: (support, oppose) => fill(pick(text, 'tally', '{support} for · {oppose} against'), { support, oppose }),
    deadlineIn: (days) =>
      days === 0 ? pick(text, 'dueToday', 'Due today') : fill(pick(text, 'deadlineIn', '{days} d left'), { days }),
    overdueBy: (days) => fill(pick(text, 'overdueBy', '{days} d overdue'), { days }),
    date: day,
    empty: pick(text, 'empty', 'No hypotheses'),
    watchLayer: pick(text, 'watchLayer', 'Layer'),
    watchEvidence: pick(text, 'watchEvidence', 'Key evidence'),
    watchConfusion: pick(text, 'watchConfusion', 'Easily confused'),
  }
}
