// SPDX-License-Identifier: MIT
/**
 * Undo / redo through the hotkey registry: registers Mod+Z and Mod+Shift+Z (plus Ctrl+Y off Mac) with useHotkeys for an undo stack.
 * 撤销 / 重做交给快捷键注册表（#87 补充第 5 条）：用了 useHotkeys 的面板不开 useUndoStack 自带的 hotkeys，改用这个钩子登记两条，
 * 快捷键总览里列得出、能改键、跟别的快捷键一起查冲突。组合跟 useUndoStack 自带的那套一样（TradingView 也是 Ctrl+Z / Ctrl+Y）：
 * Mod+Z 撤销；Mod+Shift+Z 重做，非 Mac 再加 Ctrl+Y；写法是 shortcut-model 的规范串，焦点在输入框里不触发（让浏览器自己的文字撤销生效）。
 */
import type { UndoStack } from '../lib/use-undo-stack.ts'
import { useHotkeyRegistry, useHotkeys, type HotkeyBinding } from './hotkeys.tsx'
import type { HotkeyPlatform } from './hotkeys-model.ts'

export type UndoHotkeysOptions = {
  /** Names in the shortcuts overview (written by the caller). */
  labels: { undo: string; redo: string }
  /** Scope of both bindings; defaults to global. */
  scope?: string
  /** False turns both off (e.g. while the panel is not focused); defaults to true. */
  enabled?: boolean
  /** Id prefix, so two stacks on one page do not replace each other; defaults to "undo-stack". */
  id?: string
}

/** 两条绑定（纯函数，钩子与单测共用）：Mac 上没有 Ctrl+Y。 */
export function undoHotkeyBindings(
  stack: Pick<UndoStack<unknown>, 'undo' | 'redo'>,
  { labels, scope, enabled, id = 'undo-stack' }: UndoHotkeysOptions,
  platform: HotkeyPlatform,
): HotkeyBinding[] {
  return [
    { id: `${id}.undo`, combo: 'Mod+Z', label: labels.undo, scope, enabled, handler: () => stack.undo() },
    {
      id: `${id}.redo`,
      combo: platform === 'mac' ? ['Mod+Shift+Z'] : ['Mod+Shift+Z', 'Ctrl+Y'],
      label: labels.redo,
      scope,
      enabled,
      handler: () => stack.redo(),
    },
  ]
}

/** 在注册表里登记一个撤销栈的撤销 / 重做；平台取注册表的。 */
export function useUndoHotkeys(stack: Pick<UndoStack<unknown>, 'undo' | 'redo'>, options: UndoHotkeysOptions): void {
  const { platform } = useHotkeyRegistry()
  useHotkeys(undoHotkeyBindings(stack, options, platform))
}
