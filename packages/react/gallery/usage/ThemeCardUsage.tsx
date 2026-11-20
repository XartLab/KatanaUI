// SPDX-License-Identifier: MIT
import { ThemeCards } from '../../src/cn'

export function ThemeCardUsage() {
  return (
    <ThemeCards
      themes={[
        {
          key: 'robot',
          name: 'Robotics',
          catalyst: { text: 'New humanoid model announced', source: 'Exchange notice' },
          members: [
            { code: '000001', name: 'Alpha', time: '10:14', streak: 1 },
            { code: '000002', name: 'Beta', time: '10:34', streak: 2 },
          ],
        },
      ]}
      onOpen={(key) => console.log(key)}
    />
  )
}
