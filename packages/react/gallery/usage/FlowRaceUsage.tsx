// SPDX-License-Identifier: MIT
import { FlowRace } from '../../src/cn'

export function FlowRaceUsage() {
  return (
    <FlowRace
      series={[
        {
          key: 'chips',
          name: 'Chips',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: 180_000_000 },
            { time: '11:30', value: 260_000_000 },
            { time: '14:00', value: 410_000_000 },
            { time: '15:00', value: 520_000_000 },
          ],
        },
        {
          key: 'banks',
          name: 'Banks',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: -90_000_000 },
            { time: '11:30', value: -150_000_000 },
            { time: '14:00', value: -60_000_000 },
            { time: '15:00', value: -120_000_000 },
          ],
        },
        {
          key: 'robots',
          name: 'Robots',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: 60_000_000 },
            { time: '11:30', value: 210_000_000 },
            { time: '14:00', value: 300_000_000 },
            { time: '15:00', value: 330_000_000 },
          ],
        },
      ]}
      labels={{
        region: 'Sector money flow',
        ranking: 'Ranking',
        axis: { from: '09:30', mid: '11:30/13:00', to: '15:00' },
        empty: 'No flow data',
        unavailable: 'Not available',
        rankAria: (rank, name, value) => `No. ${rank} ${name} ${value}`,
      }}
    />
  )
}
