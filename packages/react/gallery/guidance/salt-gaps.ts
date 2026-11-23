// SPDX-License-Identifier: MIT
// #104 对照 Salt 补的七件的「怎么用 / 无障碍」。用法照 Salt 各件的用法页（Apache-2.0，2026-11-23 读），换成交易台的例子。
import type { GuidanceMap } from './types'

const saltGaps: GuidanceMap = {
  pill: {
    aliases: ['Chip', 'Filter chip', 'Removable tag', 'Token', '筛选条件'],
    use: [
      '一条已生效的筛选或叠加：点本体改它，点 × 去掉它（选股器顶上的条件、图上叠加品种的图例）。',
      '要一个单独的开关（到价提醒开 / 关）时传 selected，它就是 aria-pressed 的开关。',
      '标签一两个词，不写句子。',
    ],
    avoid: [
      '一组互相关联的开关筛选用 chip-group。',
      '只展示、不可点的标记用 tag。',
      '切换视图用 toggle-group，立刻生效的二元设置用 switch。',
      '自由输入一串标签用标签输入件（输入框里打字成标签），不要自己拼 Pill 加 Input。',
    ],
    a11y: [
      '本体与 × 是两个原生 button，各自在 Tab 次序里；× 的读屏名由 dismissLabel 给，要说清去掉的是哪一条。',
      '焦点在本体上按 Backspace / Delete 等于点 ×；去掉以后调用方把焦点放到下一颗或输入框，别让焦点掉到 body。',
      'selected 读作「按下 / 未按下」；选中不只靠颜色，字重也变。',
      '× 画出来 20 见方，点按区外扩到 24 见方（WCAG 2.5.8）；sm 的 × 只有 20，只给不常点的密集列表。',
    ],
  },
  'system-status': {
    aliases: ['System banner', 'Global banner', 'Announcement bar', 'Maintenance banner', '系统公告'],
    use: [
      '影响整个平台的事：计划停机维护、行情源或券商通道断开重连、数据延迟、安全更新、新功能上线。',
      '贴在应用最顶上、占满宽；一屏只放一条最要紧的。',
      '动作放一个小按钮或链接（「立即重连」「查看详情」）；可以让人关掉的给 onDismiss。',
    ],
    avoid: [
      '跟当前任务有关的提示用 alert（嵌在那块内容里）。',
      '必须打断操作、等人确认的用 dialog。',
      '一次操作的结果（已下单、已保存）用 toast。',
      '加载中用骨架或 loading，不要用消息条说「正在加载」。',
    ],
    a11y: [
      'warn、danger 默认 role=alert，后冒出来时读屏马上读；info、ok、neutral 默认 role=status，等读屏空了再读。',
      '页面一打开就在的消息传 role="note"，免得每次打开都被打断。',
      '语气有五种图标形状，加上标题文字，不只靠颜色。',
      '关闭钮是 24 见方的原生 button，读屏名由 dismissLabel 给。',
    ],
  },
  calendar: {
    aliases: ['Date picker panel', 'Month view', 'Go to date', '转到日期', '日历'],
    use: [
      '页面或对话框里常驻一张日历挑一天：转到日期、回放从哪天开始、复盘选交易日。',
      '休市日、周末这类点不了的日子用 unavailable 给出；可选范围用 min / max 限住。',
      '日期一律 YYYY-MM-DD，时区与交易日历由调用方定。',
    ],
    avoid: [
      '要能打字输入、点开才出日历的用 date-time-input。',
      '选起止区间的用 date-range-picker。',
      'A 股按交易日跳的选择器用 trading-date-picker。',
    ],
    a11y: [
      'react-aria 的 Calendar：日格是 grid，月份标题是它的读屏名的一部分；翻页钮的读屏名由 labels 给。',
      '不可选的日子读作「不可用」，画法上既降色又加删除线；今天加下划线，不只靠颜色。',
      '方向键按天走、PageUp / PageDown 按月，焦点始终在一格上。',
    ],
  },
  'list-box': {
    aliases: ['Option list', 'Selection list', 'Listbox', '选项列表'],
    use: [
      '一组选项要一直摆在页上、挑了马上驱动下一步：选账户、选布局、选数据源、给分组挑品种。',
      '账户余额、条数这类数放 trailing（等宽数字），第二行说明放 description。',
      '选项多时给 maxHeight 让它自己滚，不要把整页撑长。',
    ],
    avoid: [
      '五个以内的单选用 radio-group。',
      '五到十个、不需要一直看着的用 select。',
      '选项很多又要搜的用 combobox。',
      '页面导航用 side-nav。',
    ],
    a11y: [
      'react-aria 的 ListBox：listbox 角色，项是 option，Tab 只停整个列表一次，里面用方向键走。',
      '选中读作「已选」，画法上换底色并出对勾，不只靠底色。',
      '分组读出组名；禁用的项读作「不可用」并被跳过。',
      '项里不放可聚焦的子项（按钮、链接），否则违反 listbox 的结构。',
    ],
  },
  link: {
    aliases: ['Anchor', 'Hyperlink', 'Text link', '超链接'],
    use: [
      '正文里跳到另一页或外部原文：新闻出处、公告原文、帮助说明。',
      '外部网址加 external：新窗口打开、带外链图标，并给 externalLabel 让读屏知道。',
      '接路由库时用 asChild 包住它的 Link。',
    ],
    avoid: [
      '提交、删除这类动作用 button。',
      '一整块可点的卡片用 card 的 asChild interactive。',
      '页面导航菜单用 side-nav 或 navigation-menu。',
    ],
    a11y: [
      '原生 a：Tab 聚焦、Enter 跳转；下划线一直在，正文里不只靠颜色认出链接（WCAG 1.4.1）。',
      'external 时读屏在文字后多读 externalLabel（如「在新窗口打开」）；图标本身 aria-hidden。',
      '链接文字要说清去哪（「原文」「行业资金流」），不要写「点这里」。',
    ],
  },
  card: {
    aliases: ['Tile', 'Container card', 'Interactable card', '卡片'],
    use: [
      '把一组相关的内容框起来：一个账户的摘要、一篇研报的入口、一个策略的简介。',
      '整张卡要点进去时用 asChild 包一个 a（跳转）或 button（动作），再加 interactive。',
      '头部右上角放一个小动作（切换、菜单）用 CardAction。',
    ],
    avoid: ['指标读数用 metric-card。', '工作台面板用 panel-frame。', '只要一块底色、不要框的用 panel。'],
    a11y: [
      '默认是 div，没有角色；要成组读时由调用方给 section 或 aria-labelledby。',
      '可点的卡是原生 a 或 button，读屏名就是卡里的文字，所以标题要写在前面。',
      '可点的卡里不要再嵌按钮或链接。',
    ],
  },
  panel: {
    aliases: ['Container', 'Pane', 'Surface', '容器'],
    use: [
      '分栏布局里的一栏、对话框里的一块滚动区：要一块底色把内容托住、占满高度、内容超出自己滚。',
      '三档底色用来分层：最外层 primary，里面一层 secondary 或 tertiary。',
    ],
    avoid: ['要标题栏、折叠的用 panel-frame。', '要边框和圆角的用 card。'],
    a11y: [
      '默认是 div，没有角色。',
      '内容会超出、里面又没有可聚焦的东西时，给它 tabIndex={0} 与 aria-label，键盘用户才能滚（axe scrollable-region-focusable）。',
    ],
  },
}

export default saltGaps
