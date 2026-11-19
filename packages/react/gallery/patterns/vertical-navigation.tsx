// SPDX-License-Identifier: MIT
import { SideNavUsage } from '../usage/SideNavUsage'
import type { Pattern } from './types'

const pattern: Pattern = {
  id: 'vertical-navigation',
  title: '竖向导航',
  summary: '应用左侧的分组导航：工作区、设置页、文档站的目录都用它。',
  Demo: SideNavUsage,
  use: ['页面或面板超过 7 个、能分成几组', '用户要在几个地方之间来回切，需要一直看得见目录'],
  avoid: ['只有 2–5 个平级去处：用标签页（Tabs）', '临时选一个东西：用命令面板（Command）或下拉'],
  parts: [
    { page: 'side-nav', role: '目录本体：分组、当前项轨迹、过滤框' },
    { page: 'command', role: '⌘K 之外的全局跳转（跨页搜索）' },
    { page: 'workspace-tabs', role: '同一个去处里开多个实例时，用顶部标签' },
  ],
  rules: [
    '两级：大分组（带图标）→ 条目（不带图标）；不做三级树',
    '栏宽 240–300，贴页面底色不加边框；内容区做成圆角面板跟栏分开',
    '当前项最亮并有轨迹；悬停画淡色轨迹；切换 200ms 滑过去',
    '过滤框在顶上，⌘K 聚焦；没命中的组整组隐藏',
    '能收起：收起后展开按钮放在内容区顶栏最左',
    '打开某页时，当前项自动滚进视口，组名一起露出来',
  ],
  source: {
    label: 'Salt · Vertical navigation',
    href: 'https://www.saltdesignsystem.com/salt/patterns/vertical-navigation',
  },
}
export default pattern
