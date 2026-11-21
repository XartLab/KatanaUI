// SPDX-License-Identifier: MIT
import { DataGrid } from '../../src/blocks'
import { EmphasisProvider, QuoteCard, Stack } from '../../src/index'

const rows = [{ id: 'a', name: 'Alpha' }]

// 一个区：最多一处 hero（这一块的主角），正文用默认，边栏里的一行用 compact。
export function EmphasisGuideUsage() {
  return (
    <Stack gap="space-4">
      <EmphasisProvider value="hero">
        <QuoteCard name="Alpha" symbol="AAA" price="11.80" change="+1.80" percent="+18.00%" tone="up" />
      </EmphasisProvider>
      <DataGrid
        columns={[{ id: 'name', type: 'text', value: (row: (typeof rows)[number]) => row.name }]}
        layout={[{ id: 'name', label: 'Name', width: 160, visible: true }]}
        rows={rows}
        rowId={(row) => row.id}
        label="Watchlist"
      />
    </Stack>
  )
}
