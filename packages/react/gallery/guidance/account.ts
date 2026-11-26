// SPDX-License-Identifier: MIT
// 账户四件（#104）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const account: GuidanceMap = {
  'positions-table': {
    aliases: ['Positions', 'Open positions', '持仓', '仓位列表'],
    use: [
      '合约账户的当前持仓，要一眼看出谁离强平近。',
      'liquidationWarnPct 传你的预警线（默认 10%），再近一半自动是危险档。',
      '要和委托放一起用 PositionsOrdersTabs，页签上带数量。',
    ],
    avoid: ['现货持仓没有强平价，用普通表格即可。', '件不下单：平仓全部还是部分、要不要二次确认放进 onClose 里做。'],
    a11y: [
      '强平风险是图标加文字加颜色三重表达，图标有读屏名。',
      '多空是文字，不只靠颜色。',
      '行内按钮的读屏名带品种。',
    ],
  },
  'orders-table': {
    aliases: ['Open orders', 'Order list', '委托', '当前委托'],
    use: ['在途委托：撤单、改价、全部撤单。', '改价只发回调：回车提交新价，Esc 取消。'],
    avoid: ['成交历史用普通表格，这里只放还能操作的单。', '不要在件里等交易所回报，发出回调后由调用方改 status。'],
    a11y: [
      '改价输入框的读屏名带品种；非法输入有文字提示。',
      '买卖、状态都是文字。',
      '撤单中的单按钮置灰（aria-disabled）。',
    ],
  },
  'account-equity': {
    aliases: ['Account summary', 'Margin ratio', '账户概览', '保证金率'],
    use: [
      '账户顶部的总权益、可用、已用保证金与风险条。',
      '阈值与方向由调用方传：维持保证金率那种越低越危险写 direction=lower。',
    ],
    avoid: ['不要在件里定阈值，各家交易所口径不同。', '要多日权益走势用 equity-curve，这里的曲线只是缩略。'],
    a11y: ['风险档位同时写成文字标签。', '风险条是 role=meter，带当前值与档位。'],
  },
  'funding-rate': {
    aliases: ['Funding', 'Perpetual funding', '资金费', '永续费率'],
    use: ['永续合约的当前费率、预测费率与下次结算倒计时。', '回放或测试时传 now 固定时钟。'],
    avoid: ['不要在件里读结算时间表，nextSettlement 由调用方传。', '历史柱按这段历史归一，不当绝对值比较。'],
    a11y: ['费率正负靠符号与文字，不只靠颜色。', '倒计时不做 aria-live 播报，避免每秒打扰。'],
  },
  'derivatives-board': {
    aliases: ['Trading data', 'Derivatives data', 'Market stats', '交易数据', '衍生品数据'],
    use: [
      '永续合约详情页的「交易数据」：持仓量、资金费率、主动买卖、多空比、大户多空、基差一屏看。',
      '一张卡一个周期：onPeriodChange(kind, period) 里换那张卡的数据，别的卡不动。',
      '只要其中几张：kinds 选画哪几张与次序；单张放进自己的面板用 DerivativesCard。',
    ],
    avoid: [
      '不要在件里定周期档：OKX 的实际档位待核对，用 periods 传你的数据源支持的几档。',
      '单品种的价格走势用图表包；这里只放衍生品的统计序列。',
    ],
    a11y: [
      '每张卡是 article，标题是 h3；信息钮的读屏名写「某某的说明」，说明在悬停或焦点出的提示里。',
      '周期按钮组是 role=group，读屏名写「某某的周期」，选中项 aria-pressed。',
      '图是一个 role=group 的停靠点，读屏名写卡名与最新值；← → 扫读时一个 aria-live 区读出时间与各序列的值。',
      '序列靠图例的字与悬停窗的字区分，涨跌不只靠颜色；空态是 role=status。',
    ],
  },
  'options-chain': {
    aliases: ['Option chain', 'T-quote', 'T 型报价', '期权链'],
    use: [
      '同一到期日的认购认沽并排报价。',
      '每翼的列用 fields 配，认购翼自动镜像。',
      '点格回调 onQuoteSelect(strike, side, field)，用于下单面板预填。',
    ],
    avoid: ['不要在件里定价，IV 与 Delta 由调用方给。', '不要用涨跌色区分认购认沽，靠左右位置。'],
    a11y: [
      'role=grid，单一 Tab 停靠点，方向键移动。',
      '每格读屏名带行权价、认购或认沽与字段名。',
      '平值行有「平值」文字，实值区不只靠底色。',
    ],
  },
}

export default account
