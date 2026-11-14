// SPDX-License-Identifier: MIT
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../src/index'

export function HoverCardUsage() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#/hover-card" className="text-ink underline">
          BTCUSDT.P
        </a>
      </HoverCardTrigger>
      <HoverCardContent>Perpetual swap, tick size 0.1.</HoverCardContent>
    </HoverCard>
  )
}
