// SPDX-License-Identifier: MIT
// 组件截图：src/patterns 里的公开件。演示直接用 gallery/usage 里最小的一份；浮层件用 OpenFrame 摆成打开态，要点开的件在测试里点一下。
import { beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { PlayIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Calendar,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  CommandDialog,
  CommandPalette,
  DateRangePicker,
  FilterBar,
  ViewSwitcher,
  type FilterBarLabels,
  type FilterCondition,
  type FilterField,
  type PaletteStep,
  type StepSelections,
} from '../src/index.ts'
import { EXAMPLE_EVENTS, EXAMPLE_INSIGHT } from '../gallery/research-calendar-data.ts'
import { FileImportUsage } from '../gallery/usage/FileImportUsage.tsx'
import { TemplateLibraryUsage } from '../gallery/usage/TemplateLibraryUsage.tsx'
import { CommandSteps, DEFAULT_STEP_LABELS } from '../src/patterns/command-steps.tsx'
import { AnimatedFileUploadUsage } from '../gallery/usage/AnimatedFileUploadUsage.tsx'
import { ChipGroupUsage } from '../gallery/usage/ChipGroupUsage.tsx'
import { ListBoxUsage } from '../gallery/usage/ListBoxUsage.tsx'
import { DateRangePickerUsage } from '../gallery/usage/DateRangePickerUsage.tsx'
import { DateTimeInputUsage } from '../gallery/usage/DateTimeInputUsage.tsx'
import { DeleteButtonUsage } from '../gallery/usage/DeleteButtonUsage.tsx'
import { DockUsage } from '../gallery/usage/DockUsage.tsx'
import { DurationPickerUsage } from '../gallery/usage/DurationPickerUsage.tsx'
import { ExpandableCardsUsage } from '../gallery/usage/ExpandableCardsUsage.tsx'
import { ExpandableNavbarUsage } from '../gallery/usage/ExpandableNavbarUsage.tsx'
import { FileTreeUsage } from '../gallery/usage/FileTreeUsage.tsx'
import { FloatingNavbarUsage } from '../gallery/usage/FloatingNavbarUsage.tsx'
import { HoldToConfirmUsage } from '../gallery/usage/HoldToConfirmUsage.tsx'
import { MultiSelectUsage } from '../gallery/usage/MultiSelectUsage.tsx'
import { NumberInputUsage } from '../gallery/usage/NumberInputUsage.tsx'
import { PasswordInputUsage } from '../gallery/usage/PasswordInputUsage.tsx'
import { RangeHistogramSliderUsage } from '../gallery/usage/RangeHistogramSliderUsage.tsx'
import { RenderingSettingsUsage } from '../gallery/usage/RenderingSettingsUsage.tsx'
import { RichPopoverUsage } from '../gallery/usage/RichPopoverUsage.tsx'
import { ShortcutRecorderUsage } from '../gallery/usage/ShortcutRecorderUsage.tsx'
import { HotkeysUsage } from '../gallery/usage/HotkeysUsage.tsx'
import { ShortcutSheetUsage } from '../gallery/usage/ShortcutSheetUsage.tsx'
import { SideNavUsage } from '../gallery/usage/SideNavUsage.tsx'
import { TaskListUsage } from '../gallery/usage/TaskListUsage.tsx'
import { ThemeSelectorUsage } from '../gallery/usage/ThemeSelectorUsage.tsx'
import { TimeMachineStackUsage } from '../gallery/usage/TimeMachineStackUsage.tsx'
import { TreeViewUsage } from '../gallery/usage/TreeViewUsage.tsx'
import { OpenFrame } from './open-frame.tsx'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

const OPS = [
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
]
const FIELDS: readonly FilterField[] = [
  { key: 'price', label: 'Price', group: 'Market', shown: true, operators: OPS },
  { key: 'pe', label: 'P/E', group: 'Valuation', shown: true, operators: OPS },
]
const BAR_LABELS: FilterBarLabels = {
  bar: 'Filters',
  add: 'Add filter',
  more: 'More',
  reset: 'Reset all filters',
  search: 'Search',
  noMatch: 'No match',
  presets: 'Presets',
  manual: 'Manual',
  operator: 'Operator',
  value: 'Value',
  apply: 'Apply',
  remove: 'Remove filter',
  clear: 'Clear',
  back: 'Back',
  otherGroup: 'Other',
  undo: 'Undo',
  redo: 'Redo',
}
const CONDITIONS: FilterCondition[] = [
  { id: 'c1', field: 'price', op: 'gt', value: '100' },
  { id: 'c2', field: 'pe', op: 'lt', value: '20' },
]

function FilterBarDemo() {
  const [value, setValue] = useState(CONDITIONS)
  return <FilterBar fields={FIELDS} value={value} onValueChange={setValue} labels={BAR_LABELS} />
}

const STEPS: readonly PaletteStep[] = [
  {
    kind: 'checklist',
    id: 'market',
    joiner: 'in',
    heading: 'Select market',
    options: [
      { id: 'us', label: 'US', description: '312 symbols' },
      { id: 'hk', label: 'Hong Kong', description: '148 symbols' },
      { id: 'cn', label: 'China A', description: '96 symbols' },
    ],
  },
  { kind: 'checklist', id: 'fields', joiner: 'with', options: [{ id: 'ohlc', label: 'OHLC' }] },
]

function StepsDemo() {
  const [selections, setSelections] = useState<StepSelections>({ market: ['us', 'hk'] })
  const [search, setSearch] = useState('')
  return (
    <CommandDialog open onOpenChange={() => {}} title="Bulk export" description="Pick markets and fields">
      <CommandSteps
        title="Bulk export"
        icon={<PlayIcon />}
        steps={STEPS}
        index={0}
        selections={selections}
        onSelectionsChange={setSelections}
        labels={DEFAULT_STEP_LABELS}
        placeholder="Search…"
        empty="No match"
        search={search}
        onSearchChange={setSearch}
        onBack={() => {}}
        onAdvance={() => {}}
      />
    </CommandDialog>
  )
}

const settle = () => new Promise((r) => setTimeout(r, 600))

beforeAll(async () => {
  await page.viewport(900, 1400)
})

for (const theme of ['graphite', 'console'] as const) {
  const shot = async (name: string, node: React.ReactNode, act?: () => Promise<void>) => {
    await mount(<div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>{node}</div>, theme)
    await act?.()
    await settle()
    await settled()
    await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-${name}`)
  }
  describe(theme, () => {
    // #226：日历的事件点与洞察（单独的 Calendar 带 events 与 insight，选中 11-20，读数行读选中日的事）。
    test('calendar-events', () =>
      shot(
        'calendar-events',
        <Calendar
          label="Go to date"
          locale="en-US"
          labels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
          defaultValue="2026-11-20"
          events={EXAMPLE_EVENTS}
          insight={EXAMPLE_INSIGHT}
        />,
      ))
    test('file-import', () => shot('file-import', <FileImportUsage />))
    test('template-library', () => shot('template-library', <TemplateLibraryUsage />))
    test('animated-file-upload', () => shot('animated-file-upload', <AnimatedFileUploadUsage />))
    test('chip-group', () => shot('chip-group', <ChipGroupUsage />))
    test('combobox', () =>
      shot(
        'combobox',
        <OpenFrame width={240} height={200}>
          <Combobox open>
            <ComboboxTrigger aria-label="Timeframe">
              <span>1h</span>
            </ComboboxTrigger>
            <ComboboxContent label="Search timeframes">
              <ComboboxInput placeholder="Search" />
              <ComboboxList>
                <ComboboxEmpty>No match</ComboboxEmpty>
                {['1m', '5m', '1h', '1d'].map((frame) => (
                  <ComboboxItem key={frame} value={frame} selected={frame === '1h'} onSelect={() => {}}>
                    {frame}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </OpenFrame>,
      ))
    test('date-range-picker', () => shot('date-range-picker', <DateRangePickerUsage />))
    // commit="apply" 的打开态（#192）：点起点 7 号、悬停到 18 号——预览区间、脚上写「12 days selected」、应用还禁用。英文文案（沙箱 CJK 字形与基线不一致，#202）。
    test('date-range-picker-apply', () =>
      shot(
        'date-range-picker-apply',
        <OpenFrame width={700} height={420}>
          {/* 弹层在 OpenFrame 里是文档流、跟在触发钮后面：让它换到下一行，才像真的挂在输入框下面。 */}
          <style>
            {'.shot-open .k-dr{flex-wrap:wrap}.shot-open .k-dr [data-radix-popper-content-wrapper]{flex-basis:100%}'}
          </style>
          <DateRangePicker
            commit="apply"
            value={null}
            onValueChange={() => {}}
            today="2026-11-14"
            locale="en-CA"
            labels={{
              start: 'Start',
              end: 'End',
              pickRange: 'Pick range',
              calendar: 'Range calendar',
              previousMonth: 'Previous month',
              nextMonth: 'Next month',
              presets: 'Presets',
              preset: { today: 'Today', week: 'This week', month: 'This month', ytd: 'Year to date' },
              custom: 'Custom',
              pickFirst: 'Pick the first day',
              selected: (days) => `${days} ${days === 1 ? 'day' : 'days'} selected`,
              apply: 'Apply',
              clear: 'Clear',
            }}
          />
        </OpenFrame>,
        async () => {
          await page.getByRole('button', { name: 'Pick range' }).click()
          await page.getByRole('button', { name: /December 7, 2026/ }).click()
          await page.getByRole('button', { name: /December 18, 2026/ }).hover()
        },
      ))
    test('date-time-input', () => shot('date-time-input', <DateTimeInputUsage />))
    test('delete-button', () => shot('delete-button', <DeleteButtonUsage />))
    test('dock', () => shot('dock', <DockUsage />))
    test('duration-picker', () => shot('duration-picker', <DurationPickerUsage />))
    test('expandable-cards', () =>
      shot('expandable-cards', <ExpandableCardsUsage />, async () => {
        document.querySelector<HTMLElement>('[aria-expanded]')?.click()
      }))
    test('expandable-navbar', () =>
      shot('expandable-navbar', <ExpandableNavbarUsage />, async () => {
        document.querySelector<HTMLElement>('[aria-expanded]')?.click()
      }))
    test('file-tree', () => shot('file-tree', <FileTreeUsage />))
    test('filter-bar', () => shot('filter-bar', <FilterBarDemo />))
    test('floating-navbar', () => shot('floating-navbar', <FloatingNavbarUsage />))
    test('hold-to-confirm', () => shot('hold-to-confirm', <HoldToConfirmUsage />))
    test('multi-select', () => shot('multi-select', <MultiSelectUsage />))
    test('number-input', () => shot('number-input', <NumberInputUsage />))
    test('password-input', () => shot('password-input', <PasswordInputUsage />))
    test('range-histogram-slider', () =>
      shot(
        'range-histogram-slider',
        <div style={{ width: 420 }}>
          <RangeHistogramSliderUsage />
        </div>,
      ))
    test('rendering-settings', () => shot('rendering-settings', <RenderingSettingsUsage />))
    test('rich-popover', () =>
      shot(
        'rich-popover',
        <OpenFrame width={340} height={360}>
          <div style={{ paddingTop: 140 }}>
            <RichPopoverUsage />
          </div>
        </OpenFrame>,
        async () => {
          document.querySelector<HTMLButtonElement>('.shot-open button')!.click()
        },
      ))
    test('shortcut-recorder', () => shot('shortcut-recorder', <ShortcutRecorderUsage />))
    test('hotkeys', () => shot('hotkeys', <HotkeysUsage />))
    test('shortcut-sheet', () => shot('shortcut-sheet', <ShortcutSheetUsage />))
    test('command-palette', () =>
      shot(
        'command-palette',
        <OpenFrame width={560} height={360}>
          <CommandPalette
            open
            onOpenChange={() => {}}
            recent={['snapshot']}
            commands={[
              {
                id: 'reset',
                label: 'Reset chart',
                group: 'Chart',
                description: 'Default zoom and studies',
                shortcut: 'Alt+R',
                onSelect: () => {},
              },
              { id: 'snapshot', label: 'Take snapshot', group: 'Chart', onSelect: () => {} },
              {
                id: 'export',
                label: 'Bulk export',
                group: 'Data',
                description: 'By market and field',
                steps: [
                  { kind: 'checklist', id: 'market', options: [{ id: 'us', label: 'US' }] },
                  { kind: 'checklist', id: 'fields', options: [{ id: 'ohlc', label: 'OHLC' }] },
                ],
                onSelect: () => {},
              },
              { id: 'theme', label: 'Switch theme', group: 'Settings', onSelect: () => {} },
            ]}
            labels={{
              title: 'Command palette',
              description: 'Search commands',
              placeholder: 'Search…',
              empty: 'No command matches',
              recent: 'Recent',
            }}
          />
        </OpenFrame>,
      ))
    // 多步命令的步骤页（#194）：第一步，勾了两项，全选是半选，头部句子带两个小标签。
    test('command-steps', () =>
      shot(
        'command-steps',
        <OpenFrame width={560} height={420}>
          <StepsDemo />
        </OpenFrame>,
      ))
    test('side-nav', () => shot('side-nav', <SideNavUsage />))
    test('task-list', () => shot('task-list', <TaskListUsage />))
    test('theme-selector', () => shot('theme-selector', <ThemeSelectorUsage />))
    test('time-machine-stack', () => shot('time-machine-stack', <TimeMachineStackUsage />))
    test('tree-view', () => shot('tree-view', <TreeViewUsage />))
    // A fixed month far from today, so the today mark never lands in the shot.
    test('calendar', () =>
      shot(
        'calendar',
        <Calendar
          label="Go to date"
          locale="en-US"
          labels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
          defaultValue="2024-03-15"
          unavailable={(day) => [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())}
        />,
      ))
    test('list-box', () => shot('list-box', <ListBoxUsage />))
    test('view-switcher', () =>
      shot(
        'view-switcher',
        <OpenFrame width={260} height={180}>
          <ViewSwitcher
            views={[
              { key: 'a', label: 'Momentum' },
              { key: 'b', label: 'Value' },
            ]}
            value="a"
            onValueChange={() => {}}
            onSave={() => {}}
            labels={{ trigger: 'Saved screens', save: 'Save as…' }}
          />
        </OpenFrame>,
        async () => {
          document
            .querySelector<HTMLButtonElement>('.shot-open button')!
            .dispatchEvent(
              new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: false, pointerType: 'mouse' }),
            )
        },
      ))
  })
}
