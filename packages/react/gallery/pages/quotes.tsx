// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  Button,
  GaugeBar,
  layoutTreemap,
  PriceTag,
  QuoteCard,
  QuoteStrip,
  QuoteTable,
  RangeBar,
  RatingGauge,
  RowActions,
  Sparkline,
  Treemap,
  type QuoteTone,
  type TreemapItem,
} from '../../src/index'
import { ActionLog, Row, demoSymbolActions } from './parts'

// #1884：报价与行情类的件的演示。下面所有数据都是演示用的示例（在这个展示页里构造，不是行情），页上也写明了；应用里没有样本数据。

const SAMPLE = '示例数据，不是行情'

const rise = [10, 10.4, 10.2, 10.9, 11.3, 11.1, 11.8]
const fall = [12, 11.6, 11.8, 11.1, 10.7, 10.9, 10.2]
const level = [10, 10.2, 9.9, 10.1, 10, 10.2, 10]

type Sample = {
  id: string
  name: string
  symbol: string
  price: string
  change: string
  percent: string
  tone: QuoteTone
  spark: readonly number[]
}

const cards: readonly Sample[] = [
  {
    id: 'a',
    name: '示例甲',
    symbol: 'AAA',
    price: '11.80',
    change: '+1.80',
    percent: '+18.00%',
    tone: 'up',
    spark: rise,
  },
  {
    id: 'b',
    name: '示例乙',
    symbol: 'BBB',
    price: '10.20',
    change: '-1.80',
    percent: '-15.00%',
    tone: 'down',
    spark: fall,
  },
  {
    id: 'c',
    name: '示例丙',
    symbol: 'CCC',
    price: '10.00',
    change: '0.00',
    percent: '0.00%',
    tone: 'flat',
    spark: level,
  },
  {
    id: 'd',
    name: '示例丁',
    symbol: 'DDD',
    price: '23.45',
    change: '+0.45',
    percent: '+1.96%',
    tone: 'up',
    spark: rise,
  },
]

export function SparklineDemo() {
  return (
    <>
      <Row name="涨 · 跌 · 平">
        <div className="gal-wide" data-gallery-spark="up">
          <Sparkline values={rise} label="示例走势：涨" />
        </div>
        <div className="gal-wide" data-gallery-spark="down">
          <Sparkline values={fall} label="示例走势：跌" />
        </div>
        <div className="gal-wide" data-gallery-spark="flat">
          <Sparkline values={[10, 10.5, 10]} label="示例走势：平" />
        </div>
      </Row>
      <Row name="没有数据">
        <div data-gallery-spark="empty">
          <Sparkline values={[]} label="示例走势：没有数据" />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。线色按头尾比：涨跌色跟涨跌配色走，持平用中性灰。</p>
    </>
  )
}

export function GaugeBarDemo() {
  return (
    <>
      <Row name="有位置、有档位词">
        <div className="gal-wide" data-gallery-gauge="ok">
          <GaugeBar label="示例比率" value="72.00%" share={0.72} level="偏热" note="示例：甲数 / (甲数 + 乙数)" />
        </div>
      </Row>
      <Row name="取不到">
        <div className="gal-wide" data-gallery-gauge="missing">
          <GaugeBar label="示例比率" value="还没有数据" unavailable share={null} />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。share 越界按边画；null 不画填充。</p>
    </>
  )
}

type Tile = { name: string; change: number }
const TREE: readonly TreemapItem<Tile>[] = [
  { group: '板块一', size: 600, data: { name: '示例 A', change: 0.031 } },
  { group: '板块一', size: 300, data: { name: '示例 B', change: -0.012 } },
  { group: '板块二', size: 220, data: { name: '示例 C', change: 0 } },
  { group: '板块二', size: 180, data: { name: '示例 D', change: -0.029 } },
  { group: '板块三', size: 120, data: { name: '示例 E', change: 0.018 } },
]

export function TreemapDemo() {
  const [drill, setDrill] = useState<string | null>(null)
  const shown = drill === null ? TREE : TREE.filter((item) => item.group === drill)
  const blocks = layoutTreemap(shown, drill === null)
  return (
    <>
      <div className="gal-wide" data-gallery-treemap style={{ maxWidth: 640 }}>
        <Treemap
          blocks={blocks}
          heads={drill === null}
          describe={(item) => ({
            name: item.name,
            text: `${item.change >= 0 ? '+' : ''}${(item.change * 100).toFixed(2)}%`,
            change: item.change,
          })}
          legendText={(step) => `${step > 0 ? '+' : ''}${step}%`}
          onGroup={setDrill}
          toolbar={
            drill !== null ? (
              <Button size="sm" onClick={() => setDrill(null)}>
                返回全部
              </Button>
            ) : null
          }
        />
      </div>
      <p className="gal-note">{SAMPLE}。点板块名下钻到那个板块；格子够大才写字；色例两端是 ±3%。</p>
    </>
  )
}

export function PriceTagDemo() {
  return (
    <>
      <Row name="涨 · 跌 · 平">
        <PriceTag name="示例甲" price="11.80" change="+18.00%" tone="up" />
        <PriceTag name="示例乙" price="10.20" change="-15.00%" tone="down" />
        <PriceTag name="示例丙" price="10.00" change="0.00%" tone="flat" />
      </Row>
      <Row name="夹在一句话里">
        <p data-gallery-inline style={{ margin: 0 }}>
          今日示例：
          <PriceTag price="11.80" change="+18.00%" tone="up" />
          ，比昨日高。
        </p>
      </Row>
      <p className="gal-note">{SAMPLE}。</p>
    </>
  )
}

export function QuoteCardDemo() {
  const [picked, setPicked] = useState('—')
  return (
    <>
      <Row name="单张">
        <div data-gallery-card style={{ width: 220 }}>
          <QuoteCard
            name="示例甲"
            symbol="AAA"
            price="11.80"
            change="+1.80"
            percent="+18.00%"
            tone="up"
            spark={rise}
            sparkLabel="示例走势"
            footer={<RangeBar low={10} high={12} value={11.8} label="示例当日区间" lowLabel="低" highLabel="高" />}
          />
        </div>
        <div data-gallery-card-link style={{ width: 220 }}>
          <QuoteCard
            name="示例乙"
            symbol="BBB"
            price="10.20"
            change="-1.80"
            percent="-15.00%"
            tone="down"
            onSelect={() => setPicked('示例乙')}
          />
        </div>
        <output data-gallery-picked>选中：{picked}</output>
      </Row>
      <Row name="一排">
        <div className="gal-wide" data-gallery-strip style={{ maxWidth: 420 }}>
          <QuoteStrip label="示例报价条" items={cards.map((card) => ({ ...card, sparkLabel: '示例走势' }))} />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。给了 onSelect 整张卡是一个按钮；一排放不下就横向滚动。</p>
    </>
  )
}

export function RangeBarDemo() {
  return (
    <>
      <Row name="区间中的位置">
        <div className="gal-wide" data-gallery-range="mid">
          <RangeBar low={9.5} high={12.5} value={11.8} label="示例当日区间" lowLabel="最低" highLabel="最高" />
        </div>
      </Row>
      <Row name="贴边（现价在区间外）">
        <div className="gal-wide" data-gallery-range="edge">
          <RangeBar low={9.5} high={12.5} value={13} label="示例越界" />
        </div>
      </Row>
      <Row name="最高等于最低（不画标记）">
        <div className="gal-wide" data-gallery-range="none">
          <RangeBar low={10} high={10} value={10} label="示例无区间" />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。标记按弹簧滑到新位置。</p>
    </>
  )
}

const ZONES = ['强烈卖出', '卖出', '中性', '买入', '强烈买入'] as const

export function RatingGaugeDemo() {
  const [score, setScore] = useState(0.3)
  return (
    <>
      <Row name="评级">
        <div data-gallery-rating>
          <RatingGauge score={score} zones={ZONES} label="示例评级">
            <span>卖出 4</span>
            <span>中性 9</span>
            <span>买入 13</span>
          </RatingGauge>
        </div>
      </Row>
      <Row name="换分数">
        {[-1, -0.5, 0, 0.5, 1].map((value) => (
          <Button key={value} size="sm" data-gallery-score={value} onClick={() => setScore(value)}>
            {value}
          </Button>
        ))}
      </Row>
      <p className="gal-note">{SAMPLE}。分数 −1 到 +1 平分五段；指针用 gentle 弹簧转过去。</p>
    </>
  )
}

export function QuoteTableDemo() {
  const [opened, setOpened] = useState('—')
  return (
    <>
      <div className="gal-wide" data-gallery-qtable style={{ maxWidth: 520 }}>
        <QuoteTable
          label="示例分组"
          columns={{ name: '名称', trend: '走势', price: '最新价', change: '涨跌幅' }}
          empty="这一组没有品种"
          onRow={(row) => setOpened(row.name)}
          groups={[
            {
              id: 'g1',
              label: '示例一组',
              rows: cards.slice(0, 3).map((card) => ({ ...card, sparkLabel: '示例走势' })),
            },
            { id: 'g2', label: '示例二组', rows: cards.slice(3).map(({ spark: _spark, ...row }) => row) },
            { id: 'g3', label: '空的一组', rows: [] },
          ]}
        />
      </div>
      <output data-gallery-opened>点开：{opened}</output>
      <p className="gal-note">{SAMPLE}。页签切组；行可点（回车也行）。</p>
    </>
  )
}

// 行快捷操作（#23）的单独演示：三行普通列表，悬停或 Tab 进去按钮条浮出；代码是示例，不是行情。
export function RowActionsDemo() {
  const [log, setLog] = useState('')
  return (
    <div className="gal-wide" style={{ maxWidth: 420 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} data-testid="row-actions-list">
        {['ALFA', 'BRAV', 'CHAR'].map((code) => (
          <li
            key={code}
            className="k-row-host"
            style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 8px', fontSize: 12 }}
          >
            <span>{code}</span>
            <RowActions items={demoSymbolActions(code, setLog)} label={`${code} actions`} />
          </li>
        ))}
      </ul>
      <ActionLog text={log} />
    </div>
  )
}
