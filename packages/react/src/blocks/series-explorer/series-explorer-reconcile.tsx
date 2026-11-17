// SPDX-License-Identifier: MIT
// SeriesExplorer 的对账行：期初 → 期末、差额，灯 + 词（对上 ok、对不上 warn）。从 series-explorer.tsx 拆出（G5），行为不变。
import { Led } from '../../katana/led.tsx'
import type { SeriesExplorerLabels } from './series-explorer-types.ts'

export type SeriesReconcileProps = {
  recon: { open: number; close: number; diff: number }
  text: NonNullable<SeriesExplorerLabels['reconcile']>
  format: (value: number) => string
}

export function SeriesReconcile({ recon, text, format }: SeriesReconcileProps) {
  return (
    <div className="k-sx-recon" data-slot="series-reconcile" data-state={recon.diff === 0 ? 'ok' : 'warn'}>
      <span className="k-sx-recon-line" data-slot="series-reconcile-lcd">
        <span className="k-sx-kv">
          <small>{text.open}</small>
          <b>{format(recon.open)}</b>
          {text.unit ? <i>{text.unit}</i> : null}
        </span>
        <em aria-hidden="true">→</em>
        <span className="k-sx-kv">
          <small>{text.close}</small>
          <b>{format(recon.close)}</b>
          {text.unit ? <i>{text.unit}</i> : null}
        </span>
        <span className="k-sx-kv k-sx-recon-diff" data-slot="series-reconcile-diff">
          <small>{text.diff}</small>
          <b>{format(recon.diff)}</b>
          {text.unit ? <i>{text.unit}</i> : null}
        </span>
      </span>
      <span className="k-sx-recon-state">
        <Led state={recon.diff === 0 ? 'ok' : 'warn'} label={recon.diff === 0 ? text.ok : text.warn} />
        {recon.diff === 0 ? text.ok : text.warn}
      </span>
    </div>
  )
}
