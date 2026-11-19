// SPDX-License-Identifier: MIT
import { CheckboxGroup, CheckboxGroupItem } from '../../src/index'

const MARKETS = ['sh', 'sz', 'bj']

export function CheckboxGroupUsage() {
  return (
    <CheckboxGroup aria-label="Markets" allValues={MARKETS} defaultValue={['sh']}>
      <CheckboxGroupItem parent>All markets</CheckboxGroupItem>
      {MARKETS.map((market) => (
        <CheckboxGroupItem key={market} value={market}>
          {market.toUpperCase()}
        </CheckboxGroupItem>
      ))}
    </CheckboxGroup>
  )
}
