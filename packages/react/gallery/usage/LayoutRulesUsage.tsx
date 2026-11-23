// SPDX-License-Identifier: MIT
import { Cluster, EmphasisProvider, PriceTag, Stack } from '../../src/index'

// 块与块之间留白（Stack 的 gap）；字号跟分量走。
export function LayoutRulesUsage() {
  return (
    <Stack gap="space-4">
      <EmphasisProvider value="hero">
        <PriceTag name="Alpha" price="11.80" change="+18.00%" tone="up" />
      </EmphasisProvider>
      <Cluster gap="space-3">
        <PriceTag name="Beta" price="10.20" change="-15.00%" tone="down" />
        <PriceTag name="Gamma" price="9.99" change="0.00%" />
      </Cluster>
    </Stack>
  )
}
