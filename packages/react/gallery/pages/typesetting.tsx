// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import {
  DataGrid,
  DataGridHostProvider,
  NewsFeed,
  type DataGridHost,
  type GridColumn,
  type GridColumnLayout,
} from '../../src/blocks/index.ts'
import {
  Cluster,
  EmphasisProvider,
  GaugeBar,
  Grid,
  PriceTag,
  QuoteCard,
  Reel,
  Sidebar,
  Stack,
  Switcher,
  type Emphasis,
} from '../../src/index.ts'
import { NEWS_CHANNELS, NEWS_ITEMS, NEWS_LABELS, NEWS_NOW, NEWS_SOURCES } from './blocks.tsx'
import { Row } from './parts.tsx'

// 排版原语与分量（#115）的演示。块里的字、数全是示例，不是行情；块是为了让位置看得见才涂了底色，原语本身不画任何东西。

const SAMPLE = '示例数据，不是行情'

/** 演示用的色块：原语只管位置，要看见位置就得有东西占着。 */
function Block({ children, tall }: { children?: ReactNode; tall?: boolean }) {
  return (
    <div className="gal-block" data-tall={tall ? '' : undefined}>
      {children}
    </div>
  )
}

/** 可以横向拖宽窄的框（右下角的把手）：拖一拖看 Sidebar、Switcher、Grid 怎么变；静态预览里是固定宽度。 */
function Frame({ width, children, name }: { width: number; children: ReactNode; name: string }) {
  return (
    <div className="gal-frame-wrap">
      <span className="gal-frame-cap">{name}</span>
      <div className="gal-frame" style={{ width }}>
        {children}
      </div>
    </div>
  )
}

export function StackDemo() {
  return (
    <>
      <Row>
        {(['space-1', 'space-3', 'space-6'] as const).map((gap) => (
          <div key={gap} className="gal-cell">
            <Stack gap={gap} style={{ width: 140 }}>
              <Block>一</Block>
              <Block>二</Block>
              <Block>三</Block>
            </Stack>
            <small>{gap}</small>
          </div>
        ))}
      </Row>
      <p className="gal-note">间距只收刻度名（space-1、space-3、space-6 …），不收数字。</p>
    </>
  )
}

export function ClusterDemo() {
  const tags = ['涨停', '连板', '龙头', '首板', '一字', '回封', '炸板']
  return (
    <>
      <Row name="换行">
        <Cluster gap="space-2" style={{ width: 220 }}>
          {tags.map((tag) => (
            <Block key={tag}>{tag}</Block>
          ))}
        </Cluster>
      </Row>
      <Row name="两端对齐">
        <Cluster gap="space-2" justify="between" style={{ width: 320 }}>
          <Block>名称</Block>
          <Block>读数</Block>
        </Cluster>
      </Row>
      <Row name="基线对齐">
        <Cluster gap="space-2" align="baseline">
          <Block tall>大</Block>
          <Block>小</Block>
          <Block>中</Block>
        </Cluster>
      </Row>
    </>
  )
}

export function SidebarDemo() {
  const pair = (side: 'start' | 'end') => (
    <Sidebar side={side} sideWidth={120} gap="space-2">
      {side === 'start' ? <Block tall>窄</Block> : <Block tall>宽</Block>}
      {side === 'start' ? <Block tall>宽</Block> : <Block tall>窄</Block>}
    </Sidebar>
  )
  return (
    <>
      <Frame name="窄在前，容器 420" width={420}>
        {pair('start')}
      </Frame>
      <Frame name="窄在后，容器 420" width={420}>
        {pair('end')}
      </Frame>
      <Frame name="容器 200：放不下，上下叠" width={200}>
        {pair('start')}
      </Frame>
    </>
  )
}

export function SwitcherDemo() {
  const blocks = (
    <>
      <Block tall>甲</Block>
      <Block tall>乙</Block>
      <Block tall>丙</Block>
    </>
  )
  return (
    <>
      <Frame name="容器 480，阈值 360：一行" width={480}>
        <Switcher threshold={360} gap="space-2">
          {blocks}
        </Switcher>
      </Frame>
      <Frame name="容器 300，阈值 360：整体竖排" width={300}>
        <Switcher threshold={360} gap="space-2">
          {blocks}
        </Switcher>
      </Frame>
    </>
  )
}

export function GridDemo() {
  const cells = Array.from({ length: 5 }, (_, index) => <Block key={index} tall>{`格 ${index + 1}`}</Block>)
  return (
    <>
      <Frame name="容器 440，min 120：三列" width={440}>
        <Grid min={120} gap="space-2">
          {cells}
        </Grid>
      </Frame>
      <Frame name="容器 260，min 120：两列" width={260}>
        <Grid min={120} gap="space-2">
          {cells}
        </Grid>
      </Frame>
    </>
  )
}

export function ReelDemo() {
  return (
    <Frame name="容器 320，一行放不下：横向滚动" width={320}>
      <Reel aria-label="题材卡" gap="space-2">
        {['锂电', '光伏', '半导体', '算力', '机器人', '低空经济'].map((name) => (
          <div key={name} style={{ width: 96 }}>
            <Block tall>{name}</Block>
          </div>
        ))}
      </Reel>
    </Frame>
  )
}

const RISE = [10, 10.4, 10.2, 10.9, 11.3, 11.1, 11.8]

/** 读数类三件在三档下的样子，一档一列。 */
function ReadoutsAt({ emphasis }: { emphasis: Emphasis }) {
  return (
    <EmphasisProvider value={emphasis}>
      <Stack gap="space-2" data-emphasis-demo={emphasis}>
        <QuoteCard
          name="示例甲"
          symbol="AAA"
          price="11.80"
          change="+1.80"
          percent="+18.00%"
          tone="up"
          spark={RISE}
          sparkLabel="示例走势"
          footer={<span className="gal-note">区间 10.00 – 12.00</span>}
        />
        <PriceTag name="示例甲" price="11.80" change="+18.00%" tone="up" />
        <GaugeBar label="情绪" value="72" share={0.72} level="偏热" note="示例口径：规则评分，未校准" />
      </Stack>
    </EmphasisProvider>
  )
}

type Quote = {
  id: string
  name: string
  price: number
  change: number
  turnover: number
  turnoverRate: number
  amplitude: number
  pe: number
  volumeRatio: number
}
const QUOTES: readonly Quote[] = Array.from({ length: 8 }, (_, index) => ({
  id: `q${index}`,
  name: `示例${'甲乙丙丁戊己庚辛'[index]}`,
  price: 10 + index * 1.37,
  change: (index % 2 === 0 ? 1 : -1) * (0.4 + index * 0.35),
  turnover: 1.2e8 + index * 3.4e7,
  turnoverRate: 1.1 + index * 0.6,
  amplitude: 2.3 + index * 0.4,
  pe: 18 + index * 3.5,
  volumeRatio: 0.8 + index * 0.15,
}))
const QUOTE_COLUMNS: readonly GridColumn<Quote>[] = [
  { id: 'name', type: 'text', value: (row) => row.name, compact: true },
  { id: 'price', type: 'price', value: (row) => row.price, format: { precision: 2 } },
  { id: 'change', type: 'change', value: (row) => row.change, compact: true },
  // 八列的表（边栏放不下）：compact 只留名称加「涨跌幅」这个主数，standard 八列全出。
  { id: 'turnover', type: 'quantity', value: (row) => row.turnover },
  { id: 'turnoverRate', type: 'number', value: (row) => row.turnoverRate, format: { digits: 2 } },
  { id: 'amplitude', type: 'number', value: (row) => row.amplitude, format: { digits: 2 } },
  { id: 'pe', type: 'number', value: (row) => row.pe, format: { digits: 1 } },
  { id: 'volumeRatio', type: 'number', value: (row) => row.volumeRatio, format: { digits: 2 } },
]
const QUOTE_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 100, visible: true },
  { id: 'price', label: '最新', width: 80, visible: true },
  { id: 'change', label: '涨跌幅', width: 80, visible: true },
  { id: 'turnover', label: '成交额', width: 80, visible: true },
  { id: 'turnoverRate', label: '换手率', width: 72, visible: true },
  { id: 'amplitude', label: '振幅', width: 72, visible: true },
  { id: 'pe', label: '市盈率', width: 72, visible: true },
  { id: 'volumeRatio', label: '量比', width: 72, visible: true },
]

/** 文案由宿主给：compact 截掉行时表下面写「另有 N 行」。 */
const QUOTE_HOST: DataGridHost = { texts: { moreRows: (hidden) => `另有 ${hidden} 行` } }

function GridAt({ emphasis }: { emphasis: Emphasis }) {
  return (
    <EmphasisProvider value={emphasis}>
      <div style={{ height: emphasis === 'compact' ? 148 : 220, display: 'flex' }} data-emphasis-demo={emphasis}>
        <DataGridHostProvider value={QUOTE_HOST}>
          <DataGrid
            columns={QUOTE_COLUMNS}
            layout={QUOTE_LAYOUT}
            rows={QUOTES}
            rowId={(row) => row.id}
            label="示例行情"
          />
        </DataGridHostProvider>
      </div>
    </EmphasisProvider>
  )
}

function NewsAt({ emphasis }: { emphasis: Emphasis }) {
  return (
    <EmphasisProvider value={emphasis}>
      <div style={{ height: emphasis === 'compact' ? 140 : 300 }} data-emphasis-demo={emphasis}>
        <NewsFeed
          items={NEWS_ITEMS.slice(0, 4)}
          channels={NEWS_CHANNELS}
          sources={NEWS_SOURCES}
          now={NEWS_NOW}
          labels={NEWS_LABELS}
        />
      </div>
    </EmphasisProvider>
  )
}

const LEVELS: readonly { level: Emphasis; name: string }[] = [
  { level: 'hero', name: 'hero 主角' },
  { level: 'standard', name: 'standard 正文' },
  { level: 'compact', name: 'compact 一行' },
]

function ThreeLevels({ title, children }: { title: string; children: (level: Emphasis) => ReactNode }) {
  return (
    <section className="gal-levels" aria-label={title}>
      <h3 className="gal-levels-title">{title}</h3>
      <Grid min={300} gap="space-4">
        {LEVELS.map(({ level, name }) => (
          <Stack key={level} gap="space-1">
            <span className="gal-cap">{name}</span>
            {children(level)}
          </Stack>
        ))}
      </Grid>
    </section>
  )
}

export function EmphasisDemo() {
  return (
    <Stack gap="space-6">
      <ThreeLevels title="读数类：QuoteCard、PriceTag、GaugeBar">
        {(level) => <ReadoutsAt emphasis={level} />}
      </ThreeLevels>
      <ThreeLevels title="DataGrid：compact 不出表头、只留前 5 行，表下面写「另有 3 行」；八列的表 compact 只剩名称与主数两列">
        {(level) => <GridAt emphasis={level} />}
      </ThreeLevels>
      <ThreeLevels title="NewsFeed：compact 一行一条">{(level) => <NewsAt emphasis={level} />}</ThreeLevels>
      <p className="gal-note">{SAMPLE}。三档只改字号档、显示多少、要不要表头；颜色没变，密度（行高）也没变。</p>
    </Stack>
  )
}

/** 「这一块用哪档分量」：三档各什么时候用，件名链到组件页。 */
export function EmphasisGuideDemo() {
  const rows: readonly { level: Emphasis; title: string; when: string; parts: ReactNode }[] = [
    {
      level: 'hero',
      title: '主角',
      when: '这个区里用户第一眼要看的那一个数：指数、账户权益、当前品种的价。一个区里最多一处。',
      parts: (
        <>
          <a href="#/quote-card">QuoteCard</a>、<a href="#/price-tag">PriceTag</a>、<a href="#/gauge-bar">GaugeBar</a>
          （大数用 display 档，配迷你线）
        </>
      ),
    },
    {
      level: 'standard',
      title: '正文',
      when: '区里的主体内容，用户会读、会比、会点：完整的表、图、列表。不确定时用它，它也是不包 Provider 时的样子。',
      parts: (
        <>
          <a href="#/data-grid">DataGrid</a>、<a href="#/news-feed">NewsFeed</a>
          （完整的表头、筛选、行）
        </>
      ),
    },
    {
      level: 'compact',
      title: '一行',
      when: '边栏、列表项里、卡片的角落：看一眼就走，不需要读。标签加读数并排，表只留前几行，列表一行一条。',
      parts: (
        <>
          <a href="#/quote-card">QuoteCard</a>、<a href="#/gauge-bar">GaugeBar</a>（标签加读数并排）；
          <a href="#/data-grid">DataGrid</a>（不出表头、前 5 行、只剩名称与主数两列）；
          <a href="#/news-feed">NewsFeed</a>（时间加标题）
        </>
      ),
    },
  ]
  return (
    <>
      <table className="gal-decision">
        <thead>
          <tr>
            <th scope="col">档</th>
            <th scope="col">什么时候用</th>
            <th scope="col">哪些件认它</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.level}>
              <th scope="row">
                <code>{row.level}</code>
                <br />
                {row.title}
              </th>
              <td>{row.when}</td>
              <td>{row.parts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="gal-note">
        没接分量的件照 standard 画。选档看这一块在这个区里的重要程度，不看它摆在哪个位置；要改成别的档，改外面的
        EmphasisProvider，不要去改件。
      </p>
    </>
  )
}

/** 排版的四条规则，每条配一个小样。 */
export function LayoutRulesDemo() {
  return (
    <Stack gap="space-4" className="gal-rules">
      <section>
        <h3>1. 数字用等宽数字</h3>
        <Cluster gap="space-6">
          <span className="gal-num" data-tabular="">
            <span>1,111.11</span>
            <span>8,888.88</span>
          </span>
          <span className="gal-num">
            <span>1,111.11</span>
            <span>8,888.88</span>
          </span>
        </Cluster>
        <p className="gal-note">左边是等宽数字：位数对得齐，一眼看出大小。右边是比例数字，上下两行对不齐。</p>
      </section>
      <section>
        <h3>2. 数字右对齐，文字左对齐</h3>
        <table className="gal-align">
          <thead>
            <tr>
              <th scope="col">名称</th>
              <th scope="col">最新</th>
              <th scope="col">涨跌幅</th>
            </tr>
          </thead>
          <tbody>
            {QUOTES.slice(0, 3).map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.price.toFixed(2)}</td>
                <td>{`${row.change > 0 ? '+' : ''}${row.change.toFixed(2)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="gal-note">列头跟着本列：文字列靠左，数字列靠右，小数点上下对齐。</p>
      </section>
      <section>
        <h3>3. 块与块之间靠细线和留白，不加框</h3>
        <Stack gap="space-3" className="gal-hairlines">
          <Block>行情</Block>
          <hr />
          <Block>新闻</Block>
        </Stack>
        <p className="gal-note">分组靠间距（Stack、Cluster 的 gap）与 1px 细线；排版原语自己不画边框、不带底色。</p>
      </section>
      <section>
        <h3>4. 字号随分量走，不随位置乱改</h3>
        <Cluster gap="space-6" align="baseline">
          {LEVELS.map(({ level, name }) => (
            <EmphasisProvider key={level} value={level}>
              <PriceTag name={name} price="11.80" change="+18.00%" tone="up" />
            </EmphasisProvider>
          ))}
        </Cluster>
        <p className="gal-note">
          同一个件放在哪都按分量选字号档：想让它大一点，把分量调成 hero，不要在位置上给它单独写字号。
        </p>
      </section>
    </Stack>
  )
}
