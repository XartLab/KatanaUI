// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FilterBar, type FilterBarLabels, type FilterCondition, type FilterField } from '../../src/index'

const OPS = [
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
]

const FIELDS: readonly FilterField[] = [
  {
    key: 'price',
    label: '价格',
    group: '市场数据',
    shown: true,
    operators: OPS,
    presets: [{ key: 'p-high', label: '高于 100', hint: '高价股', op: 'gt', value: '100' }],
  },
  { key: 'pe', label: '市盈率', group: '估值', shown: true, operators: OPS },
]

const LABELS: FilterBarLabels = {
  bar: '过滤条',
  add: '添加过滤',
  more: '更多',
  reset: '重置全部过滤',
  search: '搜索',
  noMatch: '没有匹配项',
  presets: '预设条件',
  manual: '手动设置',
  operator: '运算符',
  value: '值',
  apply: '应用',
  remove: '移除过滤',
  clear: '清除条件',
  back: '返回',
  otherGroup: '其他',
  undo: '撤销',
  redo: '重做',
}

export function FilterBarUsage() {
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  return <FilterBar fields={FIELDS} value={conditions} onValueChange={setConditions} labels={LABELS} />
}
