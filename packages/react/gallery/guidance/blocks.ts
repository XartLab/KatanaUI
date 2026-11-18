// SPDX-License-Identifier: MIT
// 积木组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const blocks: GuidanceMap = {
  'attribution-bars': {
    aliases: ['Contribution bars', 'P&L attribution', 'Diverging bar chart', 'Contribution chart'],
    use: ['回答「谁贡献了多少」：按策略、品种、账户拆当期盈亏。', '正负贡献并排比大小，不关心累计过程。'],
    avoid: ['要看逐步累计的路径，用 equity-curve。', '要看随时间变化的拆分，用 small-multiples。'],
    a11y: [
      '外层是 figure，读屏名取自 label；行列表带 aria-label。',
      '右上角第一个按钮切到表格视图，数据没有只靠图形表达。',
      '悬停才出的 tooltip，键盘聚焦一行也会出。',
    ],
  },
  'small-multiples': {
    aliases: ['Trellis chart', 'Facet grid', 'Panel chart', 'Sparkline grid'],
    use: ['同一类曲线放一排，扫一眼看谁不一样。', '用 shared 刻度时直接比各张的高低。'],
    avoid: ['几十张以上，用 horizon-chart 或表格里的 sparkline。', '只有一条曲线，用 equity-curve。'],
    a11y: [
      '外层是 figure，格阵是 role=group，读屏名取自 label。',
      '每张的标题是按钮，读屏名取自标题文字。',
      '扫读的读数行是 aria-live=polite，会念当前格的值。',
      'svg 本身对读屏隐藏。',
    ],
  },
  'series-explorer': {
    aliases: ['Time series explorer', 'Metric explorer', 'Chart with range selector', 'Performance chart'],
    use: [
      '一组指标各有一条时间序列，点开一个看细节。',
      '要在同一窗口里切区间、对比上一期、对账。',
      '标题下的元信息行（名 · RUN 编号 · 区间 · 币种）用点阵字 --font-dot（Doto + 方舟像素子集），像仪器铭牌；读数、事件、标注用 --font-num（2026-11-18）。',
    ],
    avoid: ['只看一条线，用 equity-curve。', '要在时间窗上画选区，用 brush-chart。'],
    a11y: [
      '图上是 role=slider，aria-valuetext 念「日期 值」，读屏名取自 labels.chart。',
      '指标瓦片是按钮，展开状态用 aria-expanded。',
      '明细表是 role=region 且可聚焦，读屏名取自 labels.table。',
      '右上角第一个按钮切到明细表，图里的数在表里都有。',
    ],
  },
  'data-grid': {
    aliases: ['Table', 'Data table', 'Grid', 'Spreadsheet'],
    use: [
      '逐行的行情、持仓、委托，要排序、选中、复制导出。',
      '列要能调宽、隐藏、固定、存成视图。',
      '一行下面要挂一小段说明或表单（子行）。',
      '双击列头右缘或右键「适应内容」：列宽取列头与前 1000 行最宽格子，24–480px；自画列（cell、render、custom）不改宽。',
      '「全部列适应内容」优先走 onLayoutChange；只给 onResize 时 setter 要用函数式更新。',
      '实时刷新：live 为 true 时数值类列（price、quantity、pnl、change、number）值变了闪涨跌色，文本列不闪；排序顺序变了已渲染的行平滑换位，新增的行蓝线高亮 1.2 秒；默认 false，静态表不闪。',
    ],
    avoid: [
      '几行静态数据，用 interactive=false 的只读表或 strategy-report 里的表。',
      '需要拖动编辑单元格的电子表格，这里不做。',
    ],
    a11y: [
      '可交互时是 grid，有子行时是 treegrid，只读是 table；行列号用 aria-rowindex / aria-rowcount。',
      '键盘所在行用 aria-activedescendant，整张表只占一个 Tab 停靠点。',
      '排序列带 aria-sort；列宽拖柄是带名字的 separator。',
      '读屏名取自 label。',
    ],
  },
  'empty-state': {
    aliases: ['Zero state', 'Blank slate', 'No data', 'Placeholder'],
    use: ['面板里没有连接、没选品种或没有数据时。', '空态要带一个下一步的动作，比如去连接。'],
    avoid: ['数据在加载，用 loading。', '操作出错了，用 alert。'],
    a11y: [
      '根节点是 role=status，出现时读屏会念标题与说明。',
      '标题是 h3，注意放进去后的标题层级。',
      '点阵标签是纯文字装饰，不带语义。',
    ],
  },
  'panel-frame': {
    aliases: ['Panel', 'Card', 'Widget frame', 'Window chrome'],
    use: ['工作区里每个面板的外壳：标题栏、折叠、联动色点。', '要统一面板的边框、焦点和折叠样子。'],
    avoid: ['页面内的普通分块，直接用间距与 separator。', '弹出的浮层，用 dialog 或 popover。'],
    a11y: [
      '外壳是 section，标题栏是 header。',
      '折叠按钮带 aria-expanded 与 aria-controls，读屏名随状态在 expandLabel / collapseLabel 间换。',
      '焦点四角括号是装饰，对读屏隐藏。',
    ],
  },
  'status-bar': {
    aliases: ['Footer bar', 'Status line', 'Info bar', 'Bottom bar'],
    use: [
      '窗口底部常驻的连接、时钟、实盘等读数。',
      '宽度不够时按优先级把次要项收进「…」；每项宽度按字体预先算，不渲染量尺。',
      '数值变了闪涨跌色；灯的状态或文字变了（断线、重连）整项闪一次：变坏警示色，变好涨色。',
    ],
    avoid: ['需要提醒用户的事件，用 toast 或 alert。', '要放大量指标，用 system-monitor。'],
    a11y: [
      '外层是 role=group，读屏名取自 label。',
      '可点的项是 button，纯读数不是控件。',
      '「…」按钮的读屏名取自 moreLabel。',
    ],
  },
  'workspace-tabs': {
    aliases: ['Document tabs', 'Editor tabs', 'Browser tabs', 'Workspace switcher'],
    use: [
      '多个工作区或布局之间切换，用户会新建、关闭、排序。',
      '标签多到放不下时，自动收进「…」；标签宽按字体预先算，单个最宽 200px。',
    ],
    avoid: ['固定的几个视图，用 tabs。', '站内导航，用 side-nav。'],
    a11y: [
      'role=tablist，每个标签是 role=tab，选中项带 aria-selected。',
      '读屏名取自标签文字；新建与「…」按钮的名字取自 createLabel、moreLabel。',
    ],
  },
  toolbar: {
    aliases: ['Action bar', 'Command bar', 'Button group', 'Icon toolbar'],
    use: ['面板头里放一排图标按钮，整条只占一个 Tab 停靠点。', '空间不够时把次要按钮折叠进溢出菜单。'],
    avoid: ['放输入框或表单，用 filter-bar。', '一个孤立的按钮，直接用 button。'],
    a11y: [
      '容器是 role=toolbar，读屏名取自 label。',
      '图标按钮的读屏名取自 label，按下状态用 aria-pressed。',
      '悬停提示也带名字，键盘聚焦同样会出。',
    ],
  },
  'estimate-badge': {
    aliases: ['Estimated tag', 'Approximation marker', 'Caveat label', 'Warning tag'],
    use: ['数值是按规则估出来的，不是真实成交，比如按 K 线估算。', '悬停要给出估算依据。'],
    avoid: ['数据本身有问题，用 alert。', '一般的状态标签，用 tag（它就是 Tag 的 warn 描边档）。'],
    a11y: [
      '就是一个 span（Tag），读屏名是它的文字，没有额外角色。',
      '依据放在 title 里，触屏与读屏未必读到；关键规则请同时写进正文。',
    ],
  },
  'column-set-tabs': {
    aliases: ['Column presets', 'View tabs', 'Saved views', 'Column layout tabs'],
    use: ['表头上一排预设列集，一键切换常用的列组合。', '和 data-grid 配合，当前列集由列推出来。'],
    avoid: ['逐列自定义，用 data-grid 的列选择器（ColumnPicker）。', '切换无关的视图，用 tabs。'],
    a11y: [
      'role=tablist，每个集是 role=tab，选中项带 aria-selected。',
      '读屏名取自列集名，整行的名字取自 label。',
      '手动改过列后没有标签选中。',
    ],
  },
  'news-reader': {
    aliases: ['Article view', 'Reading pane', 'Detail pane', 'News detail'],
    use: [
      '在 news-feed 里点一条，右边展开全文与要点。',
      '要点出关联品种，并可点进去。',
      '阅读中的这一条被更新（标题、要点或 version 变了）时，标题亮一次蓝色提示（新信息不是警告，不用琥珀）并标「已更新」（labels.updated）；不传这句话就不闪不标。',
    ],
    avoid: ['要滚动看一串消息，用 news-feed。', '要翻译或取数，这里不做，由调用方传文字。'],
    a11y: [
      '外层是 article，读屏名取自 labels.reader。',
      '这一条被更新时，一个 role=status、aria-live=polite 的隐藏播报读「已更新」，不重读全文。',
      '要点列表是带名字的 section，图标按钮的读屏名取自 labels。',
      '品种标签是按钮，读屏名取自品种文字。',
    ],
  },
  'news-feed': {
    aliases: ['Activity feed', 'Ticker', 'Newsfeed', 'Live stream'],
    use: [
      '实时滚入的消息流，要筛选、暂停、搜索。',
      '用户滚离顶部时不被新消息打断。',
      '新消息到达：用户在顶部时直接插入并高亮 1.2 秒，滚离顶部（或已暂停）只在顶上计数「n 条新消息」，点了再合入、高亮并回到顶部；列表与卡片一样，虚拟列表插入时看着的那条不动。',
      '列表标题最多折两行；超过 50 条自动虚拟滚动，行高按标题折行预先算，滚动不跳。',
    ],
    avoid: ['要读全文，点进 news-reader。', '几万条以上的历史，要分段加载。'],
    a11y: [
      '外层是 section，读屏名取自 labels.feed。',
      '新消息到达由一个 role=status、aria-live=polite 的隐藏播报读条数（labels.newItems），不逐条读。',
      '暂停按钮带 aria-pressed，折叠按钮带 aria-expanded。',
      '重要条目的琥珀方块读屏名是「重要」，不只靠颜色。',
      '时间悬停给绝对时间。',
      '虚拟滚动时每行带 aria-setsize、aria-posinset，读屏知道总条数。',
    ],
  },
  'transmission-chain': {
    aliases: ['Causal graph', 'Impact chain', 'Dependency graph', 'Flow diagram'],
    use: ['画假说里一环扣一环的传导，看哪条边有证据、哪条会失效。', '点一个节点，聚焦它的上下游。'],
    avoid: ['只画资金或量的流向，用 flow-sankey。', '要画层级关系，用 tree-view。'],
    a11y: [
      '外层是 role=group，读屏名取自 labels.chain。',
      '节点与边是 role=button，带 aria-pressed；边的读屏名写出两端、状态与计数。',
      '右侧详情是 aria-live=polite，选中后会念。',
      '状态用颜色加图标与文字，不只靠颜色。',
    ],
  },
  'strategy-report': {
    aliases: ['Backtest report', 'Performance summary', 'Tear sheet', 'Strategy tester report'],
    use: ['回测完看概览、绩效、交易分析与逐笔列表。', '多空分开看，指标由逐笔平仓现算。'],
    avoid: ['只看净值曲线，用 equity-curve。', '实盘的运行监控，用 system-monitor。'],
    a11y: [
      '外层是 section，读屏名取自 labels.report；页签用 line 样式的 Tabs，多空切换是带名字的 toggle-group。',
      '直方图的每根柱是 role=img，读屏名写出区间与笔数。',
      '指标用表格与 dl，读屏能逐项念。',
      '算不出的读数写「—」，不是 0。',
    ],
  },
  'hypothesis-ledger': {
    aliases: ['Hypothesis tracker', 'Idea log', 'Research log', 'Claim register'],
    use: ['记下每条研究假说、它的检验期限与证据，一眼看哪些快到期。', '人下结论后由调用方写回状态。'],
    avoid: ['要看传导关系，用 transmission-chain。', '给交易建议排队处理，用 decision-queue。'],
    a11y: [
      '外层是 section，读屏名取自 labels.ledger；列表是带名字的 ol。',
      '行展开按钮带 aria-expanded 与 aria-controls。',
      '时间用 time 元素，带机器可读的 dateTime。',
      '行的状态与倒计时是文字，不只是一盏灯。',
    ],
  },
  'decision-queue': {
    aliases: ['Approval queue', 'Inbox', 'Task queue', 'Recommendation list'],
    use: ['系统给出的建议要人逐条接受、拒绝或推后。', '接受不可撤，必须按住确认。'],
    avoid: ['系统自己执行、不需要人决定的事，用 system-monitor 看结果。', '纯展示的历史事件，用 event-timeline。'],
    a11y: [
      '外层是 section，读屏名取自 labels.queue；列表是带名字的 ol。',
      '接受按钮是 hold-to-confirm，读屏名写明要按住多久。',
      '展开与详情用 aria-expanded、aria-controls；时间用 time 元素。',
      '置信度条对读屏隐藏，数字在文字里。',
    ],
  },
  'system-monitor': {
    aliases: ['Health dashboard', 'Ops console', 'Status page', 'Monitoring panel'],
    use: ['看实盘系统的连接、额度、策略运行与近期事件。', '出问题时一眼看出哪条连接或哪个策略。'],
    avoid: ['窗口底部的几个读数，用 status-bar。', '长期历史走势，用 series-explorer。'],
    a11y: [
      '外层是 section，连接、指标、策略、事件各是带名字的 section。',
      '额度条是 role=meter，带 aria-valuenow 与 aria-valuetext。',
      '状态写字加图标，不只靠红、琥珀。',
      '时间用 time 元素。',
    ],
  },
  'event-timeline': {
    aliases: ['Timeline', 'Activity log', 'Session timeline', 'Audit trail'],
    use: [
      '按交易时段排下委托、成交等事件，看先后与聚集。',
      '想拖选一段，或切到表格逐条核对。',
      '新事件进来时对应标记（表格里是那一行）高亮 1.2 秒；「现在」线跟着传入的 now 走，调用方定时更新它。',
    ],
    avoid: ['要看行情或逐笔成交，用 data-grid。', '要读文字的消息流，用 news-feed。'],
    a11y: [
      '事件数「共 n 条」是 output（隐含 role=status、polite），新事件进来时读条数，不逐条读。',
      '外层是 role=region，读屏名取自 label；类别筛选是带名字的 group，按钮带 aria-pressed。',
      '标记是按钮，读屏名是「类别 名称」；悬停的 tooltip 是 role=tooltip。',
      '「切到表格」按钮给读屏一份逐条的数据。',
      '没有事件时是 role=status 的文字。',
    ],
  },
  'symbol-galaxy': {
    aliases: ['Bubble cluster', 'Packed bubbles', 'Cluster map', 'Universe map'],
    use: ['看一批品种按行业、风格等分成团，谁大谁小。', '切换分组方式，看点在团间迁移。'],
    avoid: ['要读精确的数，用 data-grid 或 treemap。', '只有一个分组，没有分团的意义。'],
    a11y: [
      '外层与每一团都是 role=group，读屏名取自 label 与团名加计数。',
      '键盘聚焦一团后，读数行写当前点的详情。',
      '画面里的 tooltip、图例与 canvas 对读屏隐藏，数据看读数行或表格视图。',
    ],
  },
  'swap-panel': {
    aliases: ['Swap', 'Currency converter', 'Convert widget', '兑换面板', '换汇'],
    use: ['外汇、币对的兑换：付出一栏、收到一栏、报价与有效期。', '报价要实时刷新、有时效的单对转换。'],
    avoid: ['一次比较多个币对用 QuoteTable。', '下单价格与数量的普通委托用普通表单。'],
    a11y: [
      '收到的数额 aria-live=polite，报价变了会读；倒计时圆环是 role=img，名字取 labels.expires。',
      '资产钮与翻转钮的读屏名取 labels（含 {side}、{symbol} 模板），文案全由调用方传。',
      '错误条 role=alert；quoting 时提交钮禁用，读屏读作「不可用」。',
    ],
  },
  'order-ticket': {
    aliases: ['Order entry', 'Order form', 'Trade ticket', 'Chart Trader', 'Trading Panel', '下单面板', '交易面板'],
    use: [
      '默认按成本填：填「放进去多少钱」，面板反推张数。名义价值 = 成本 ÷（1/杠杆 + 开仓费率 + 平仓费率）；例：10 USDT、100 倍、开平各 0.05% → 909.09 USDT，一张 600 USDT 时取 1.51 张，实际占用 9.966 USDT。',
      '成本默认含开仓费与预估平仓费（includeCloseFee 默认 true；待用户定：默认两边都含，还是只含开仓费）；只含开仓费时同例是 952.38 USDT、1.58 张。',
      '数量一律向下取整到最小步长，所以显示的总占用不会超过用户填的数。',
      '改杠杆时成本不变、仓位跟着变；换方向时清空止盈止损（它们在价格的另一边）。',
      '按风险填（ATAS Beta 8.0.16 的做法）：填最多亏多少与止损价，张数 = 风险 ÷ 每张在止损价出场的亏损（价差加开平两笔费）。',
      '止盈止损标明放在哪：交易所托管（面板关了也生效）或本机触发（进程不在就不生效；bit.com、QMT 属于这种）。',
      '出场模板（ATAS 的 Exit Strategy）存的是离入场价的百分比，选了按当前方向与价格填进两个框。',
      '现货、A 股不传 maxLeverage：没有杠杆与强平价，就是按金额买。',
    ],
    avoid: [
      '不参照 TradingView 的下单面板（用户 2026-11-19 定：它不算保证金与手续费，容易下错）。',
      '多级分批止盈、移动止损、保本上移还没做，需要时另开票，不要在调用方硬拼。',
      '币本位合约、全仓的精确强平价不在这个件的范围里。',
    ],
    a11y: [
      '买卖是一组 aria-pressed 的按钮，组名取 labels.side；选中的一边除了颜色还有文字，不只靠红绿。',
      '读数区 aria-live=polite，数量变了会读；报错行 role=alert，对应的框带 aria-invalid。',
      '滑杆下的 0 / 25 / 50 / 75 / 100% 是鼠标快捷点，不进 Tab 序（键盘用滑杆本身）。',
      '所有文字与读屏名由 labels 传，包里没有写死的语言。',
    ],
  },
  'position-calculator': {
    aliases: ['PnL calculator', 'Futures calculator', '计算器', '合约计算器'],
    use: [
      '只答三件事：赚或亏多少、强平价在哪、保本价多少；比 OKX 的计算器少，输入由调用方带入当前值。',
      '保本价含开平两笔费：多头 P(1+开)/(1−平)，空头 P(1−开)/(1+平)。',
      '强平价是逐仓近似：多头 P(1−1/L)/(1−m−f)，空头 P(1+1/L)/(1+m+f)，m 是维持保证金率、f 是平仓费率。',
    ],
    avoid: ['要在下单时看这些数，直接看 OrderTicket 的读数区，不必开弹窗。'],
    a11y: ['读数区 aria-live=polite；弹窗关上时焦点回到打开它的按钮（Dialog 的行为）。'],
  },
}

export default blocks
