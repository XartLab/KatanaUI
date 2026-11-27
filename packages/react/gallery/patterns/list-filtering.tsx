// SPDX-License-Identifier: MIT
import { ScreenerDemo } from '../pages/screener'
import type { Pattern } from './types'

const pattern: Pattern = {
  id: 'list-filtering',
  title: '列表筛选',
  summary: '选股器式的一整套：过滤条圈出范围，列集页签换一批列，表格显示结果；条件、列、排序三件事各管各的。',
  Demo: ScreenerDemo,
  use: [
    '几百到几万行、要按几个数值条件圈范围的表：选股、选币、策略库',
    '同一批行要从几个角度看（概览、估值、业绩），列不一样、行一样',
  ],
  avoid: ['只想按名字找一行：用列表内的搜索框（见「搜索」）', '不到 30 行的表：直接排序，不必筛选'],
  parts: [
    { page: 'filter-bar', role: '过滤条：胶囊 = 字段 + 运算符 + 值，带撤销 / 重做' },
    { page: 'column-set-tabs', role: '列集页签：点一个就把表换成这一套列' },
    { page: 'data-grid', role: '结果表：排序、列宽、列显隐，表头第二行写命中数' },
  ],
  rules: [
    '自上而下三层：过滤条 → 列集页签 → 表，间距 8px，不放别的东西夹在中间',
    '过滤条件之间是「且」；每个字段至少给 3 个预设（如「高于 2.5%」），省得用户手输',
    '命中数写在代码列表头第二行（「12 / 40」），不另起一行计数',
    '手动改过列之后没有页签亮着；亮哪个由可见列是否恰好等于该列集推出来，不另存状态',
    '已保存的筛选放在过滤条上方的下拉里；改了条件不自动覆盖已保存项',
    '筛选结果为空时表里写「没有符合条件的行」并给「重置全部过滤」，不留空白表',
  ],
  source: {
    label: 'Salt · List filtering',
    href: 'https://www.saltdesignsystem.com/salt/patterns/list-filtering',
  },
}
export default pattern
