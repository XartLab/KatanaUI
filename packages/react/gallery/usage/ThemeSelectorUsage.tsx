// SPDX-License-Identifier: MIT
import { ThemeSelector, type ThemeOption } from '../../src/index'

const colors = { rail: '#111', panel: '#181818', line: '#333', strong: '#eee', muted: '#888', tile: '#222' }
const THEMES: readonly ThemeOption[] = [
  { value: 'console', label: 'Console', colors },
  { value: 'graphite', label: 'Graphite', colors },
]

export function ThemeSelectorUsage() {
  return <ThemeSelector themes={THEMES} label="Theme" defaultValue="console" />
}
