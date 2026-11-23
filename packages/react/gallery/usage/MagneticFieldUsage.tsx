// SPDX-License-Identifier: MIT
import { MagneticField } from '../../src/index'

const ITEMS = ['Semis', 'Banks', 'Energy'].map((name) => ({ id: name, element: <span>{name}</span> }))

export function MagneticFieldUsage() {
  return <MagneticField items={ITEMS} mode="attract" />
}
