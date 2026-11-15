// SPDX-License-Identifier: MIT
import { QuantileLayers } from '../../src/quant'

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */

function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

function layerSeries(monotone: boolean) {
  return [-22.5, -8, monotone ? 1 : -12, 11, 32].map((final, i) => {
    let sum = 0
    const months = gaussians(200 + i, 31, final / 31, 0.8)
    return { rank: i + 1, label: `Q${i + 1}`, points: months.map((month) => (sum += month)) }
  })
}

function QuantileCase({ monotone, id }: { monotone: boolean; id: string }) {
  const layers = layerSeries(monotone)
  const longShort = layers[4]!.points.map((value, i) => value - layers[0]!.points[i]!)
  const x = (i: number) => `${2024 + Math.floor(i / 12)}-${String(1 + (i % 12)).padStart(2, '0')}`
  const labels = {
    chart: '示例：因子分层累计收益',
    actions: { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
    x: '日期',
    layers: '分层',
    table: '分层累计收益表',
    monotonicPass: '通过',
    monotonicFail: '未通过',
    monotonic: '单调性',
    tooMany: '分层多于 10，不画线。',
  }
  const stats = [
    // 多空年化 = 多空差期末累计（%）按 31 个月折成年的复合收益。
    {
      key: 'ls',
      label: '多空年化',
      value: `${((Math.pow(1 + longShort.at(-1)! / 100, 12 / 31) - 1) * 100).toFixed(1)} %`,
    },
    { key: 'turn', label: '换手', value: '0.62 /月' },
    { key: 'n', label: '样本', value: '31 期 · 4 280 只' },
  ]
  return (
    <div className="gal-wide" data-gallery-quantile={id}>
      <QuantileLayers
        layers={layers}
        longShort={longShort}
        title="MOM_RS_V3 · 5 分层累计超额"
        longShortLabel="Q5−Q1"
        labels={labels}
        formatValue={(value) => ({ value: value.toFixed(1), unit: '%' })}
        formatX={x}
        stats={stats}
        source="来源 / 演示数据 · 固定种子合成 · 非回测"
        onExport={() => {}}
      />
    </div>
  )
}

export function QuantileLayersUsage() {
  return (
    <>
      <QuantileCase monotone id="pass" />

      <QuantileCase monotone={false} id="fail" />
    </>
  )
}
