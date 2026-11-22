// SPDX-License-Identifier: MIT
import { BarChart3, FlaskConical, Newspaper } from 'lucide-react'
import { Dock } from '../../src/index'

export function DockUsage() {
  return (
    <Dock
      label="Workbench tools"
      items={[
        { id: 'chart', label: 'Chart', icon: <BarChart3 />, active: true },
        { id: 'backtest', label: 'Backtest', icon: <FlaskConical /> },
        { id: 'news', label: 'News', icon: <Newspaper /> },
      ]}
    />
  )
}
