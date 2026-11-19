// SPDX-License-Identifier: MIT
// 「设计决策」三页（2026-11-19，用户：设计系统第五层是「什么时候用什么」，我们还不够）：跨组件的选法，一行一个判断。
// 每个组件页上的「怎么用 / 不要用」只管它自己；这里管「几个件里选哪个」。件名链到它的页。标「新定」的是这次才写下的规则，用户可否决。

import { Fragment, type ReactNode } from 'react'
import { Lede, Table } from './foundations-more'

const C = ({ id, children }: { id: string; children: ReactNode }) => <a href={`#/${id}`}>{children}</a>

function ChoosingChartPage() {
  return (
    <>
      <Lede>按「用户想回答什么问题」选图，不按手头有什么数据选。先过下面三问，再查表。</Lede>
      <h2>先问三件事</h2>
      <ul className="gal-list">
        <li>
          要读准一个数，还是看形状？读准数不用图：用读数（<C id="lcd">Lcd</C>、<C id="price-tag">PriceTag</C>）或表（
          <C id="data-grid">DataGrid</C>）。
        </li>
        <li>有没有时间轴？有，查「随时间」；没有，查「同一时刻」。</li>
        <li>几个对象？1 个、2–12 个、更多，各有不同的件；超过一屏放得下的数量就换成表或热力图。</li>
      </ul>
      <h2>随时间</h2>
      <Table
        head={['想回答', '用', '别用']}
        rows={[
          [
            '这一个量最近怎么走（放在行里、卡里）',
            <Fragment key="cell">
              <C key="sparkline" id="sparkline">
                Sparkline
              </C>
              ；要品种头用{' '}
              <C key="mini-chart" id="mini-chart">
                MiniChart
              </C>
              ；要较前期的变化用{' '}
              <C key="metric-card" id="metric-card">
                MetricCard
              </C>
            </Fragment>,
            '行里放带坐标轴的大图',
          ],
          [
            '一条长序列，要拖着窗口看某一段',
            <C key="brush-chart" id="brush-chart">
              BrushChart
            </C>,
            'Sparkline（它不能缩放）',
          ],
          [
            '策略赚了多少、回撤多深',
            <Fragment key="cell">
              <C key="equity-curve" id="equity-curve">
                EquityCurve
              </C>
              ；整份回测用{' '}
              <C key="strategy-report" id="strategy-report">
                StrategyReport
              </C>
            </Fragment>,
            '只画权益线不画回撤',
          ],
          [
            '2–12 个品种的走势并排比',
            <C key="small-multiples" id="small-multiples">
              SmallMultiples
            </C>,
            '十几条线叠在一张图上',
          ],
          [
            '十几个以上品种，只看谁强谁弱、何时转向',
            <C key="horizon-chart" id="horizon-chart">
              HorizonChart
            </C>,
            'SmallMultiples（一屏放不下）',
          ],
          [
            '一组指标，点一个展开看它的序列',
            <C key="series-explorer" id="series-explorer">
              SeriesExplorer
            </C>,
            '每个指标各开一个面板',
          ],
          [
            '每天的收益或事件，按月历看',
            <C key="calendar-heatmap" id="calendar-heatmap">
              CalendarHeatmap
            </C>,
            '折线（看不出星期与月份的规律）',
          ],
          [
            '宏观数据当时知道的是多少（有修订）',
            <C key="vintage-series" id="vintage-series">
              VintageSeries
            </C>,
            '普通折线（会把后来的修订当成当时已知）',
          ],
          [
            '历史被分成了哪几种市场状态',
            <Fragment key="cell">
              <C key="regime-strip" id="regime-strip">
                RegimeStrip
              </C>
              ，叠在任一时间轴下面
            </Fragment>,
            '用涨跌色给状态上色（状态是类别，不是好坏）',
          ],
        ]}
      />
      <h2>同一时刻</h2>
      <Table
        head={['想回答', '用', '别用']}
        rows={[
          [
            '全市场谁涨谁跌、按行业看',
            <C key="market-heatmap" id="market-heatmap">
              MarketHeatmap
            </C>,
            '几千行的表',
          ],
          [
            '一个整体由哪些部分组成、各占多大',
            <C key="treemap" id="treemap">
              Treemap
            </C>,
            '饼图、环图（库里没有，也不加）',
          ],
          [
            '同一批品种换着维度分组看（行业、市场、因子分位）',
            <C key="symbol-galaxy" id="symbol-galaxy">
              SymbolGalaxy
            </C>,
            'Treemap（切分组时格子会跳，看不出谁去了哪）',
          ],
          [
            '这段时间的盈亏从哪来',
            <C key="attribution-bars" id="attribution-bars">
              AttributionBars
            </C>,
            '堆叠柱',
          ],
          [
            '钱从哪流到哪、各有多少',
            <C key="flow-sankey" id="flow-sankey">
              FlowSankey
            </C>,
            'TransmissionChain（它不表达数量）',
          ],
          [
            '因果怎么传导、哪一环有证据',
            <C key="transmission-chain" id="transmission-chain">
              TransmissionChain
            </C>,
            'FlowSankey（它不表达验证状态）',
          ],
          [
            '几组的分布差在哪（位置、宽窄、形状）',
            <C key="ridgeline" id="ridgeline">
              Ridgeline
            </C>,
            '只比均值的柱状图',
          ],
          [
            '因子分层后各层的累计收益',
            <C key="quantile-layers" id="quantile-layers">
              QuantileLayers
            </C>,
            '给各层上类别色或涨跌色（层号是序数）',
          ],
          [
            '在全体的分布上框一个筛选区间',
            <C key="range-histogram-slider" id="range-histogram-slider">
              RangeHistogramSlider
            </C>,
            '两个数字框（看不到区间里有多少只）',
          ],
          [
            '调整前后每一项变了多少',
            <C key="slope-chart" id="slope-chart">
              SlopeChart
            </C>,
            '两张并排的柱状图',
          ],
          [
            '一个对象在两个量之间怎么走（波动对收益）',
            <C key="connected-scatter" id="connected-scatter">
              ConnectedScatter
            </C>,
            '双轴折线',
          ],
          [
            '哪组参数最好、周围稳不稳',
            <C key="param-scatter" id="param-scatter">
              ParamScatter
            </C>,
            '只列最优的那一行',
          ],
        ]}
      />
      <h2>一个数的位置</h2>
      <Table
        head={['想回答', '用']}
        rows={[
          [
            '现价在当日或 52 周区间的哪里',
            <C key="range-bar" id="range-bar">
              RangeBar
            </C>,
          ],
          [
            '这个数算高还是低（带档位词与来历）',
            <C key="gauge-bar" id="gauge-bar">
              GaugeBar
            </C>,
          ],
          [
            '综合评级偏买还是偏卖',
            <C key="rating-gauge" id="rating-gauge">
              RatingGauge
            </C>,
          ],
          [
            '进度、负载、敞口用了多少',
            <C key="meter" id="meter">
              Meter
            </C>,
          ],
          [
            '各周期各涨跌多少',
            <C key="performance-strip" id="performance-strip">
              PerformanceStrip
            </C>,
          ],
          [
            '数据源或连接这段时间稳不稳',
            <C key="uptime-bars" id="uptime-bars">
              UptimeBars
            </C>,
          ],
          [
            '订单流此刻偏哪边',
            <C key="flow-gauges" id="flow-gauges">
              FlowGauges
            </C>,
          ],
        ]}
      />
      <h2>每张图都一样的部分</h2>
      <ul className="gal-list">
        <li>
          颜色、网格、轴、十字线、数字的字，照 <C id="dataviz">数据可视化</C> 那页，不在各图里另定。
        </li>
        <li>新定：图例放右上或线的末端，不放图下面；一张图最多 7 个系列，再多合进「其他」或换成 SmallMultiples。</li>
        <li>新定：扫读（指针或 ←→）出的读数用同一个 LCD 提示，位置跟着十字线，不遮住最新一根。</li>
        <li>新定：纵轴默认不从 0 起（价格、指数），柱状与面积图必须从 0 起。</li>
        <li>
          <C id="dither-chart">DitherChart</C> 只作装饰，不可取值；要读数的地方不用它。
        </li>
        <li>
          <C id="limit-ladder">LimitLadder</C> 是 A 股专有，别的市场不用。
        </li>
      </ul>
      <h2>库里没有的</h2>
      <ul className="gal-list">
        <li>K 线主图不在这个包里（在应用的图表包）；这里的图都是分析图。</li>
        <li>深度图、订单表、成交明细还没有，见下单面板那一批的后续票。</li>
      </ul>
    </>
  )
}

function ChoosingContainerPage() {
  return (
    <>
      <Lede>同样一批数，放成读数、卡片还是表，按「有几项、是不是同一种东西、要不要排序」定。</Lede>
      <h2>按数量与结构</h2>
      <Table
        head={['情况', '用', '理由']}
        rows={[
          [
            '1 个数，是这块的主角',
            <Fragment key="cell">
              <C key="lcd" id="lcd">
                Lcd
              </C>
              ；夹在句子里用{' '}
              <C key="price-tag" id="price-tag">
                PriceTag
              </C>
            </Fragment>,
            '一眼读完，不需要外框',
          ],
          [
            '2–5 个关键数，各自独立',
            <Fragment key="cell">
              <C key="metric-card" id="metric-card">
                MetricCard
              </C>
              （tile 一行最多 5 个）
            </Fragment>,
            '每个数配自己的小走势与变化',
          ],
          [
            '一个品种的十来项指标，不排序',
            <C key="key-stats" id="key-stats">
              KeyStats
            </C>,
            '三列网格，标签在上、数在下',
          ],
          [
            '6 行以上同一种记录，要排序、筛选、改列',
            <C key="data-grid" id="data-grid">
              DataGrid
            </C>,
            '新定：到 6 行就用表，不用卡片墙',
          ],
          [
            '一列品种的行情，要盯着跳动',
            <Fragment key="cell">
              <C key="watchlist" id="watchlist">
                Watchlist
              </C>
              ；分组带页签用{' '}
              <C key="quote-table" id="quote-table">
                QuoteTable
              </C>
            </Fragment>,
            '只闪变了的尾数，行高固定',
          ],
          [
            '一个品种一张卡、横着排一行',
            <C key="quote-card" id="quote-card">
              QuoteCard
            </C>,
            '放不下横向滚动',
          ],
          [
            '同业几家并排比',
            <C key="peer-cards" id="peer-cards">
              PeerCards
            </C>,
            '带翻页与「加入对比」',
          ],
          [
            '按时间先后的一串事件',
            <Fragment key="cell">
              <C key="event-timeline" id="event-timeline">
                EventTimeline
              </C>
              ；带正文的用{' '}
              <C key="news-feed" id="news-feed">
                NewsFeed
              </C>
            </Fragment>,
            '按自然日分组，新的在前',
          ],
        ]}
      />
      <h2>规则</h2>
      <ul className="gal-list">
        <li>
          没有数据摆 <C id="empty-state">EmptyState</C>，写清缺什么、下一步点哪；不画假数据，不留空白格。
        </li>
        <li>新定：一个面板里卡片与表不混排在同一层；要么上面一行 KPI 卡、下面一张表，要么只有一种。</li>
        <li>新定：表里的涨跌、盈亏列才上涨跌色，其余列一律中性色；整行不着色。</li>
        <li>数字列右对齐、等宽数字；文字列左对齐；单位写在列头，不在每格重复。</li>
      </ul>
    </>
  )
}

function ChoosingOverlayPage() {
  return (
    <>
      <Lede>按「打不打断用户、里面有没有要操作的东西」选。能原地展开就不弹，能不打断就不用模态。</Lede>
      <Table
        head={['情况', '用', '别用']}
        rows={[
          [
            '一句短说明，悬停或聚焦时看',
            <C key="tooltip" id="tooltip">
              Tooltip
            </C>,
            '在里面放链接或按钮',
          ],
          [
            '悬停预览一个品种或一个人的补充信息',
            <C key="hover-card" id="hover-card">
              HoverCard
            </C>,
            '放必须操作的东西（键盘与触屏够不着）',
          ],
          [
            '点开一张小卡，里面有一个主动作',
            <C key="rich-popover" id="rich-popover">
              RichPopover
            </C>,
            'HoverCard',
          ],
          [
            '点开一块设置或筛选，改完就关',
            <C key="popover" id="popover">
              Popover
            </C>,
            'Dialog（不需要打断整页）',
          ],
          [
            '一串命令里选一个',
            <Fragment key="cell">
              <C key="dropdown-menu" id="dropdown-menu">
                DropdownMenu
              </C>
              ；对着某个对象用{' '}
              <C key="context-menu" id="context-menu">
                ContextMenu
              </C>
              ；要搜索用{' '}
              <C key="command" id="command">
                Command
              </C>
            </Fragment>,
            'Popover 里手排一列按钮',
          ],
          [
            '不处理就不能继续（确认、必填的短表单）',
            <C key="dialog" id="dialog">
              Dialog
            </C>,
            '用它展示只读的信息',
          ],
          [
            '较长的表单或详情，还想看着后面的页',
            <C key="sheet" id="sheet">
              Sheet
            </C>,
            'Dialog 里放要滚动好几屏的内容',
          ],
          [
            '事情做完了、出错了，告诉一声',
            <C key="toast" id="toast">
              Toast
            </C>,
            '要用户必须回应的事',
          ],
          [
            '这一块一直成立的提醒',
            <C key="alert" id="alert">
              Alert
            </C>,
            'Toast（它会消失）',
          ],
          [
            '表单里的次要项（下单面板的止盈止损）',
            <Fragment key="cell">
              勾选或{' '}
              <C key="collapsible" id="collapsible">
                Collapsible
              </C>{' '}
              原地展开
            </Fragment>,
            '弹窗',
          ],
          [
            '删一行这类可重做的危险动作',
            <Fragment key="cell">
              <C key="delete-button" id="delete-button">
                DeleteButton
              </C>
              ，原地出确认
            </Fragment>,
            '确认对话框',
          ],
          [
            '全平、全撤、停策略这类不可撤的动作',
            <C key="hold-to-confirm" id="hold-to-confirm">
              HoldToConfirm
            </C>,
            '单击就触发，或只弹一个「确定」',
          ],
        ]}
      />
      <h2>规则</h2>
      <ul className="gal-list">
        <li>弹层不套弹层：Dialog 里可以开菜单与下拉，不再开第二个 Dialog 或 Sheet。</li>
        <li>浮层共用同一块材质（底色、描边、阴影），不在各件里另调。</li>
        <li>新定：行情在跳的时候不弹模态；下单确认之外，交易路径上的提示一律用 Toast 或原地的 Alert。</li>
      </ul>
    </>
  )
}

export const DECISION_PAGES = {
  'choosing-chart': { title: '选图', section: 'decisions', Body: ChoosingChartPage },
  'choosing-container': { title: '读数、卡片还是表', section: 'decisions', Body: ChoosingContainerPage },
  'choosing-overlay': { title: '弹层怎么选', section: 'decisions', Body: ChoosingOverlayPage },
} as const
