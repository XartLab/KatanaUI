// SPDX-License-Identifier: MIT
import { Button, LinkGroupPicker, LinkGroupProvider, useLinkGroup, type LinkGroup } from '../../src/index'

function Panel({ name, defaultGroup }: { name: string; defaultGroup: LinkGroup | null }) {
  const link = useLinkGroup({ defaultValue: 'BTCUSDT', defaultGroup })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <LinkGroupPicker
        value={link.group}
        onValueChange={link.setGroup}
        labels={{ trigger: 'Link group', none: 'Unlinked' }}
      />
      <span style={{ width: 80 }}>{name}</span>
      <code style={{ width: 72 }}>{link.value}</code>
      <Button size="sm" onClick={() => link.setValue(link.value === 'ETHUSDT' ? 'BTCUSDT' : 'ETHUSDT')}>
        Switch
      </Button>
    </div>
  )
}

export function LinkGroupUsage() {
  return (
    <LinkGroupProvider defaultValue={{ A: 'BTCUSDT' }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <Panel name="Chart" defaultGroup="A" />
        <Panel name="Order book" defaultGroup="A" />
        <Panel name="News" defaultGroup={null} />
      </div>
    </LinkGroupProvider>
  )
}
