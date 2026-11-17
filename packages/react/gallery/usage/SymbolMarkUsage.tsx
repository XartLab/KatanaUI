// SPDX-License-Identifier: MIT
import { SymbolMark } from '../../src/index'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

export function SymbolMarkUsage() {
  return (
    <>
      <SymbolMark symbol="AAPL" name="Apple" />
      <SymbolMark symbol="600519" name="贵州茅台" />
      <SymbolMark symbol="00700" name="腾讯控股" />
      <SymbolMark symbol="BTCUSDT" name="Bitcoin" />

      <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} />
      <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} size="md" />

      <SymbolMark symbol="ETH" name="Ethereum" src="data:image/png;base64,broken" />
    </>
  )
}
