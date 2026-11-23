// SPDX-License-Identifier: MIT
import { ExpandableNavbar } from '../../src/index'

export function ExpandableNavbarUsage() {
  return (
    <ExpandableNavbar
      label="Workspaces"
      width={420}
      items={[
        { id: 'markets', label: 'Markets', panel: 'Watchlists, heatmaps and the news wire.' },
        { id: 'research', label: 'Research', panel: 'Backtests, factor library and notes.' },
      ]}
    />
  )
}
