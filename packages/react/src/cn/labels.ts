// SPDX-License-Identifier: MIT
// 第 0 层（#110）：cn 件的文案。包里的件不写死任何语言：文字都走这份结构，由调用方传。
// `cnLabelsZh` 是随包的简体中文默认；调用方可以整份换（别的语言、别的措辞），也可以只换其中一段（每个件只读自己那一段）。
import type { CnPhase } from './session.ts'

export type StreakLabels = {
  /** 首板。 */
  first: string
  /** 几板，例「2板」。 */
  boards: (boards: number) => string
  /** 几天几板，例「5天3板」。 */
  daysBoards: (days: number, boards: number) => string
  /** 晋级口径，例「一进二」。 */
  promotion: (from: number, to: number) => string
  /** 取不到连板数时悬停写的原因（缺省不写）。 */
  unavailable: string
}

export type LimitStatusKey = 'sealed' | 'broken' | 'resealed' | 'limitDown' | 'oneWord' | 'auctionLimit'

export type LimitStatusLabels = {
  status: Record<LimitStatusKey, string>
  /** 封单额文字，例「封单 3.20亿」；amount 是已经写好的金额。 */
  sealAmount: (amount: string) => string
  unavailable: string
}

export type BoardKind = 'main' | 'gem' | 'star' | 'bj' | 'st'

export type BoardMarkLabels = {
  kind: Record<BoardKind, string>
  /** 涨跌幅限制，例「20cm」。 */
  limit: (percent: number) => string
  unavailable: string
}

export type SessionLabels = Record<CnPhase, string>

export type PulseLabels = {
  /** 整条的读屏名。 */
  region: string
  /** 半圆表盘下的字。 */
  shareCaption: string
  /** 表盘的读屏名，例「上涨占比 5.4%」。 */
  shareAria: (percent: string) => string
  unit: string
  counts: { rising: string; falling: string; limitUp: string; limitDown: string; flat: string }
  readings: {
    nonStLimitUp: string
    broken: string
    highestBoard: string
    limitUpAmount: string
    sealEstimate: string
    yesterday: string
    yesterdayLimitUp: string
    yesterdayLimitDown: string
    yesterdayBroken: string
    turnover: string
    turnoverForecast: string
    mainNetInflow: string
  }
  /** 各档数字后的单位，例「家」「板」。 */
  suffix: { count: string; boards: string }
  /** 取不到又没给原因时悬停写的字。 */
  unavailable: string
  distribution: string
  distributionTotals: { up: string; muted: string; down: string }
}

export type ThemeCardLabels = {
  limitUpCount: (count: number) => string
  highestBoard: (boards: number) => string
  /** 卡脚，例「查看 6 只涨停」。 */
  viewAll: (count: number) => string
  catalystSource: (source: string) => string
  noCatalyst: string
  noMembers: string
  unavailable: string
  /** 卡的读屏名，例「题材 PCB板」。 */
  card: (name: string) => string
  row: string
}

export type TimelineLabels = {
  region: string
  title: string
  sort: { label: string; latestFirst: string; earliestFirst: string }
  /** 时段图例里的计数，例「1站 1只」。 */
  phaseCount: (stations: number, stocks: number) => string
  phases: SessionLabels
  themeFilter: string
  allThemes: string
  /** 题材 chip 上的计数文字。 */
  themeChip: (name: string, count: number) => string
  /** 一行的标记，例「R1 14:49 — 13:00」。 */
  rowRange: (index: number, from: string, to: string) => string
  /** 行尾提示，例「越来越早」。 */
  towardsEarlier: string
  towardsLater: string
  station: (time: string, count: number) => string
  /** 没有封板时刻的票数提示，例「3 只没有封板时刻」。 */
  noTime: (count: number) => string
  empty: string
  unavailable: string
}

export type SentimentLabels = {
  region: string
  /** 五档，从低到高。 */
  levels: readonly [string, string, string, string, string]
  today: string
  yesterday: string
  scoreCaption: string
  unavailable: string
  scoreAria: (score: string, level: string) => string
}

export type CnLabels = {
  streak: StreakLabels
  limitStatus: LimitStatusLabels
  board: BoardMarkLabels
  pulse: PulseLabels
  themeCard: ThemeCardLabels
  timeline: TimelineLabels
  sentiment: SentimentLabels
}

const NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const numeral = (n: number) => (Number.isInteger(n) && n >= 0 && n <= 10 ? NUMERALS[n]! : String(n))

/** 简体中文默认文案。整份换掉就是别的语言；换一段就只换那一件的字。 */
export const cnLabelsZh: CnLabels = {
  streak: {
    first: '首板',
    boards: (boards) => `${boards}板`,
    daysBoards: (days, boards) => `${days}天${boards}板`,
    promotion: (from, to) => `${numeral(from)}进${numeral(to)}`,
    unavailable: '连板数取不到',
  },
  limitStatus: {
    status: {
      sealed: '封板',
      broken: '炸板',
      resealed: '回封',
      limitDown: '跌停',
      oneWord: '一字',
      auctionLimit: '竞价涨停',
    },
    sealAmount: (amount) => `封单 ${amount}`,
    unavailable: '涨停状态取不到',
  },
  board: {
    kind: { main: '主板', gem: '创业板', star: '科创板', bj: '北交所', st: 'ST' },
    limit: (percent) => `${percent}cm`,
    unavailable: '板块取不到',
  },
  pulse: {
    region: '市场全景',
    shareCaption: '上涨占比',
    shareAria: (percent) => `上涨占比 ${percent}`,
    unit: '家',
    counts: { rising: '上涨', falling: '下跌', limitUp: '涨停', limitDown: '跌停', flat: '平盘' },
    readings: {
      nonStLimitUp: '非ST涨停',
      broken: '炸板',
      highestBoard: '最高连板',
      limitUpAmount: '涨停板上成交额',
      sealEstimate: '涨停封单估算',
      yesterday: '昨日涨停 / 跌停 / 炸板',
      yesterdayLimitUp: '昨日涨停',
      yesterdayLimitDown: '昨日跌停',
      yesterdayBroken: '昨日炸板',
      turnover: '两市成交额',
      turnoverForecast: '预测成交',
      mainNetInflow: '主力净流入',
    },
    suffix: { count: '家', boards: '板' },
    unavailable: '暂无数据',
    distribution: '涨跌分布',
    distributionTotals: { up: '涨', muted: '平', down: '跌' },
  },
  themeCard: {
    limitUpCount: (count) => `${count}涨停`,
    highestBoard: (boards) => `${boards}板`,
    viewAll: (count) => `查看 ${count} 只涨停`,
    catalystSource: (source) => `来源：${source}`,
    noCatalyst: '暂无催化',
    noMembers: '暂无涨停成员',
    unavailable: '暂无数据',
    card: (name) => `题材 ${name}`,
    row: '题材卡',
  },
  timeline: {
    region: '涨停时间线',
    title: '同分钟聚合时刻轴',
    sort: { label: '排序', latestFirst: '最新在前', earliestFirst: '最早在前' },
    phaseCount: (stations, stocks) => `${stations}站 ${stocks}只`,
    phases: { auction: '集合竞价', morning: '早盘', afternoon: '午盘', late: '尾盘' },
    themeFilter: '按题材筛选',
    allThemes: '全部',
    themeChip: (name, count) => `${name} ${count}`,
    rowRange: (index, from, to) => `R${index} ${from} — ${to}`,
    towardsEarlier: '越来越早',
    towardsLater: '越来越晚',
    station: (time, count) => `${time}，${count} 只涨停`,
    noTime: (count) => `${count} 只没有封板时刻，未上轴`,
    empty: '暂无涨停',
    unavailable: '暂无数据',
  },
  sentiment: {
    region: '情绪温度',
    levels: ['冰点', '低迷', '中性', '升温', '高潮'],
    today: '今日',
    yesterday: '昨日',
    scoreCaption: '情绪分',
    unavailable: '暂无数据',
    scoreAria: (score, level) => `情绪温度 ${score}，${level}`,
  },
}
