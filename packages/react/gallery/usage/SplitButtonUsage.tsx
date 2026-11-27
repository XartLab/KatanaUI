// SPDX-License-Identifier: MIT
import { SplitButton } from '../../src/index'

export function SplitButtonUsage() {
  return (
    <SplitButton
      variant="primary"
      labels={{ menu: 'More order types' }}
      onClick={() => {}}
      actions={[
        { key: 'market', label: 'Market', onSelect: () => {} },
        { key: 'stop', label: 'Stop order', onSelect: () => {} },
      ]}
    >
      Buy · Limit
    </SplitButton>
  )
}
