// SPDX-License-Identifier: MIT
// 涨跌色能在任意子树上切（A 股看板与加密货币面板同屏，KATANAview #2164）：同一页里一个 data-updown="cn" 子树、一个默认子树、
// 一个 cn 里面再切回 intl 的子树，各自取到的涨色不同。取的是浏览器算出来的值，不比截图。
import { describe, expect, test } from 'vite-plus/test'
import { MatrixHeat } from '../src/quant/index.ts'
import { mount } from './render.tsx'

const ROWS = [{ id: 'x', label: 'X', cells: [{ value: 3 }, { value: -3 }] }]
const COLUMNS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
]
const heat = (id: string) => (
  <div data-testid={id}>
    <MatrixHeat scale="diverging" columns={COLUMNS} rows={ROWS} />
  </div>
)

const read = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim()

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    test('同一页：cn 子树、默认子树、cn 里的 intl 子树，涨色各取各的', async () => {
      await mount(
        <div>
          <section data-testid="def">{heat('def-heat')}</section>
          <section data-testid="cn" data-updown="cn">
            {heat('cn-heat')}
            <section data-testid="intl" data-updown="intl">
              {heat('intl-heat')}
            </section>
          </section>
        </div>,
        theme,
      )
      const el = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
      const [def, cn, intl] = [el('def'), el('cn'), el('intl')]
      // 根上没有 data-updown：根是默认。
      expect(document.documentElement.hasAttribute('data-updown')).toBe(false)
      // 自己的涨跌 token：cn 与默认相反，intl 切回默认。
      expect(read(cn, '--pnl-up')).not.toBe(read(def, '--pnl-up'))
      expect(read(cn, '--pnl-up')).toBe(read(def, '--pnl-down'))
      expect(read(intl, '--pnl-up')).toBe(read(def, '--pnl-up'))
      // 派生 token 也跟着换：它们在根上算成定值再继承，不在子树里重声明就会还是默认。
      expect(read(cn, '--k-tone-up-foreground')).not.toBe(read(def, '--k-tone-up-foreground'))
      expect(read(cn, '--k-tone-up-foreground')).toBe(read(def, '--k-tone-down-foreground'))
      expect(read(intl, '--k-tone-up-foreground')).toBe(read(def, '--k-tone-up-foreground'))
      // 同一份数据：正数格的底色，cn 子树与默认子树不同，intl 与默认相同；负数格相反。
      const cell = (id: string, tone: 'up' | 'down') =>
        getComputedStyle(el(id).querySelector(`[data-tone="${tone}"]`)!).backgroundColor
      expect(cell('cn-heat', 'up')).not.toBe(cell('def-heat', 'up'))
      expect(cell('intl-heat', 'up')).toBe(cell('def-heat', 'up'))
      expect(cell('cn-heat', 'up')).not.toBe(cell('cn-heat', 'down'))
    })
  })
}
