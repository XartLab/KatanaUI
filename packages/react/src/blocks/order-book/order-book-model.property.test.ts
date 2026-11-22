// SPDX-License-Identifier: MIT
// 订单簿合并档位的性质测试（#143，技能 .claude/skills/formal-tick-merge）：fast-check 生成输入，直接跑 order-book-model.ts 的真实函数。
// 期望值一律用 BigInt 整数算（不经被测的 lib/scaled-decimal.ts），所以「合并后的数」和「十进制精确值」比的是两条独立的路。
// 用例数默认每条 300（性质 3 是 10 倍），FC_RUNS 覆盖；失败时 fast-check 打印 seed 与 path，FC_SEED 复现。
import fc from 'fast-check'
import { describe, expect, it } from 'vite-plus/test'
import { buildOrderBook, mergeLevels, type BookLevel, type BookSide } from './order-book-model.ts'

const RUNS = Number(process.env.FC_RUNS ?? 300)
const SEED = process.env.FC_SEED === undefined ? undefined : Number(process.env.FC_SEED)
const params = { numRuns: RUNS, ...(SEED === undefined ? {} : { seed: SEED }) }

/** 十进制整数 units × 10^-decimals 对应的双精度数：按字符串解析，取离十进制值最近的那个。 */
const decimal = (units: bigint, decimals: number): number => Number(`${units}e-${decimals}`)
const pow10 = (n: number): bigint => 10n ** BigInt(n)

// ---- 生成器 ----

/** 一个品种：价格位数、数量位数（调用方传给件的 BookPrecision）。 */
const precisionArb = fc.record({
  priceDecimals: fc.integer({ min: 0, max: 4 }),
  sizeDecimals: fc.integer({ min: 0, max: 8 }),
})

/**
 * 合并档位：m × 10^-k（m 1..200，k 0..价格位数 + 3，即档位可以比价格最小位更细，如 2 位价格配 0.005），
 * 或非法值（0、负数、NaN、Infinity，代码规定按价格最小位）。
 */
type TickCase = { tick: number; m: bigint; k: number }
const tickArb = (priceDecimals: number): fc.Arbitrary<TickCase> =>
  fc.oneof(
    {
      weight: 8,
      arbitrary: fc
        .record({ m: fc.integer({ min: 1, max: 200 }), k: fc.integer({ min: 0, max: priceDecimals + 3 }) })
        .map(({ m, k }) => {
          // 去掉 m 末尾的 0：0.050 的实际小数位是 2，与代码的 decimalsOf 一致。
          let mm = BigInt(m)
          let kk = k
          while (kk > 0 && mm % 10n === 0n) {
            mm /= 10n
            kk -= 1
          }
          return { tick: decimal(mm, kk), m: mm, k: kk }
        }),
    },
    {
      weight: 1,
      arbitrary: fc
        .constantFrom(0, -0.05, Number.NaN, Number.POSITIVE_INFINITY)
        .map((tick) => ({ tick, m: 1n, k: priceDecimals })),
    },
  )

/** 一档：价格是价格位数上的整数（围着中心价 ±500 个最小位，好让多档落进同一档位），数量是数量位数上的整数。 */
type ValidLevel = { priceUnits: bigint; sizeUnits: bigint; level: BookLevel }
type LevelCase = ValidLevel | { invalid: BookLevel }
const levelArb = (
  priceDecimals: number,
  sizeDecimals: number,
  center: number,
  smallSizes: boolean,
): fc.Arbitrary<LevelCase> =>
  fc.oneof(
    {
      weight: 12,
      arbitrary: fc
        .record({
          offset: fc.integer({ min: -500, max: 500 }),
          // 小簿（全是 1..20 个最小位）让 0.1 + 0.2 这类浮点误差、占比四舍五入正好压在 .5 上（如买 1 卖 15）常出现；其余混着到 1e6 的大量。
          size: smallSizes
            ? fc.integer({ min: 1, max: 20 })
            : fc.oneof(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 1_000_000 })),
          // 价格与数量两种写法：除以 10^d（最近的双精度），乘以 10^-d（带乘法误差，如 0.1 * 3）。
          noisyPrice: fc.boolean(),
          noisySize: fc.boolean(),
        })
        .map(({ offset, size, noisyPrice, noisySize }): LevelCase => {
          const units = Math.max(1, center + offset)
          return {
            priceUnits: BigInt(units),
            sizeUnits: BigInt(size),
            level: {
              price: noisyPrice ? units * 10 ** -priceDecimals : units / 10 ** priceDecimals,
              size: noisySize ? size * 10 ** -sizeDecimals : size / 10 ** sizeDecimals,
            },
          }
        }),
    },
    {
      weight: 1,
      // 代码规定不进簿的档：量为 0、负数、NaN、Infinity，价格非有限数。
      arbitrary: fc
        .oneof(
          fc.record({ price: fc.constant(1), size: fc.constantFrom(0, -1, Number.NaN, Number.POSITIVE_INFINITY) }),
          fc.record({ price: fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY), size: fc.constant(1) }),
        )
        .map((invalid): LevelCase => ({ invalid })),
    },
  )

type BookCase = {
  priceDecimals: number
  sizeDecimals: number
  tick: TickCase
  bids: LevelCase[]
  asks: LevelCase[]
}
const bookArb: fc.Arbitrary<BookCase> = precisionArb.chain(({ priceDecimals, sizeDecimals }) =>
  fc.tuple(fc.integer({ min: 1, max: 10_000_000 }), fc.boolean()).chain(([center, smallSizes]) =>
    fc.record({
      priceDecimals: fc.constant(priceDecimals),
      sizeDecimals: fc.constant(sizeDecimals),
      tick: tickArb(priceDecimals),
      // 小簿最多 8 档：买卖量之和小，四舍五入压线（约占 1%）才碰得到；大簿到 60 档，合并与排序有得忙。
      bids: fc.array(levelArb(priceDecimals, sizeDecimals, center, smallSizes), { maxLength: smallSizes ? 8 : 60 }),
      asks: fc.array(levelArb(priceDecimals, sizeDecimals, center, smallSizes), { maxLength: smallSizes ? 8 : 60 }),
    }),
  ),
)

const sideOf = (c: BookCase, side: BookSide) => (side === 'bid' ? c.bids : c.asks)
const levelsOf = (cases: LevelCase[]): BookLevel[] => cases.map((c) => ('invalid' in c ? c.invalid : c.level))
const validOf = (cases: LevelCase[]): ValidLevel[] => cases.filter((c): c is ValidLevel => !('invalid' in c))
const precisionOf = (c: BookCase) => ({ priceDecimals: c.priceDecimals, sizeDecimals: c.sizeDecimals })
const sides: BookSide[] = ['bid', 'ask']

// ---- 期望值（BigInt）：档位取整与同档相加 ----

type Expected = { scale: number; tickUnits: bigint; buckets: Map<bigint, bigint> }
/** 按 order-book-model.ts 的承诺算期望：换算位数 = max(价格位数, 档位小数位)，买盘向下、卖盘向上取整到档位整数倍，同档数量整数相加。 */
function expected(c: BookCase, side: BookSide): Expected {
  const scale = Math.max(c.priceDecimals, c.tick.k)
  const tickUnits = c.tick.m * pow10(scale - c.tick.k)
  const buckets = new Map<bigint, bigint>()
  for (const l of validOf(sideOf(c, side))) {
    const p = l.priceUnits * pow10(scale - c.priceDecimals)
    const bucket = (side === 'bid' ? p / tickUnits : (p + tickUnits - 1n) / tickUnits) * tickUnits
    buckets.set(bucket, (buckets.get(bucket) ?? 0n) + l.sizeUnits)
  }
  return { scale, tickUnits, buckets }
}
/** 从最优价往外：买盘从高到低，卖盘从低到高。 */
const sortedKeys = (e: Expected, side: BookSide) =>
  [...e.buckets.keys()].toSorted((a, b) => (side === 'bid' ? Number(b - a) : Number(a - b)))

describe('订单簿合并档位：性质（fast-check）', () => {
  it('性质 1 价格对齐档位：每行价格是档位的整数倍，买盘向下取整、卖盘向上取整，价格就是那个十进制数', () => {
    fc.assert(
      fc.property(bookArb, (c) => {
        for (const side of sides) {
          const rows = mergeLevels(levelsOf(sideOf(c, side)), side, c.tick.tick, precisionOf(c))
          const e = expected(c, side)
          // 行的价格 = 每个有效档按方向取整后的档位（取整方向错一点，这里就对不上）。
          expect(rows.map((r) => r.price)).toEqual(sortedKeys(e, side).map((k) => decimal(k, e.scale)))
          const rowUnits = rows.map((row) => BigInt(Math.round(row.price * 10 ** e.scale)))
          rows.forEach((row, i) => {
            expect(rowUnits[i]! % e.tickUnits).toBe(0n)
            // 写出来就是十进制值，没有 100.05000000000001 这类尾巴。
            expect(row.price).toBe(decimal(rowUnits[i]!, e.scale))
          })
          // 每个原始档恰好落进一行：买盘行价 ≤ 原价 < 行价 + 档位（买价不会被抬高）；卖盘行价 - 档位 < 原价 ≤ 行价（卖价不会被压低）。
          for (const l of validOf(sideOf(c, side))) {
            const p = l.priceUnits * pow10(e.scale - c.priceDecimals)
            const hit = rowUnits.filter((b) =>
              side === 'bid' ? b <= p && p < b + e.tickUnits : b - e.tickUnits < p && p <= b,
            )
            expect(hit).toHaveLength(1)
          }
        }
      }),
      params,
    )
  })

  it('性质 2 同档数量精确相加：每行的量与累计量等于整数定点相加的十进制值，没有浮点累加误差', () => {
    fc.assert(
      fc.property(bookArb, (c) => {
        for (const side of sides) {
          const rows = mergeLevels(levelsOf(sideOf(c, side)), side, c.tick.tick, precisionOf(c))
          const e = expected(c, side)
          let running = 0n
          const want = sortedKeys(e, side).map((k) => {
            running += e.buckets.get(k)!
            return { size: decimal(e.buckets.get(k)!, c.sizeDecimals), total: decimal(running, c.sizeDecimals) }
          })
          expect(rows.map((r) => ({ size: r.size, total: r.total }))).toEqual(want)
        }
      }),
      params,
    )
  })

  it('性质 3 买卖占比：千分位四舍五入，两个数相加恰好 100；两边都是 0 时都是 null', () => {
    const optsArb = fc.record({
      rows: fc.integer({ min: 1, max: 30 }),
      shareRows: fc.option(fc.integer({ min: 1, max: 30 }), { nil: undefined }),
    })
    fc.assert(
      fc.property(bookArb, optsArb, (c, { rows, shareRows }) => {
        const model = buildOrderBook(levelsOf(c.bids), levelsOf(c.asks), {
          ...precisionOf(c),
          tick: c.tick.tick,
          rows,
          shareRows,
        })
        // 占比窗口：每侧合并后（已截到 rows 行）的前 shareRows 行，数量用整数加。
        const window = Math.min(rows, shareRows ?? rows)
        const shareUnits = (side: BookSide) => {
          const e = expected(c, side)
          return sortedKeys(e, side)
            .slice(0, window)
            .reduce((acc, k) => acc + e.buckets.get(k)!, 0n)
        }
        const b = shareUnits('bid')
        const a = shareUnits('ask')
        expect(model.bidVolume).toBe(decimal(b, c.sizeDecimals))
        expect(model.askVolume).toBe(decimal(a, c.sizeDecimals))
        const all = a + b
        if (all === 0n) {
          expect(model.bidPct).toBeNull()
          expect(model.askPct).toBeNull()
          return
        }
        // 买占比 = 1000·买/(买+卖) 四舍五入（.5 进位，与 Math.round 一致）后的十分位。
        const tenths = Number((2000n * b + all) / (2n * all))
        expect(model.bidPct).toBe(tenths / 10)
        expect(model.askPct).toBe((1000 - tenths) / 10)
        expect(model.bidPct! + model.askPct!).toBe(100)
      }),
      // 压线的输入稀少（小簿里约 1%），这条跑 10 倍用例，改坏补差时才每次都红。
      { ...params, numRuns: RUNS * 10 },
    )
  })

  it('性质 4 行数不增、排序不乱：行数不多于不同原价数，档位越粗行数越少；买盘严格降序、卖盘严格升序', () => {
    fc.assert(
      fc.property(bookArb, fc.integer({ min: 2, max: 10 }), fc.integer({ min: 1, max: 30 }), (c, factor, rows) => {
        const validTick = Number.isFinite(c.tick.tick) && c.tick.tick > 0
        for (const side of sides) {
          const levels = levelsOf(sideOf(c, side))
          const merged = mergeLevels(levels, side, c.tick.tick, precisionOf(c))
          const distinct = new Set(validOf(sideOf(c, side)).map((l) => l.priceUnits)).size
          expect(merged.length).toBeLessThanOrEqual(distinct)
          // 档位放大 factor 倍（仍是原档位的整数倍）：行数只减不增。
          if (validTick) {
            const coarse = decimal(c.tick.m * BigInt(factor), c.tick.k)
            expect(mergeLevels(levels, side, coarse, precisionOf(c)).length).toBeLessThanOrEqual(merged.length)
          }
          for (let i = 1; i < merged.length; i++) {
            if (side === 'bid') expect(merged[i]!.price).toBeLessThan(merged[i - 1]!.price)
            else expect(merged[i]!.price).toBeGreaterThan(merged[i - 1]!.price)
          }
        }
        // buildOrderBook 截到 rows 行，顺序同上。
        const model = buildOrderBook(levelsOf(c.bids), levelsOf(c.asks), { ...precisionOf(c), tick: c.tick.tick, rows })
        expect(model.bids.length).toBeLessThanOrEqual(rows)
        expect(model.asks.length).toBeLessThanOrEqual(rows)
        expect(model.bids.map((r) => r.price)).toEqual(model.bids.map((r) => r.price).toSorted((x, y) => y - x))
        expect(model.asks.map((r) => r.price)).toEqual(model.asks.map((r) => r.price).toSorted((x, y) => x - y))
      }),
      params,
    )
  })
})
