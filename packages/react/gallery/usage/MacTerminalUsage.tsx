// SPDX-License-Identifier: MIT
import { MacTerminal } from '../../src/index'

export function MacTerminalUsage() {
  return (
    <MacTerminal
      title="backtest"
      labels={{ window: 'Backtest log replay' }}
      lines={[
        { id: '1', type: 'command', text: 'katana backtest momentum --from 2024-01-01' },
        { id: '2', type: 'output', text: 'loaded 1,248 bars' },
        { id: '3', type: 'success', text: 'sharpe 1.42  maxdd -8.3%' },
      ]}
    />
  )
}
