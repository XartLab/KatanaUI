// SPDX-License-Identifier: MIT
// 第 0 层（#110）：cn 件的文案。包里的件不写死任何语言：文字都走这份结构，由调用方传。
// `cnLabelsZh` 是随包的简体中文默认；调用方可以整份换（别的语言、别的措辞），也可以只换其中一段（每个件只读自己那一段）。
import type { CnPhase } from './session.ts'
import type { ThresholdGapState } from './threshold-gap-model.ts'

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
  /** 标题旁的汇总，例「共 25 只 · 20 个封板时刻」。 */
  summary: (stocks: number, stations: number) => string
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
  /** 今昨对比的四行名字。 */
  rows: { limitUp: string; limitDown: string; sealRate: string; broken: string }
  today: string
  yesterday: string
  scoreCaption: string
  unavailable: string
  scoreAria: (score: string, level: string) => string
}

export type SeatTableLabels = {
  region: string
  buyTitle: string
  sellTitle: string
  /** 列头：席位、买入额、卖出额、净额。 */
  columns: { seat: string; buy: string; sell: string; net: string }
  /** 合计行的字。 */
  total: string
  /** 两侧合计下面的一行，例「买入前五合计净额」。 */
  netTotal: string
  empty: string
  unavailable: string
  /** 一张表的读屏名，例「买入前五席位」。 */
  tableAria: (title: string) => string
}

export type AuctionStepLabels = {
  region: string
  /** 横轴两端与 09:20 分界的字。 */
  axis: { from: string; cancelCutoff: string; to: string }
  /** 底部读数：撮合价、累计量。 */
  price: string
  volume: string
  /** 昨收参考线的字。 */
  prevClose: string
  empty: string
  unavailable: string
  /** 图的读屏名，例「竞价台阶 09:15–09:25，撮合价 12.34」。 */
  aria: (last: string) => string
}

export type TradingDatePickerLabels = {
  /** 触发按钮的读屏名与日历弹层的名字。 */
  pick: string
  calendar: string
  previousMonth: string
  nextMonth: string
  previousDay: string
  nextDay: string
  /** 没有选日期时按钮上的字。 */
  placeholder: string
  /** 非交易日日期格的读屏补充，例「休市」。 */
  closed: string
}

export type FlowRaceLabels = {
  region: string
  /** 右端排行的读屏名。 */
  ranking: string
  /** 横轴两端的字。 */
  axis: { from: string; mid: string; to: string }
  empty: string
  unavailable: string
  /** 排行的一行，例「第 1 名 机器人 +3.2亿」。 */
  rankAria: (rank: number, name: string, value: string) => string
}

export type MiniKCardLabels = {
  region: string
  /** 一张卡的读屏名，例「机器人 600000，涨 3.21%」。 */
  card: (name: string, code: string, change: string) => string
  /** K 线图的读屏名，例「最近 30 根日 K」。 */
  chart: (count: number) => string
  noCandles: string
  empty: string
  unavailable: string
}

export type MoveFeedLabels = {
  region: string
  /** 类型多选筛的读屏名与「全部」。 */
  filter: string
  all: string
  /** 一类异动的名字，key 是 MOVE_TYPE_KEYS 里的。 */
  types: Record<string, string>
  /** 筛选 chip 上的计数文字。 */
  typeChip: (name: string, count: number) => string
  /** 顶上的汇总，例「共 120 条」。 */
  summary: (count: number) => string
  empty: string
  /** 一行的读屏名，例「09:31:05 机器人 火箭发射 +3.2%」。 */
  row: (time: string, name: string, type: string, value: string) => string
  unavailable: string
}

export type RangeScrubberLabels = {
  region: string
  /** 起点、终点把手的读屏名。 */
  low: string
  high: string
  /** 读数行，例「09:45–10:30 · 45 分钟」；minutes 是交易分钟（午休不算）。 */
  span: (from: string, to: string, minutes: number) => string
  /** 快捷钮组的读屏名与一个钮上的字，例「近 15 分」。 */
  presetGroup: string
  preset: (minutes: number) => string
  /** 口径切换的读屏名与各口径的名字（键是调用方给的 metrics）。 */
  metricGroup: string
  metrics: Record<string, string>
  /** 「现在」之后那段斜纹的悬停提示。 */
  future: string
}

export type AuctionBarLabels = {
  /** 09:25 之前格里写的字。 */
  pending: string
  /** 整格的读屏名（也是悬停提示）；金额已写成万 / 亿，取不到是「—」，没有涨停委买是 null。 */
  aria: (parts: {
    amount: string
    previous: string
    ratio: string
    limitBid: string | null
    pending: boolean
  }) => string
}

export type ThresholdGapLabels = {
  state: Record<ThresholdGapState, string>
  /** 离阈值还差多少，例「差 0.04%」。 */
  gap: (percent: string) => string
  /** 越过阈值多少，例「超出 1.20%」。 */
  over: (percent: string) => string
  /** 读屏里阈值与预警线的说法，例「阈值 20.00%」。 */
  threshold: (percent: string) => string
  warn: (percent: string) => string
  unavailable: string
}

export type CnLabels = {
  streak: StreakLabels
  limitStatus: LimitStatusLabels
  board: BoardMarkLabels
  pulse: PulseLabels
  themeCard: ThemeCardLabels
  timeline: TimelineLabels
  sentiment: SentimentLabels
  seatTable: SeatTableLabels
  auctionStep: AuctionStepLabels
  tradingDate: TradingDatePickerLabels
  flowRace: FlowRaceLabels
  miniK: MiniKCardLabels
  moveFeed: MoveFeedLabels
  rangeScrubber: RangeScrubberLabels
  auctionBar: AuctionBarLabels
  thresholdGap: ThresholdGapLabels
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
    summary: (stocks, stations) => `共 ${stocks} 只 · ${stations} 个封板时刻`,
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
    rows: { limitUp: '涨停', limitDown: '跌停', sealRate: '封率', broken: '开板' },
    today: '今日',
    yesterday: '昨日',
    scoreCaption: '情绪分',
    unavailable: '暂无数据',
    scoreAria: (score, level) => `情绪温度 ${score}，${level}`,
  },
  seatTable: {
    region: '龙虎榜席位',
    buyTitle: '买入前五',
    sellTitle: '卖出前五',
    columns: { seat: '席位', buy: '买入', sell: '卖出', net: '净额' },
    total: '合计',
    netTotal: '净额合计',
    empty: '暂无席位',
    unavailable: '暂无数据',
    tableAria: (title) => `${title}席位`,
  },
  auctionStep: {
    region: '集合竞价台阶',
    axis: { from: '09:15', cancelCutoff: '09:20 起不可撤单', to: '09:25' },
    price: '撮合价',
    volume: '匹配量',
    prevClose: '昨收',
    empty: '暂无竞价数据',
    unavailable: '暂无数据',
    aria: (last) => `集合竞价台阶 09:15–09:25，最新撮合价 ${last}`,
  },
  tradingDate: {
    pick: '选交易日',
    calendar: '交易日历',
    previousMonth: '上个月',
    nextMonth: '下个月',
    previousDay: '上一个交易日',
    nextDay: '下一个交易日',
    placeholder: '选择交易日',
    closed: '休市',
  },
  flowRace: {
    region: '板块资金流向',
    ranking: '资金排行',
    axis: { from: '09:30', mid: '11:30/13:00', to: '15:00' },
    empty: '暂无资金数据',
    unavailable: '暂无数据',
    rankAria: (rank, name, value) => `第 ${rank} 名 ${name} ${value}`,
  },
  miniK: {
    region: '选股结果',
    card: (name, code, change) => `${name} ${code}，${change}`,
    chart: (count) => `最近 ${count} 根 K 线`,
    noCandles: '暂无 K 线',
    empty: '暂无选股结果',
    unavailable: '暂无数据',
  },
  moveFeed: {
    region: '盘口异动',
    filter: '按异动类型筛选',
    all: '全部',
    types: {
      rocket: '火箭发射',
      rebound: '快速反弹',
      dive: '高台跳水',
      plunge: '加速下跌',
      bigBuy: '大笔买入',
      bigSell: '大笔卖出',
      volumeSurge: '放量异动',
      sealUp: '封涨停板',
      sealDown: '封跌停板',
      openUp: '打开涨停板',
      openDown: '打开跌停板',
    },
    typeChip: (name, count) => `${name} ${count}`,
    summary: (count) => `共 ${count} 条`,
    empty: '暂无异动',
    row: (time, name, type, value) => `${time} ${name} ${type} ${value}`,
    unavailable: '暂无数据',
  },
  rangeScrubber: {
    region: '区间时间轴',
    low: '区间起点',
    high: '区间终点',
    span: (from, to, minutes) => `${from}–${to} · ${minutes} 分钟`,
    presetGroup: '快捷区间',
    preset: (minutes) => (minutes >= 60 && minutes % 60 === 0 ? `近 ${minutes / 60} 小时` : `近 ${minutes} 分`),
    metricGroup: '统计口径',
    metrics: { change: '涨幅', net: '净额', strength: '强度' },
    future: '还没到的时段',
  },
  auctionBar: {
    pending: '未出结果',
    aria: ({ amount, previous, ratio, limitBid, pending }) =>
      `${pending ? '竞价未出结果，' : ''}竞价额 ${amount}，昨日同期 ${previous}，量比 ${ratio}${limitBid === null ? '' : `，涨停委买 ${limitBid}`}`,
  },
  thresholdGap: {
    state: { watch: '监控中', near: '临近', triggered: '已触发', ended: '监管期结束' },
    gap: (percent) => `差 ${percent}`,
    over: (percent) => `超出 ${percent}`,
    threshold: (percent) => `阈值 ${percent}`,
    warn: (percent) => `预警线 ${percent}`,
    unavailable: '暂无数据',
  },
}
