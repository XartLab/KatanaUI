// SPDX-License-Identifier: MIT
// 布局组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const layout: GuidanceMap = {
  'text-measure': {
    aliases: ['pretext', 'Text measurement', 'measureText', 'Line clamp'],
    use: [
      'SVG / canvas 里的标签要截断或折行。',
      '按字宽决定格子里写不写字、写代码还是全名。',
      '按内容定列宽、给虚拟列表预先定行高。',
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
      '基于 Radix Tabs：tablist、tab、tabpanel 角色齐全，选中项带 aria-selected。',
      '页签读屏名取自它的文字；纯图标页签要自己加 aria-label。',
    ],
  },
  accordion: {
    aliases: ['Collapsible', 'Expander', 'Disclosure', 'Collapse'],
    use: ['内容分成几段、多数时候只看其中一两段。', '说明、高级选项这类次要内容，默认收起省空间。'],
    avoid: ['并列视图要来回切换，用 tabs。', '只有一段内容要收起，直接用 Collapsible 式的单项折叠，不必成组。'],
    a11y: [
      '基于 Radix Accordion：标题是 button，带 aria-expanded 与 aria-controls。',
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
      '基于 react-aria-components 的 Tree：treegrid 角色，展开的行带 aria-expanded。',
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
      '搜索框有自己的 aria-label；⌘K 提示与图标对读屏隐藏。',
    ],
  },
}

export default layout
