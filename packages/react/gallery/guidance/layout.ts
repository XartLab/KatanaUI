// SPDX-License-Identifier: MIT
// 布局组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const layout: GuidanceMap = {
  live: {
    aliases: ['Flash', 'Tick flash', 'Value flash', 'FLIP', 'Highlight on update', '数据刷新', '闪烁', '新消息高亮'],
    use: [
      '行情、新闻流、连板天梯、自选这类数据会自己更新的列表与读数：变了的地方要让人看得出。',
      '数值变了：useValueFlash 给方向与 key，元素加 .k-live-flash 与 data-flash，key 放在元素上（同一父元素里有几个 key 就各加前缀，如 price-1 与 status-1，重了 React 会留下旧元素）。',
      '来新条目：useEnterMarks 认出新 id，行加 .k-live-enter；用户滚离顶部时只计数不插入。',
      '顺序变了（升板、炸板换位）：useFlipList 让行平滑换位，行上写 data-live-id。',
      '状态变了（炸板）：useStatusFlash 给一次性的闪，炸板这类用 .k-live-alert 的警示色。',
    ],
    avoid: [
      '一次性的状态切换（点开关、展开面板），那是弹簧动效，不是数据刷新。',
      '用户自己改的值（输入框里打字）：他知道自己改了，不闪。',
    ],
    a11y: [
      '动效只是辅助，变化本身要在文字里：数值有新数、状态写在字上，不靠闪色一个通道。',
      '闪烁用背景色，不改字色，对比度不降到 4.5:1 以下；强调线 2px，不靠它传达唯一信息。',
      '要读屏播报新消息，容器用 aria-live="polite"，不要给每一格都播。',
    ],
  },
  'text-measure': {
    aliases: ['pretext', 'Text measurement', 'measureText', 'Line clamp'],
    use: [
      'SVG / canvas 里的标签要截断或折行。',
      '按字宽决定格子里写不写字、写代码还是全名。',
      '按内容定列宽、给虚拟列表预先定行高。',
      '组件里凡是要知道文字多宽多高，一律走这一层；不按字数估，不插隐藏量尺元素再量 DOM。',
      '字体用 fontFor 按那段字实际的 CSS 字重、字号、字体变量拼；有字距的传 letterSpacing。',
      '等宽数字（tabular-nums）canvas 量不出来：先把数字换成该字体最宽的数字再量。',
      '算出的宽高要随字体重算：字体加载完、换字体、换缩放时缓存会清，用 onTextMeasureReset 订阅。',
    ],
    avoid: ['HTML 里的单行省略，用 CSS text-overflow。', '要双向文字（阿拉伯文、希伯来文）的视觉顺序：它不处理 bidi。'],
    a11y: ['截断的字要把全文给读屏（SVG 的 aria-label 或 title）。'],
  },
  tabs: {
    aliases: ['Tab', 'Tab bar', 'Segmented control', 'Tabbed pane'],
    use: ['同一块区域里切换几个并列的视图，一次只看一个。', '视图之间是平级关系，切换不换页、不丢上下文。'],
    avoid: [
      '要在页面之间跳转，用 side-nav。',
      '要像文件一样开关、拖动排序的标签，用 workspace-tabs。',
      '只是开关一个选项，用 toggle-group。',
    ],
    a11y: [
      '基于 UI SDK Tabs：tablist、tab、tabpanel 角色齐全，选中项带 aria-selected。',
      '页签读屏名取自它的文字；纯图标页签要自己加 aria-label。',
    ],
  },
  accordion: {
    aliases: ['Collapsible', 'Expander', 'Disclosure', 'Collapse'],
    use: ['内容分成几段、多数时候只看其中一两段。', '说明、高级选项这类次要内容，默认收起省空间。'],
    avoid: ['并列视图要来回切换，用 tabs。', '只有一段内容要收起，直接用 Collapsible 式的单项折叠，不必成组。'],
    a11y: [
      '基于 UI SDK Accordion：标题是 button，带 aria-expanded 与 aria-controls；↑↓ 在标题间走、Home / End 到头尾、两头回绕，禁用的标题被跳过（迁移前 Radix 的做法，UI SDK 没有，这里补上）；Tab 也能到各个标题。',
      '读屏名取自标题文字，标题要写清内容是什么。',
    ],
  },
  separator: {
    aliases: ['Divider', 'Rule', 'hr', 'Horizontal rule'],
    use: ['菜单、工具条里把相邻的几组分开。', '同一块面板里把两段内容画一道细线隔开。'],
    avoid: ['只想留白，用间距。', '要给一组内容起名，用分组标题。'],
    a11y: [
      '默认 decorative，读屏不报，不进无障碍树。',
      '传 decorative={false} 才有 role=separator 和 aria-orientation。',
    ],
  },
  'scroll-area': {
    aliases: ['Scroll view', 'Scrollable container', 'Overflow container', 'Custom scrollbar'],
    use: ['固定高度的面板、列表里，内容比框高要滚动。', '想要平时不占位、滚动时才出现的细滚动条。'],
    avoid: ['整页滚动，用浏览器自己的滚动。', '表格数据，用 data-grid。'],
    a11y: [
      '视口 tabIndex=0，没有可聚焦内容时也能用方向键滚。',
      '视口的焦点环保留，不要隐藏。',
      '滚动条本身只是视觉，读屏走原生滚动。',
    ],
  },
  'tree-view': {
    aliases: ['Tree', 'Tree list', 'Nested list', 'Hierarchy'],
    use: ['数据集目录、品种分类这类有层级的列表。', '要在层级里选一个节点，并能展开收起。'],
    avoid: ['不分层的列表，用 command 或 data-grid。', '站内导航，用 side-nav。', '几千个节点，先在数据层折叠。'],
    a11y: [
      '基于 UI SDK 的 Tree：tree 角色，展开的项带 aria-expanded，层级在 aria-level。',
      '树整体的读屏名取自 label，行名取自文字。',
      '箭头图标对读屏隐藏。',
    ],
  },
  splitter: {
    aliases: ['Resizer', 'Split pane', 'Divider handle', 'Gutter'],
    use: ['两块面板并排或上下排，用户要自己拖大小。', '拖到常用位置时吸附，比如对半。'],
    avoid: ['要拖出新面板或停靠，用工作区的 docking。', '固定比例的分隔，用 separator。'],
    a11y: [
      'role=separator、tabIndex=0，带 aria-orientation 与 aria-valuenow/min/max。',
      '读屏名取自 label；传 valueText 才会念「第一块占几成」而不是裸数字。',
      '键盘与值的行为照 WAI-ARIA 的 Window Splitter 模式。',
    ],
  },
  'side-nav': {
    aliases: ['Sidebar', 'Vertical navigation', 'Navigation rail', 'Nav drawer'],
    use: ['应用里页面多、要分组列出并能搜索。', '要一直看着自己在哪一页，当前项始终高亮。'],
    avoid: ['同一页里切视图，用 tabs。', '少于五六个入口，放顶部工具条更省地方。'],
    a11y: [
      '外层是 nav，读屏名取自 aria-label。',
      '当前项带 aria-current="page"。',
      '搜索框有自己的 aria-label；按键提示（Mac 是 ⌘K，别处 Ctrl+K）与图标对读屏隐藏。',
      '聚焦搜索的 Mod+K 经 useHotkeys 登记（#87），快捷键总览里列得出；只认这一个组合，Ctrl+Shift+K 这类留给别人。页里要把 Mod+K 给命令面板时，在更近的注册表（挂在 document 上）或非 global 作用域里登记就盖过它，或给 searchHotkey={null}。',
    ],
  },
  'hover-expand': {
    aliases: ['Accordion cards', 'Expanding panels', 'Image accordion', 'Hover cards'],
    use: ['板块概览、策略卡、情景对比这类同时只看一块细节的并列项。', '横排或竖排的 2 到 5 个面板。'],
    avoid: ['展开后要交互的用 tabs 或 accordion。', '超过 5 个面板不要用。'],
    a11y: ['整组 role=group，面板是 aria-pressed 的按钮。', '键盘聚焦即展开，方向键切换。'],
  },
  'animated-stepper': {
    aliases: ['Stepper', 'Wizard', 'Progress steps', 'Multi-step form'],
    use: ['下单向导这类多步流程，要看到走到哪一步。', '横排与竖排两种。'],
    avoid: ['步骤互相独立可任意顺序用 tabs。', '回放控制用 step-player。'],
    a11y: [
      'role=tablist 与 tab，tabpanel 与当前步关联。',
      '每步的读屏名取 labels.step，带「已完成」「当前」。',
      '允许点击导航时方向键走步。',
    ],
  },
  squircle: {
    aliases: ['Smooth corners', 'Superellipse', 'Continuous corners', 'Rounded rectangle'],
    use: ['头像、徽标、图标底这类单个小方块要柔和的角。'],
    avoid: ['整块面板默认直角，不要混用。', '要带焦点环的可聚焦元素不要用：焦点环会被裁。'],
    a11y: ['只是形状，没有语义。', '裁切会连阴影与焦点环一起裁掉。'],
  },
}

export default layout
