// SPDX-License-Identifier: MIT
import { MoveFeed } from '../../src/cn'

export function MoveFeedUsage() {
  return (
    <MoveFeed
      items={[
        { id: '1', time: '09:31:05', name: 'Example A', code: '600101', type: 'rocket', value: 3.2 },
        {
          id: '2',
          time: '09:33:40',
          name: 'Example B',
          code: '000102',
          type: 'bigBuy',
          value: 23_500_000,
          unit: 'amount',
        },
        { id: '3', time: '09:36:12', name: 'Example C', code: '300103', type: 'sealUp', value: 20.01 },
        { id: '4', time: '09:41:50', name: 'Example D', code: '600104', type: 'dive', value: -4.6 },
      ]}
      onSelect={() => {}}
      labels={{
        region: 'Intraday moves',
        filter: 'Filter by move type',
        all: 'All',
        onlyCurrent: 'Current symbol',
        types: {
          rocket: 'Rocket',
          dive: 'Dive',
          bigBuy: 'Big buy',
          sealUp: 'Limit-up sealed',
        },
        typeChip: (name, count) => `${name} ${count}`,
        summary: (count) => `${count} moves`,
        empty: 'No moves',
        row: (time, name, type, value) => `${time} ${name} ${type} ${value}`,
        unavailable: 'Not available',
      }}
    />
  )
}
