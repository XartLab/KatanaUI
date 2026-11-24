// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FileImport, type FileImportLabels, type ImportItem } from '../../src/index'

const LABELS: FileImportLabels = {
  sources: 'Sources',
  source: { upload: 'Upload', paste: 'Paste', link: 'Link' },
  upload: {
    zone: 'Import research material. Drag files here or press to browse',
    idle: 'Drop reports, factor tables or backtest results, or click to browse',
    dragging: 'Drop to import',
    tooLarge: (count, limit) => `${count} file(s) are over ${limit}`,
  },
  list: 'Added material',
  count: (total) => `${total} ${total === 1 ? 'item' : 'items'} added`,
  status: {
    queued: 'Waiting',
    uploading: (percent) => (percent === null ? 'Uploading' : `${percent}% uploading`),
    done: 'Complete',
    failed: 'Failed',
  },
  retry: (name) => `Retry ${name}`,
  remove: (name) => `Remove ${name}`,
  paste: { label: 'Pasted text', placeholder: 'Paste a research summary', submit: 'Add' },
  link: {
    label: 'Material link',
    placeholder: 'https://',
    submit: 'Add',
    invalid: 'Enter a link that starts with http or https',
  },
}

export function FileImportUsage() {
  const [items, setItems] = useState<readonly ImportItem[]>([
    { id: '1', name: 'alpha_report_q3.pdf', size: 2_411_000, status: 'uploading', progress: 62 },
    { id: '2', name: 'factors_2026.csv', size: 18_300_000, status: 'done' },
    { id: '3', name: 'backtest_result.parquet', size: 692_000, status: 'failed', error: 'Network lost' },
  ])
  return (
    <FileImport
      items={items}
      accept=".pdf,.csv,.parquet"
      labels={LABELS}
      // Uploading is yours: start it here, then update the rows' status and progress.
      onFiles={(files) =>
        setItems((list) => [
          ...list,
          ...files.map((file, index) => ({
            id: `${file.name}-${list.length + index}`,
            name: file.name,
            size: file.size,
            status: 'uploading' as const,
            progress: 0,
          })),
        ])
      }
      onPaste={(text) =>
        setItems((list) => [...list, { id: `p${list.length}`, name: text.slice(0, 24), status: 'done' }])
      }
      onLink={(url) => setItems((list) => [...list, { id: `l${list.length}`, name: url, status: 'queued' }])}
      onRetry={(id) =>
        setItems((list) => list.map((item) => (item.id === id ? { ...item, status: 'uploading', progress: 0 } : item)))
      }
      onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))}
    />
  )
}
