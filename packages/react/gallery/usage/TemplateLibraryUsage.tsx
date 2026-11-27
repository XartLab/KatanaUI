// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TemplateLibrary, type TemplateGroup, type TemplateLibraryLabels } from '../../src/index'

const LABELS: TemplateLibraryLabels = {
  library: 'Template library',
  search: 'Search templates',
  tree: 'Templates',
  results: (count) => `${count} templates match`,
  noMatch: 'No template matches',
  empty: 'Pick a template on the left',
  titleField: 'Template name',
  titleEmpty: 'The name cannot be empty',
  bodyField: 'Template body',
  editHint: 'Press Enter or click to edit',
  title: {
    editHint: 'Press Enter or click to rename',
    save: 'Save name',
    cancel: 'Discard name change',
    failed: (attempted) => `Could not save "${attempted}"`,
    retry: 'Retry',
  },
  save: 'Save body (⌘↵)',
  cancel: 'Discard (Esc)',
  bodyFailed: 'Could not save; the body is back to the last saved text',
  meta: 'Template details',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  duplicate: 'Duplicate to mine',
  use: 'Use template',
  readOnly: 'Built-in template, read only',
}

const GROUPS: readonly TemplateGroup[] = [
  {
    id: 'mine',
    title: 'My templates',
    templates: [
      {
        id: 'momentum',
        title: 'Momentum strategy',
        body: 'Universe: CSI 300.\nSignal: 12-1 month return, ranked by cross-section.\nRebalance: first trading day of the month.',
        meta: [{ label: 'Created by', value: 'Me · 2026-11-20 09:10' }],
      },
    ],
  },
  {
    id: 'builtin',
    title: 'Built-in',
    readOnly: true,
    templates: [{ id: 'reversion', title: 'Mean reversion', body: 'Buy z-score below -2, exit at 0.' }],
  },
]

export function TemplateLibraryUsage() {
  const [groups, setGroups] = useState(GROUPS)
  return (
    <TemplateLibrary
      groups={groups}
      defaultValue="momentum"
      labels={LABELS}
      onSave={(id, patch) =>
        setGroups((current) =>
          current.map((group) => ({
            ...group,
            templates: group.templates.map((template) => (template.id === id ? { ...template, ...patch } : template)),
          })),
        )
      }
      onUse={(id) => console.log('use', id)}
    />
  )
}
