// SPDX-License-Identifier: MIT
// 组件截图：TagCombobox（patterns/tag-combobox.tsx）与单选 Combobox 新加的 prefix / description 两个槽。
// 浮层用 OpenFrame 摆成打开态；过滤态在测试里往输入框打字。测试名等于文件名（快速模式按它认件）。
import { beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  TagCombobox,
  type TagComboboxOption,
} from '../src/index.ts'
import { OpenFrame } from './open-frame.tsx'
import { mount } from './render.tsx'

const initials = (text: string) => (
  <span
    style={{
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      height: '100%',
      background: 'var(--k-container-subtle-background)',
      color: 'var(--k-content-body-foreground)',
      font: '500 9px/1 var(--font-sans-small)',
    }}
  >
    {text}
  </span>
)

const OPTIONS: readonly TagComboboxOption[] = [
  { id: 'aisha', label: 'Aisha Khan', description: 'Design lead', prefix: initials('AK') },
  { id: 'amara', label: 'Amara Okafor', description: 'Designer', prefix: initials('AO') },
  { id: 'anika', label: 'Anika Patel', description: 'Content designer', prefix: initials('AP') },
  { id: 'ben', label: 'Ben Carter', description: 'Engineer', prefix: initials('BC') },
  { id: 'elena', label: 'Elena Petrova', description: 'Product manager', prefix: initials('EP') },
  { id: 'hannah', label: 'Hannah Fischer', description: 'Product manager', prefix: initials('HF') },
  { id: 'jonas', label: 'Jonas Weber', description: 'Engineering manager', prefix: initials('JW') },
]
const LABELS = { remove: (name: string) => `Remove ${name}`, empty: 'No match', toggle: 'Show options' }

const settle = () => new Promise((r) => setTimeout(r, 600))

beforeAll(async () => {
  await page.viewport(900, 1000)
})

for (const theme of ['graphite', 'console'] as const) {
  const shot = async (name: string, node: React.ReactNode, act?: () => Promise<void>) => {
    await mount(<div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>{node}</div>, theme)
    await act?.()
    await settle()
    await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-${name}`)
  }
  const field = (props: Partial<React.ComponentProps<typeof TagCombobox>> = {}) => (
    <OpenFrame width={340} height={380}>
      <TagCombobox
        label="Reviewers"
        options={OPTIONS}
        defaultValue={['aisha', 'anika', 'elena']}
        defaultOpen
        placeholder="Add people"
        labels={LABELS}
        {...props}
      />
    </OpenFrame>
  )
  describe(theme, () => {
    // 打开：三个标签，已选行尾有勾，第一行是高亮行。
    test('tag-combobox', () => shot('tag-combobox', field()))
    // 过滤：输入 an，命中的字加粗提亮（主文字与说明里都标）。
    test('tag-combobox-filtered', () =>
      shot('tag-combobox-filtered', field(), async () => {
        await page.getByRole('combobox', { name: 'Reviewers' }).fill('an')
      }))
    // 标签换行：字段长高，弹层贴着字段下沿。
    test('tag-combobox-wrapped', () =>
      shot('tag-combobox-wrapped', field({ defaultValue: ['aisha', 'amara', 'anika', 'ben', 'elena', 'hannah'] })))
    test('tag-combobox-empty', () =>
      shot('tag-combobox-empty', field({ defaultValue: [], defaultOpen: false, placeholder: 'Add people' })))
    // 单选 Combobox 的新槽：前缀节点与第二行说明。
    test('combobox-rich', () =>
      shot(
        'combobox-rich',
        <OpenFrame width={260} height={240}>
          <Combobox open>
            <ComboboxTrigger aria-label="Venue" style={{ width: 240 }}>
              <span>Hong Kong Exchanges</span>
            </ComboboxTrigger>
            <ComboboxContent label="Search venues">
              <ComboboxInput placeholder="Search" />
              <ComboboxList>
                {[
                  ['sh', 'Shanghai Exchange', 'A shares', 'SH'],
                  ['hk', 'Hong Kong Exchanges', 'Main board', 'HK'],
                  ['us', 'Nasdaq', 'US tech', 'US'],
                ].map(([id, name, note, code]) => (
                  <ComboboxItem
                    key={id}
                    value={id!}
                    selected={id === 'hk'}
                    prefix={<span className="k-text-micro text-(color:--k-content-secondary-foreground)">{code}</span>}
                    description={note}
                    onSelect={() => {}}
                  >
                    {name}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </OpenFrame>,
      ))
  })
}
