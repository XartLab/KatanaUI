// SPDX-License-Identifier: MIT
/**
 * Texts of DerivativesBoard and DerivativesCard. The default is Simplified Chinese (`derivativesLabelsZh`); pass your own pack for another language.
 * 交易数据看板的文案：随包默认简体中文，整份换掉就是别的语言。卡名与说明照 OKX 永续页「交易数据」的六张卡（2026-11-26 读）。
 */
import type { DerivativesKind } from './derivatives-model.ts'

export type DerivativesLabels = {
  /** Accessible name of the board. 整个看板的读屏名。 */
  region: string
  /** Title and the hint behind the info button of each card. 每张卡的标题与「信息」按钮里的说明。 */
  cards: Record<DerivativesKind, { title: string; info: string }>
  /** Words of the period buttons, by period id (`5m`, `1h`, `1d`, `7d`, `14d`); an id without a word is shown as is. */
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
  /** Text of a card with no data. */
  empty: string
  /** Accessible name of a plot: card title plus the latest values, e.g. 「资金费率，最新 +0.0100%」. */
  plotAria: (title: string, latest: string) => string
  /** Said when a card has data but no value of the latest bucket can be read. */
  noLatest: string
}

export const derivativesLabelsZh: DerivativesLabels = {
  region: '交易数据',
  cards: {
    openInterestVolume: {
      title: '持仓量及成交量',
      info: '持仓量是尚未平仓的合约总量（线，右轴）；成交量是该周期内成交的合约量（柱，左轴）。',
    },
    fundingRate: {
      title: '资金费率',
      info: '永续合约每次结算多空之间收付的费率。正数是多头付空头，负数是空头付多头。',
    },
    takerVolume: {
      title: '主动买卖量',
      info: '主动以对手价吃单的买入量与卖出量。买入在零线上，卖出镜像在零线下。',
    },
    longShortRatio: {
      title: '多空账户比',
      info: '持有多头与空头的账户各占的比例（柱，满格 100%），线是多头账户数与空头账户数的比值（右轴）。',
    },
    topTraderRatio: {
      title: '精英多空趋向',
      info: '持仓靠前的大户里，多头与空头各占的比例（柱，满格 100%），线是两边的比值（右轴）。',
    },
    basis: {
      title: '合约基差',
      info: '上面是合约价与指数价，下面是基差：合约价减指数价，正数是升水，负数是贴水。',
    },
  },
  periods: { '5m': '5 分钟', '1h': '1 小时', '1d': '1 天', '7d': '近 7 天', '14d': '近 14 天' },
  periodGroup: (title) => `${title}的周期`,
  infoButton: (title) => `${title}的说明`,
  series: {
    openInterest: '持仓量',
    volume: '成交量',
    rate: '资金费率',
    buy: '主动买入',
    sell: '主动卖出',
    long: '多头',
    short: '空头',
    ratio: '多空比',
    contract: '合约价',
    index: '指数价',
    basis: '基差',
  },
  empty: '暂无数据',
  plotAria: (title, latest) => `${title}，最新 ${latest}`,
  noLatest: '无最新值',
}
