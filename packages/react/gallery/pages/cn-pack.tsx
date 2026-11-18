// SPDX-License-Identifier: MIT
// A 股面板的几件（#11，开盘啦对照）的文档站预览：数据都是编出来的演示数据（见 usage/ 里各自的说明），不是行情。
// 涨跌色跟根上的 data-updown 走：A 股面板在根上设 data-updown="cn" 就是红涨绿跌，件里不写死。
// 文档站默认是绿涨红跌；这一组是 A 股件，演示挂上时把根切到 cn、离开这一页还原（评审 #78：A 股用户看绿涨是反的）。
import { useLayoutEffect, useState } from 'react'
import {
  BoardStrengthRank,
  NetBuyBar,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  ReasonGroupList,
  SentimentGauge,
  type RankedBoard,
  type ReasonStock,
} from '../../src/blocks/index.ts'
import { ThemeHeatMatrix, type ThemeHeatPos } from '../../src/quant/index.ts'
import { BOARDS } from '../usage/BoardStrengthRankUsage.tsx'
import { DRAGON_ITEMS } from '../usage/NetBuyBarUsage.tsx'
import { REASON_GROUPS } from '../usage/ReasonGroupListUsage.tsx'
import { SENTIMENT_DAYS, SENTIMENT_METRICS, SENTIMENT_STAGES } from '../usage/SentimentGaugeUsage.tsx'
import { HEAT_DATES, HEAT_ROWS } from '../usage/ThemeHeatMatrixUsage.tsx'

const NOTE = '演示数据：编出来的，不是行情；口径由调用方定。本页根上设了 data-updown="cn"（红涨绿跌）。'

/** 这一页挂着时根上是 data-updown="cn"，离开还原成原来的值。 */
function useCnUpdown() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const before = root.dataset.updown
    root.dataset.updown = 'cn'
    return () => {
      if (before === undefined) delete root.dataset.updown
      else root.dataset.updown = before
    }
  }, [])
}

function Frame({ heading, height, children }: { heading: string; height?: number; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', maxWidth: 720, height }}>
      <PanelFrame focused aria-label={heading}>
        <PanelFrameHeader heading={heading} object="演示数据" />
        <PanelFrameBody>{children}</PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

const SENTIMENT_LABELS = {
  title: '情绪周期（演示数据）',
  score: '情绪分',
  gauge: '情绪温度',
  trend: '近 20 日',
  band: '情绪阶段带',
  metrics: '情绪分项',
  current: '当前',
  empty: '没有情绪数据',
}

export function SentimentGaugeDemo() {
  useCnUpdown()
  const [active, setActive] = useState<string | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 720 }}>
      <p className="gal-note">{NOTE} 点图例里的阶段，带上只亮这一段。</p>
      <Frame heading="情绪周期">
        <SentimentGauge
          days={SENTIMENT_DAYS}
          stages={SENTIMENT_STAGES}
          metrics={SENTIMENT_METRICS}
          labels={SENTIMENT_LABELS}
          activeStage={active}
          onStageSelect={(stage) => setActive(stage?.id ?? null)}
        />
      </Frame>
      <p className="gal-note">没有数据：传空数组，画空态，不放样本。</p>
      <Frame heading="情绪周期 · 空">
        <SentimentGauge days={[]} stages={SENTIMENT_STAGES} labels={SENTIMENT_LABELS} />
      </Frame>
    </div>
  )
}

export function ThemeHeatMatrixDemo() {
  useCnUpdown()
  const [selected, setSelected] = useState<ThemeHeatPos | null>({ row: 0, col: HEAT_DATES.length - 1 })
  const picked = selected ? `${HEAT_ROWS[selected.row]?.name} · ${HEAT_DATES[selected.col]}` : '没选'
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 720 }}>
      <p className="gal-note">{NOTE} 方向键走格，Enter 选中。</p>
      <Frame heading="题材热度">
        <ThemeHeatMatrix
          dates={HEAT_DATES}
          rows={HEAT_ROWS}
          selected={selected}
          onSelect={(row, col) => setSelected({ row: HEAT_ROWS.indexOf(row), col })}
          labels={{
            grid: '题材热度矩阵（演示数据）',
            theme: '题材',
            rank: (n) => `#${n}`,
            cell: (row, date, count, rank) =>
              count === null ? `${row.name} ${date}：没有数据` : `${row.name} ${date}：涨停 ${count} 只，第 ${rank}`,
            legend: { low: '少', high: '多' },
            empty: '没有题材数据',
          }}
        />
      </Frame>
      <p className="gal-note" data-testid="heat-picked">
        选中：{picked}
      </p>
    </div>
  )
}

export function ReasonGroupListDemo() {
  useCnUpdown()
  const [picked, setPicked] = useState<ReasonStock | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 720 }}>
      <p className="gal-note">{NOTE} 点组头收起 / 展开，芯片按原因筛选。</p>
      <Frame heading="涨停原因">
        <ReasonGroupList
          groups={REASON_GROUPS}
          onSelect={setPicked}
          labels={{
            list: '涨停原因分组（演示数据）',
            filter: '按原因筛选',
            clear: '清除筛选',
            count: (n) => `${n} 家`,
            highest: (n) => `最高 ${n} 板`,
            board: (n) => (n === 1 ? '首板' : `${n} 板`),
            columns: {
              name: '名称',
              board: '连板',
              change: '涨跌幅',
              firstSeal: '首封',
              sealAmount: '封单',
              turnover: '成交额',
              tags: '其他原因',
            },
            empty: '没有涨停',
          }}
        />
      </Frame>
      <p className="gal-note" data-testid="reason-picked">
        打开：{picked ? `${picked.code} ${picked.name}` : '没有'}
      </p>
    </div>
  )
}

export function BoardStrengthRankDemo() {
  useCnUpdown()
  const [selected, setSelected] = useState<RankedBoard | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 720 }}>
      <p className="gal-note">{NOTE} 名次按传入的强度从高到低排，变化跟上一期名次比。</p>
      <Frame heading="板块强度">
        <BoardStrengthRank
          boards={BOARDS}
          selected={selected?.id ?? null}
          onSelect={setSelected}
          labels={{
            list: '板块强度排名（演示数据）',
            columns: {
              rank: '名次',
              name: '板块',
              strength: '强度',
              trend: '走势',
              limitUps: '涨停',
              change: '涨跌幅',
            },
            move: { up: (n) => `▲${n}`, down: (n) => `▼${n}`, same: '—', new: '新' },
            trend: (board) => `${board.name} 强度走势`,
            empty: '没有板块数据',
          }}
        />
      </Frame>
      <p className="gal-note" data-testid="board-picked">
        打开：{selected ? `${selected.rank} ${selected.name}` : '没有'}
      </p>
      <p className="gal-note">只看前三（limit=3）：</p>
      <div style={{ width: '100%', maxWidth: 560 }} data-testid="board-top3">
        <BoardStrengthRankLimit />
      </div>
    </div>
  )
}

function BoardStrengthRankLimit() {
  return (
    <BoardStrengthRank
      boards={BOARDS}
      limit={3}
      labels={{
        list: '板块强度前三（演示数据）',
        columns: { rank: '名次', name: '板块', strength: '强度', trend: '走势', limitUps: '涨停', change: '涨跌幅' },
        move: { up: (n) => `▲${n}`, down: (n) => `▼${n}`, same: '—', new: '新' },
        trend: (board) => `${board.name} 强度走势`,
        empty: '没有板块数据',
      }}
    />
  )
}

export function NetBuyBarDemo() {
  useCnUpdown()
  const [open, setOpen] = useState<string | null>(DRAGON_ITEMS[0]!.code)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 720 }}>
      <p className="gal-note">{NOTE} 点一行看买卖前五席位；机构席位带标签。</p>
      <Frame heading="龙虎榜">
        <NetBuyBar
          items={DRAGON_ITEMS}
          expanded={open}
          onExpandedChange={setOpen}
          formatAmount={(v) => `${(v / 1e8).toFixed(2)} 亿`}
          labels={{
            list: '龙虎榜净买（演示数据）',
            columns: { name: '名称', change: '涨跌幅', net: '净买', buy: '买入', sell: '卖出' },
            seats: { buy: '买入前五', sell: '卖出前五' },
            institution: '机构',
            scale: (max) => `刻度 ±${(max / 1e8).toFixed(1)} 亿`,
            empty: '今天没有上榜',
          }}
        />
      </Frame>
    </div>
  )
}
