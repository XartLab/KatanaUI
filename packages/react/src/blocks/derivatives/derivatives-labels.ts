// SPDX-License-Identifier: MIT
/**
 * Texts of DerivativesBoard and DerivativesCard. The package carries no language: the caller passes the whole pack (required).
 * 交易数据看板的文案：包里不带语言，调用方整份传（必填）。简体中文那份在文档站演示里（gallery/usage/derivatives-labels-zh.ts），卡名与说明照 OKX 永续页「交易数据」的六张卡（2026-11-26 读）。
 */
import type { DerivativesKind } from './derivatives-model.ts'

export type DerivativesLabels = {
  /** Accessible name of the board. 整个看板的读屏名。 */
  region: string
  /** Title and the hint behind the info button of each card. 每张卡的标题与「信息」按钮里的说明。 */
  cards: Record<DerivativesKind, { title: string; info: string }>
  /** Words of the period buttons, by period id (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `7d`, `14d`); an id without a word is shown as is. */
  periods: Record<string, string>
  /** Accessible name of the period group of one card. */
  periodGroup: (title: string) => string
  /** Accessible name of the info button of one card. */
  infoButton: (title: string) => string
  /** Names of the drawn series (legend, tooltip, summary). */
  series: {
    openInterest: string
    volume: string
    rate: string
    buy: string
    sell: string
    long: string
    short: string
    ratio: string
    contract: string
    index: string
    basis: string
  }
  /** Joins the readings in one sentence read aloud (latest values, hover readings), e.g. 「，」 in Chinese or `, ` in English. */
  separator: string
  /** Text of a card with no data. */
  empty: string
  /** Accessible name of a plot: card title plus the latest values, e.g. 「资金费率，最新 +0.0100%」. */
  plotAria: (title: string, latest: string) => string
  /** Said when a card has data but no value of the latest bucket can be read. */
  noLatest: string
}
