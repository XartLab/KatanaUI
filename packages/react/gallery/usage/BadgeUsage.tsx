// SPDX-License-Identifier: MIT
import { BadgeGroup } from '../../src/index'

export function BadgeUsage() {
  return <BadgeGroup items={[{ id: 'star', label: 'S', text: 'STAR market: 20% daily limit' }]} />
}
