// SPDX-License-Identifier: MIT
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../src/index'

export function CollapsibleUsage() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Advanced parameters</CollapsibleTrigger>
      <CollapsibleContent>Slippage, commission and the rebalance calendar.</CollapsibleContent>
    </Collapsible>
  )
}
