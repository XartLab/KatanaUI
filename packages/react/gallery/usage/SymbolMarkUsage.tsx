// SPDX-License-Identifier: MIT
import { SymbolMark } from '../../src/index'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

export function SymbolMarkUsage() {
  return (
    <>
      <SymbolMark code="AAPL" name="Apple" />
      <SymbolMark code="600519" name="贵州茅台" />
      <SymbolMark code="00700" name="腾讯控股" />
      <SymbolMark code="BTCUSDT" name="Bitcoin" />

      <SymbolMark code="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} />
      <SymbolMark code="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} size={28} />

      <SymbolMark code="ETH" name="Ethereum" src="data:image/png;base64,broken" />
    </>
  )
}
