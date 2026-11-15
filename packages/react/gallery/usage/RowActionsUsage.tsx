// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RowActions, symbolMenu } from '../../src/index'

export function RowActionsUsage() {
  const [log, setLog] = useState('')
  const items = (code: string) =>
    symbolMenu({
      openChart: { label: 'Open chart', onSelect: () => setLog(`Open chart · ${code}`) },
      addToWatchlist: { label: 'Add to watchlist', onSelect: () => setLog(`Add to watchlist · ${code}`) },
      newAlert: { label: 'New alert', onSelect: () => setLog(`New alert · ${code}`) },
      copyCode: { label: 'Copy code', onSelect: () => setLog(`Copy code · ${code}`) },
    })
  return (
    <div className="gal-wide" style={{ maxWidth: 420 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {['ALFA', 'BRAV', 'CHAR'].map((code) => (
          <li
            key={code}
            className="k-row-host"
            style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 8px', fontSize: 12 }}
          >
            <span>{code}</span>
            <RowActions items={items(code)} label={`${code} actions`} />
          </li>
        ))}
      </ul>
      <p className="gal-note">{log ? `Last action: ${log}` : 'Last action: none yet'}</p>
    </div>
  )
}
