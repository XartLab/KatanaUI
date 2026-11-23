// SPDX-License-Identifier: MIT
import { Breadcrumb } from '../../src/index'

export function BreadcrumbUsage() {
  return (
    <Breadcrumb
      label="Location"
      items={[{ label: 'Strategies', href: '#' }, { label: 'Momentum', href: '#' }, { label: 'Backtest 2026-11' }]}
    />
  )
}
