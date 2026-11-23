// SPDX-License-Identifier: MIT
// 组合运行表的纯逻辑：状态到灯的语气、行内动作怎么选。
// 件不认识任何引擎，状态只有这四个词；「停新开」指不再开新仓、已有仓位照常管理，与「暂停」（整个品种不动）不同。
import type { SeverityExt } from '../../lib/severity.ts'

/** 一个品种在运行表里的状态：运行 / 暂停 / 停新开 / 断流。 */
export type RunStatus = 'running' | 'paused' | 'noNewEntries' | 'disconnected'

export const RUN_STATUSES: readonly RunStatus[] = ['running', 'paused', 'noNewEntries', 'disconnected']

/** 运行表的一行：一个品种。数值都是原始数，怎么写成文字由调用方的 format 定。 */
export type PortfolioRunRow = {
  /** 稳定 id（常是品种代码加策略实例）。 */
  id: string
  /** 品种代码，演示与读屏用；按钮的回调把整行交回来，调用方据此找品种。 */
  symbol: string
  /** 持仓数量，带符号：正多负空，0 空仓。 */
  position: number
  /** 浮动盈亏。 */
  unrealizedPnl: number
  /** 已实现盈亏。 */
  realizedPnl: number
  /** 占用风险资金。 */
  riskAmount: number
  /** 对组合权益的贡献（浮动加已实现，口径由调用方定）。 */
  equityContribution: number
  status: RunStatus
}

/** 灯的语气：运行是绿，停新开是强调色（有限制但在跑），暂停是琥珀，断流是红。状态永远配文字，不单靠灯色。 */
export const STATUS_TONE: Readonly<Record<RunStatus, SeverityExt>> = {
  running: 'ok',
  paused: 'warn',
  noNewEntries: 'accent',
  disconnected: 'danger',
}

/** 行内第一个动作：暂停的行给「恢复」，别的给「暂停」。 */
export const toggleActionOf = (status: RunStatus): 'pause' | 'resume' => (status === 'paused' ? 'resume' : 'pause')

/**
 * 「平掉」能不能点：只看有没有仓位。暂停与断流的行照样能平——暂停只是不再开新单，用户想离场时不该被锁住。
 * 空仓没有东西可平，灰掉。
 */
export const canClose = (row: Pick<PortfolioRunRow, 'position'>): boolean => row.position !== 0
