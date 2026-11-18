// SPDX-License-Identifier: MIT
import { ReasonGroupList, type ReasonGroup } from '../../src/blocks'

// 演示数据：原因、代码、名称、封单与成交额都是编出来的，不是真实行情。
export const REASON_GROUPS: readonly ReasonGroup[] = [
  {
    id: 'robot',
    reason: '机器人',
    items: [
      {
        code: '300101',
        name: '示例减速器',
        board: 4,
        change: 20.0,
        firstSeal: '09:31',
        sealAmount: 3.2e8,
        turnover: 1.8e9,
        tags: ['人形'],
      },
      {
        code: '002102',
        name: '示例伺服',
        board: 2,
        change: 10.02,
        firstSeal: '09:45',
        sealAmount: 1.1e8,
        turnover: 9.2e8,
      },
      {
        code: '603103',
        name: '示例丝杠',
        board: 1,
        change: 10.0,
        firstSeal: '10:12',
        sealAmount: 4.6e7,
        turnover: 5.1e8,
        tags: ['汽车零部件'],
      },
    ],
  },
  {
    id: 'compute',
    reason: '算力',
    items: [
      {
        code: '000201',
        name: '示例光模块',
        board: 3,
        change: 10.01,
        firstSeal: '09:35',
        sealAmount: 2.4e8,
        turnover: 2.6e9,
        tags: ['CPO'],
      },
      {
        code: '600202',
        name: '示例服务器',
        board: 1,
        change: 9.99,
        firstSeal: '13:05',
        sealAmount: 3.0e7,
        turnover: 1.2e9,
      },
    ],
  },
  {
    id: 'lowalt',
    reason: '低空经济',
    items: [
      {
        code: '002301',
        name: '示例飞控',
        board: 1,
        change: 10.03,
        firstSeal: '10:40',
        sealAmount: 6.5e7,
        turnover: 4.4e8,
      },
    ],
  },
]

export function ReasonGroupListUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <ReasonGroupList
        groups={REASON_GROUPS}
        labels={{
          list: '涨停原因分组（演示数据）',
          filter: '按原因筛选',
          clear: '清除筛选',
          count: (n) => `${n} 家`,
          highest: (n) => `最高 ${n} 板`,
          board: (n) => (n === 1 ? '首板' : `${n} 板`),
          columns: {
            name: '名称',
            board: '连板',
            change: '涨跌幅',
            firstSeal: '首封',
            sealAmount: '封单',
            turnover: '成交额',
            tags: '其他原因',
          },
          empty: '没有涨停',
        }}
      />
    </div>
  )
}
