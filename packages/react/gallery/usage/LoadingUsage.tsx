// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Loading, type LoadingLabels } from '../../src/index'

const LABELS: LoadingLabels = {
  skeleton: 'Loading',
  content: 'content',
  noResponse: 'No response',
  loadingLed: 'Loading',
  retry: 'Retry',
  loading: (name, source) => (source ? `Loading ${name} · ${source}` : `Loading ${name}`),
  slow: (source) => (source ? `Still loading · ${source}` : 'Still loading'),
  timeout: (source) => (source ? `Retry · ${source} silent for 10s` : 'Retry · silent for 10s'),
}

export function LoadingUsage() {
  const [pending, setPending] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setPending((p) => !p)}>
        {pending ? 'Data arrived' : 'Wait again'}
      </button>
      <Loading labels={LABELS} pending={pending} what="limit-up pool" source="local service">
        <p>Data arrived.</p>
      </Loading>
    </>
  )
}
