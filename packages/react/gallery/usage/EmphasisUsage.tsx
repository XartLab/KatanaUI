// SPDX-License-Identifier: MIT
import { EmphasisProvider, GaugeBar, QuoteCard, useEmphasis } from '../../src/index'

function Current() {
  return <small>当前分量：{useEmphasis()}</small>
}

export function EmphasisUsage() {
  return (
    <EmphasisProvider value="hero">
      <QuoteCard name="Alpha" symbol="AAA" price="11.80" change="+1.80" percent="+18.00%" tone="up" />
      <EmphasisProvider value="compact">
        <GaugeBar label="Ratio" value="72.00%" share={0.72} />
        <Current />
      </EmphasisProvider>
    </EmphasisProvider>
  )
}
