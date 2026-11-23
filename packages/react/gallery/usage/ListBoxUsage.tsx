// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ListBox } from '../../src/index'

export function ListBoxUsage() {
  const [account, setAccount] = useState<string[]>(['a'])
  return (
    <div style={{ width: 260 }}>
      <ListBox
        label="Account"
        bordered
        value={account}
        onValueChange={setAccount}
        items={[
          { id: 'a', label: 'Account A', description: 'Cash', trailing: '182,400.00' },
          { id: 'b', label: 'Account B', description: 'Margin', trailing: '56,120.50' },
          { id: 'sim', label: 'Paper', description: 'Local', trailing: '1,000,000.00' },
        ]}
      />
    </div>
  )
}
