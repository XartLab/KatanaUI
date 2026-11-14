// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'
import { gentle, settle, snappy } from './motion'

const tokensCss = readFileSync(new URL('../tokens/tokens.css', import.meta.url), 'utf8')

describe('motion', () => {
  it('三个弹簧是 spring 类型，带 token 里的参数', () => {
    expect(snappy).toEqual({ type: 'spring', stiffness: 520, damping: 38, mass: 0.8, restDelta: 0.5 })
    expect(gentle).toMatchObject({ type: 'spring', stiffness: 260, damping: 30, mass: 1 })
    expect(settle).toMatchObject({ type: 'spring', stiffness: 180, damping: 28, mass: 1 })
  })

  it('CSS 缓动和时长跟弹簧同一份参数：tokens.css 里三个弹簧各有 --ease-* 与 --dur-*（sync-tokens 生成）', () => {
    for (const name of ['snappy', 'gentle', 'settle']) {
      expect(tokensCss, `--ease-${name}`).toContain(`--ease-${name}: linear(0, `)
      expect(tokensCss, `--dur-${name}`).toMatch(new RegExp(String.raw`--dur-${name}: \d+ms;`))
    }
  })
})
