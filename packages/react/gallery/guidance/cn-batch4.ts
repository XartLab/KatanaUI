// SPDX-License-Identifier: MIT
// A 股件包第 3 批（KatanaUI #260）的「怎么用 / 无障碍」。数据、口径与文字一律由调用方给（分钟线、分组汇总、矩阵的值与原因、估值历史）；
// 涨跌色只读语义色调，根上设 data-updown="cn" 得红涨绿跌；默认文案是英文，中文由调用方传 labels。
import type { GuidanceMap } from './types'

const cnBatch4: GuidanceMap = {
  'intraday-series': {
    aliases: ['分时图', '盘中走势', '分钟线', 'Intraday chart', 'Minute series'],
    use: [
      '盘中看一天里某个指标怎么走：涨停数、炸板率、涨跌家数、成交额；多条一起看，单位不同分左右轴。',
      '叠「昨日同时段」虚线对照今天快了还是慢了；量能用柱（kind: bar）。',
      '一分钟线缺一分钟就留空；5 分钟线给 gapMinutes=5，不然每个点都是孤点。',
    ],
    avoid: [
      '日以上的序列用 SeriesExplorer 或 BrushChart。',
      '单只股票的价格分时（带均价线、成交量副图）不是它的活：它不带均价线与昨收基线。',
      '不要塞超过 7 条序列：颜色只有 series-1..7，再多的折进「其他」或拆成小多图。',
    ],
    a11y: [
      '绘图区是 role="group"，读屏名是整句加各序列最新值；聚焦后 ← → 逐分钟走，Esc 清掉，移走焦点也清掉。',
      '十字光标的值同时写进一个 aria-live="polite" 的区域，读屏随光标读出这一分钟的全部序列。',
      '序列靠图例里的名字与最新值区分，不只靠颜色；昨日虚线的钥匙带读屏名。',
      '图上的数字（轴、悬停窗）等宽数字，不抖。',
    ],
  },
  'grouped-table': {
    aliases: ['分组表', '连板梯队', '分节表', 'Grouped table', 'Row grouping'],
    use: [
      '榜单按某个维度分组看：连板梯队按连板数、新高按板块、龙虎榜按概念；组头一眼看到行数与汇总。',
      '组的次序用 groupMetric 给数（合计金额、晋级率）：想看谁最强就让最大的组在最上面。',
      '没分进组的行不要丢，放在最后的「其他」里，数得出来。',
    ],
    avoid: [
      '只是想给表加几个手动分节（自选表的分组）用 DataGrid 的 rowSection：那是人拖的，不是按列算的。',
      '分组超过几十个就别分了：组头比行还多，换成筛选或排行。',
    ],
    a11y: [
      '表是 treegrid（DataGrid 的分节本来就是）：组头行带 aria-expanded，键盘落在组头上 ← 收起、→ 展开、Enter 切换。',
      '组头的三角钮读「Collapse section / Expand section」，文案由 DataGrid 的宿主传；行数与汇总是文字。',
      '收起的组仍在读屏的行数里算上（组头写着个数）。',
    ],
  },
  'matrix-heat': {
    aliases: ['热力矩阵', '连板区间对比', '题材连榜', 'Heat matrix', 'Heatmap grid'],
    use: [
      '两个维度交叉着看一个量：板位 × 交易日的晋级率、题材 × 交易日的涨幅；一眼看出哪一行、哪一天强。',
      '计数、占比这类非负量用顺序色阶；有正负的量（涨跌、净额）用发散色阶，红涨还是绿涨由根上的 data-updown 定。',
      '格子里写着数，颜色只是帮眼睛扫；原因（样本数、为什么空）写进 reason，悬停和聚焦都能读到。',
    ],
    avoid: [
      '行列是日期和品种的大表（几百行）用 DataGrid 的 heat 列；这个件是看得全的小矩阵。',
      '一个维度的排行用 BarList 一类，不用矩阵。',
      '不要拿涨跌色画计数。',
    ],
    a11y: [
      '照 APG Grid：role="grid"，方向键走格、Home / End 到行首行尾、Enter / Space 选中，Tab 只停一个格子。',
      '每格的读屏句子由 labels.cell 写，带值与原因；格内的字 aria-hidden，不重复读。',
      '列头、行头是按钮，排序后 aria-sort 写 ascending / descending，带小箭头；不只靠颜色看大小，格内有数字。',
      '文字对比度：顺序色阶 3–4 档换深色字；发散色阶封顶 64% 混透明。待浏览器 axe 实测。',
    ],
  },
  'valuation-band': {
    aliases: ['估值分位', '历史分位', '市盈率分位', 'PE band', 'Valuation percentile'],
    use: [
      '看一个指数或品种的市盈率、市净率现在处在自己历史的什么位置：当前点标「估值 · P分位」。',
      '要换口径就换传进来的历史：近 5 年、10 年各传各的；分位按整段历史算。',
      '分位线可配（percentiles），比如 10 / 50 / 90。',
    ],
    avoid: [
      '不要拿它预测涨跌：分位只说位置，不说方向。',
      '亏损的市盈率没有意义：给 null，不要给负数或 0，不然带与分位都会被拉歪。',
      '价格走势用 SeriesExplorer、BrushChart 或行情卡，不是它。',
    ],
    a11y: [
      '绘图区是 role="group"，读屏名是整句加一句当前读数（「当前 18.4 倍，处在历史 37 分位」，文案由 labels.summary 写）。',
      '聚焦后 ← → 逐点读（时间、估值、分位），读出的内容同时写进 aria-live="polite"；Esc 或移走焦点清掉。',
      '带的深浅不是唯一信息：分位线旁写着「分位 · 估值」，当前点旁写着分位数字。',
    ],
  },
  'distribution-bars': {
    aliases: ['涨跌分布', '分档分布', '板位分布', 'Distribution', 'Bin bars'],
    use: [
      '把一批品种按涨跌幅或别的量分档，看每档有几只。',
      '档名最多两行：窄柱下字符串区间（「-5~-3」）在区间符后断开，放得下就一行；想总是上下叠就给 lines。',
    ],
    avoid: [
      '连续分布、要在上面拖区间用 RangeHistogramSlider。',
      '档名不要写成长句：两行以外会被省略，只有悬停里是完整的。',
    ],
    a11y: [
      '整张图是 role="group"，读屏名由调用方写；档名行是 aria-hidden，完整档名在悬停（title）里给鼠标用户。',
      '柱顶写家数，不只靠柱高与颜色。',
    ],
  },
}

export default cnBatch4
