// SPDX-License-Identifier: MIT
// 开盘啦对照第三批（KatanaUI #11）的「怎么用 / 无障碍」。口径一律由调用方给（区间怎么算、竞价额、异动阈值），件只负责摆；
// 涨跌色只读语义色调，根上设 data-updown="cn" 得红涨绿跌；文字走 labels（cnLabelsZh 是简体中文默认，可整份换）。
import type { GuidanceMap } from './types'

const cnBatch3: GuidanceMap = {
  'range-scrubber': {
    aliases: ['区间统计', '区间时间轴', '时段选择', 'Session range', 'Intraday range picker'],
    use: [
      '复盘或盘中看「这一段时间谁最强」：拖出一个时段，按区间涨幅、净额或强度给板块与个股排序。',
      '回调给的是时刻，调用方拿它去切分钟序列；轴按交易分钟走，午休不占宽度。',
    ],
    avoid: [
      '跨日的区间用 TradingDatePicker 或 DateRangePicker。',
      '不要把排序逻辑塞进件里：口径各家不同，由调用方算。',
    ],
    a11y: [
      '两个把手是 role=slider（APG 多把手滑块），aria-valuetext 写时刻；方向键一分钟、PageUp / PageDown 十分钟。',
      '快捷钮与口径是 ToggleGroup，按下的标 aria-pressed；读数行是 output。',
      '「现在」之后的斜纹不进读屏，把手的 aria-valuemax 就停在现在。',
    ],
  },
  'auction-bar-cell': {
    aliases: ['竞价量比', '竞价额', '涨停委买', 'Auction volume ratio', 'Opening auction bar'],
    use: [
      '集合竞价榜的一列：看今日竞价额比昨日同期多多少、有没有涨停委买。',
      '放进 DataGrid 的 custom 列，一列传同一个 max，排序给 auctionRatio。',
    ],
    avoid: ['竞价价格的走势用 AuctionStep。', '不要一格一把刻度：行与行就没法比长短。'],
    a11y: [
      '整格是 role="img"，读屏名写全竞价额、昨日同期、量比与涨停委买；09:25 之前前面补「竞价未出结果」。',
      '量比是文字，不只靠条的长短；≥ 1 的加亮同时有数字。',
    ],
  },
  'threshold-gap': {
    aliases: ['异动提醒', '异常波动', '偏离值', 'Abnormal fluctuation', 'Threshold gap'],
    use: [
      '盯可能触发异常波动的票：离阈值还差多少、到了预警线没有、触发后监管期结束没有。',
      '一只票一行，多只票按 thresholdGap 从小到大排，最近触发的在上面。',
    ],
    avoid: ['不要在包里写死阈值：各板块规则不同，由调用方传。', '涨跌幅本身用 ChangeText。'],
    a11y: [
      '条是 Meter（role=meter），读屏值写偏离值，后面接「阈值 x%」「预警线 x%」。',
      '档位是文字标签，不只靠颜色；「差 x%」「超出 x%」也是文字。',
    ],
  },
}

export default cnBatch3
