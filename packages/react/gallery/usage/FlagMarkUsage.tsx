// SPDX-License-Identifier: MIT
import { FlagFilter, FlagMark, useFlags, type FlagDef } from '../../src/index'

const FLAGS: readonly FlagDef[] = [
  { id: 'watch', label: 'Watch', color: 'danger' },
  { id: 'setup', label: 'Setup', color: 'warn' },
  { id: 'held', label: 'Held', color: 'ok' },
]
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

export function FlagMarkUsage() {
  const flags = useFlags({ flags: FLAGS, defaultValue: { BTCUSDT: 'watch', ETHUSDT: 'held' } })
  return (
    <div style={{ display: 'grid', gap: 6, width: 200 }}>
      <FlagFilter flags={flags} label="Filter by flag" />
      {flags
        .filterRows(SYMBOLS, (symbol) => symbol)
        .map((symbol) => (
          <div key={symbol} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlagMark
              flag={flags.flagOf(symbol)}
              onToggle={() => flags.toggle(symbol)}
              label={`Flag ${symbol}`}
              alwaysShown
            />
            {symbol}
          </div>
        ))}
    </div>
  )
}
