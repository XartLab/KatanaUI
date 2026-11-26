// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { typeToSearchKey } from './use-type-to-search.ts'

// #77：哪些键打开搜索。真浏览器里的整条流程（焦点在图上敲字 → 弹出、框里带字）在 e2e/ui-gallery.spec.ts 验。
const press = (key: string, extra: Partial<Parameters<typeof typeToSearchKey>[0]> = {}) =>
  typeToSearchKey({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    defaultPrevented: false,
    repeat: false,
    target: null,
    ...extra,
  })

describe('typeToSearchKey', () => {
  it('字母、数字、标点、单个汉字都打开，返回这个字', () => {
    expect(press('a')).toBe('a')
    expect(press('6')).toBe('6')
    expect(press('.')).toBe('.')
    expect(press('茅')).toBe('茅')
  })

  it('空格、功能键、输入法组字、按住修饰键、自动重复、已被占用的都不管', () => {
    expect(press(' ')).toBeNull()
    expect(press('Enter')).toBeNull()
    expect(press('ArrowDown')).toBeNull()
    expect(press('Process')).toBeNull()
    expect(press('a', { isComposing: true })).toBeNull()
    // Safari 上屏那一下：isComposing 已是 false，keyCode 仍是 229。
    expect(press('a', { keyCode: 229 })).toBeNull()
    expect(press('k', { ctrlKey: true })).toBeNull()
    expect(press('k', { metaKey: true })).toBeNull()
    expect(press('w', { altKey: true })).toBeNull()
    expect(press('a', { repeat: true })).toBeNull()
    expect(press('a', { defaultPrevented: true })).toBeNull()
  })
})
