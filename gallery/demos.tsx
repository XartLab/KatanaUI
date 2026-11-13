// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentType } from 'react'
import { DateTimeInputDemo, NumberInputDemo, SkeletonDemo } from './pages/fields'
import { BadgeDemo, DotMatrixDemo, KbdDemo, LcdDemo, LedDemo, RollingTextDemo } from './pages/readouts'
import {
  AiStatusDemo,
  DeleteButtonDemo,
  MatrixOrbDemo,
  NotificationBellDemo,
  PasswordInputDemo,
  StatusIconDemo,
} from './pages/rare'
import {
  CodeBlockDemo,
  DurationPickerDemo,
  StepPlayerDemo,
  TaskListDemo,
  ThemeSelectorDemo,
  WebSearchDemo,
} from './pages/rare2'
import { AccordionDemo, TabsDemo } from './pages/layout'
import { ContextMenuDemo, DialogDemo, DropdownMenuDemo, PopoverDemo, TooltipDemo } from './pages/overlays'
import {
  ButtonDemo,
  CheckboxDemo,
  InputDemo,
  MultiSelectDemo,
  SelectDemo,
  SliderDemo,
  SwitchDemo,
  ToggleGroupDemo,
} from './pages/forms'

/** 每一页的实时预览，键是 registry.ts 里的页 id（registry.test.ts 核对两边一一对应）。 */
export const DEMOS: Readonly<Record<string, ComponentType>> = {
  button: ButtonDemo,
  input: InputDemo,
  select: SelectDemo,
  'multi-select': MultiSelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  'toggle-group': ToggleGroupDemo,
  slider: SliderDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  dialog: DialogDemo,
  'dropdown-menu': DropdownMenuDemo,
  'context-menu': ContextMenuDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  led: LedDemo,
  lcd: LcdDemo,
  'dot-matrix': DotMatrixDemo,
  'rolling-text': RollingTextDemo,
  badge: BadgeDemo,
  kbd: KbdDemo,
  'number-input': NumberInputDemo,
  'date-time-input': DateTimeInputDemo,
  skeleton: SkeletonDemo,
  'password-input': PasswordInputDemo,
  'delete-button': DeleteButtonDemo,
  'notification-bell': NotificationBellDemo,
  'status-icon': StatusIconDemo,
  'ai-status': AiStatusDemo,
  'matrix-orb': MatrixOrbDemo,
  'step-player': StepPlayerDemo,
  'theme-selector': ThemeSelectorDemo,
  'code-block': CodeBlockDemo,
  'web-search': WebSearchDemo,
  'task-list': TaskListDemo,
  'duration-picker': DurationPickerDemo,
}
