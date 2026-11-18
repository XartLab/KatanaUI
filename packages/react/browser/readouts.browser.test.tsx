// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { Button } from '../src/primitives/button.tsx'
import { Kbd } from '../src/katana/kbd.tsx'
import { Led } from '../src/katana/led.tsx'
import { Tag } from '../src/katana/tag.tsx'
import { mount } from './render.tsx'

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    test('kbd', async () => {
      await mount(<Kbd parts={['⌘', 'Shift', 'K']} label="Command Shift K" />, theme)
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-kbd`)
    })
    test('tag', async () => {
      await mount(
        <>
          {(['neutral', 'ok', 'warn', 'danger'] as const).map((tone) => (
            <Tag key={tone} tone={tone}>
              {tone}
            </Tag>
          ))}
          <Tag tone="warn" outlined size="sm">
            est
          </Tag>
        </>,
        theme,
      )
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-tag`)
    })
    test('led', async () => {
      await mount(
        <>
          {(['off', 'accent', 'ok', 'warn', 'danger'] as const).map((tone) => (
            <Led key={tone} tone={tone} label={tone} />
          ))}
        </>,
        theme,
      )
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-led`)
    })
    test('button', async () => {
      await mount(
        <>
          <Button variant="primary">Save</Button>
          <Button>Cancel</Button>
          <Button size="sm">Small</Button>
        </>,
        theme,
      )
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-button`)
    })
  })
}
