// SPDX-License-Identifier: MIT
import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Loading } from './loading.tsx'
import type { LoadingLabels } from './loading-view.tsx'

const labels: LoadingLabels = {
  skeleton: 'SKELETON',
  content: 'CONTENT',
  noResponse: 'NO RESPONSE',
  loadingLed: 'LOADING',
  retry: 'RETRY',
  loading: (name) => `loading ${name}`,
  slow: () => 'slow',
  timeout: () => 'timeout',
}

const never = new Promise<never>(() => {})
function Suspends(): never {
  throw never
}

describe('Loading 的模式按属性在不在判', () => {
  it('不写 pending：自己是 Suspense 边界，接住挂起的子件', () => {
    const html = renderToStaticMarkup(
      <Suspense fallback="OUTER">
        <Loading labels={labels}>
          <Suspends />
        </Loading>
      </Suspense>,
    )
    expect(html).not.toContain('OUTER')
  })

  it('pending={undefined}：仍是等数据（当没在等），不静默切成 Suspense，挂起交给外层', () => {
    const html = renderToStaticMarkup(
      <Suspense fallback="OUTER">
        <Loading labels={labels} pending={undefined}>
          <Suspends />
        </Loading>
      </Suspense>,
    )
    expect(html).toContain('OUTER')
  })

  it('pending={false}：直接出 children', () => {
    expect(renderToStaticMarkup(<Loading labels={labels} pending={false}>READY</Loading>)).toContain('READY')
  })
})
