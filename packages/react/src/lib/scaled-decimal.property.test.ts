// SPDX-License-Identifier: MIT
// lib/scaled-decimal.ts 的性质测试（#143，技能 .claude/skills/formal-tick-merge）：订单簿合并档位的整数运算靠这几个换算不出错。
// 期望值用 BigInt 与字符串解析算，不经被测函数。用例数默认每条 300，FC_RUNS 覆盖；FC_SEED 复现失败。
import fc from 'fast-check'
import { describe, expect, it } from 'vite-plus/test'
import { formatUnits, fromUnits, toUnits } from './scaled-decimal.ts'

const RUNS = Number(process.env.FC_RUNS ?? 300)
const SEED = process.env.FC_SEED === undefined ? undefined : Number(process.env.FC_SEED)
const params = { numRuns: RUNS, ...(SEED === undefined ? {} : { seed: SEED }) }

/** 小数位 0..8，整数 |units| ≤ 1e12（订单簿里价格 × 10^换算位数、数量累计都在这个范围内）。 */
const caseArb = fc.record({
  units: fc.integer({ min: -1_000_000_000_000, max: 1_000_000_000_000 }),
  decimals: fc.integer({ min: 0, max: 8 }),
})

/** BigInt 写出的十进制字符串：-5 在 2 位时是 -0.05。 */
function decimalString(units: number, decimals: number): string {
  const abs = BigInt(Math.abs(units))
  const scale = 10n ** BigInt(decimals)
  const whole = (abs / scale).toString()
  const fraction = decimals > 0 ? `.${(abs % scale).toString().padStart(decimals, '0')}` : ''
  return `${units < 0 ? '-' : ''}${whole}${fraction}`
}

describe('十进制整数运算：性质（fast-check）', () => {
  it('引理 换算来回不丢：整数换成数再换回整数还是原来那个，乘法误差（u × 10^-d）也吃得掉', () => {
    fc.assert(
      fc.property(caseArb, ({ units, decimals }) => {
        expect(toUnits(fromUnits(units, decimals), decimals)).toBe(units)
        expect(toUnits(units * 10 ** -decimals, decimals)).toBe(units)
        // fromUnits 给的就是那个十进制值最近的双精度数。
        expect(fromUnits(units, decimals)).toBe(Number(`${units}e-${decimals}`))
      }),
      params,
    )
  })

  it('引理 写成字符串就是十进制值本身（不经 toFixed）', () => {
    fc.assert(
      fc.property(caseArb, ({ units, decimals }) => {
        expect(formatUnits(units, decimals, false)).toBe(decimalString(units, decimals))
      }),
      params,
    )
  })
})
