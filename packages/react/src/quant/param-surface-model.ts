// SPDX-License-Identifier: MIT
// 参数曲面热力图的纯逻辑：从多参数的优化结果里切出两参数的平面、找最优格、算最优格邻域的稳定度（孤峰过拟合的判据）。不带 React 与 DOM。
// 件只画不算优化：每一组参数的各项指标由调用方（优化内核的结果包）给。

export type SurfacePoint = {
  id: string
  /** 各参数的取值，键是参数 key。 */
  params: Readonly<Record<string, number>>
  /** 各项指标；没跑出结果或不适用是 null。键是指标 key。 */
  metrics: Readonly<Record<string, number | null>>
}

export type SurfaceGoal = 'max' | 'min'

/** 一个参数的全部取值，升序去重。 */
export function paramValues(points: readonly SurfacePoint[], key: string): number[] {
  return [...new Set(points.map((point) => point.params[key]).filter((v): v is number => Number.isFinite(v)))].sort(
    (a, b) => a - b,
  )
}

/** 切片：其余参数固定在 fixed 给的值上；fixed 里没给的参数取它第一个取值。 */
export function resolveSlice(
  points: readonly SurfacePoint[],
  paramKeys: readonly string[],
  axes: readonly [string, string],
  fixed: Readonly<Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const key of paramKeys) {
    if (axes.includes(key)) continue
    const values = paramValues(points, key)
    out[key] = fixed[key] !== undefined && values.includes(fixed[key]!) ? fixed[key]! : (values[0] ?? 0)
  }
  return out
}

export type SurfaceGrid = {
  xs: number[]
  ys: number[]
  /** cells[yi][xi]：这个坐标上的点；没有这组参数是 null。同一坐标有几个点（切片没固定死）取第一个。 */
  cells: (SurfacePoint | null)[][]
}

/** 把点摆成 y 行 x 列的网格，只保留落在切片上的点。 */
export function sliceGrid(
  points: readonly SurfacePoint[],
  axes: readonly [string, string],
  slice: Readonly<Record<string, number>>,
): SurfaceGrid {
  const [xKey, yKey] = axes
  const onSlice = points.filter((point) => Object.entries(slice).every(([key, value]) => point.params[key] === value))
  const xs = paramValues(onSlice, xKey)
  const ys = paramValues(onSlice, yKey)
  const cells = ys.map((y) =>
    xs.map((x) => onSlice.find((point) => point.params[xKey] === x && point.params[yKey] === y) ?? null),
  )
  return { xs, ys, cells }
}

export const metricOf = (point: SurfacePoint | null, metric: string): number | null => {
  const value = point?.metrics[metric]
  return value === undefined || value === null || !Number.isFinite(value) ? null : value
}

export type Cell = { xi: number; yi: number }

/** 最优格：goal 为 max 取最大、min 取最小；同值取靠前的（先行后列）；没有有效值是 null。 */
export function bestCell(grid: SurfaceGrid, metric: string, goal: SurfaceGoal): Cell | null {
  let best: Cell | null = null
  let bestValue = 0
  grid.cells.forEach((row, yi) =>
    row.forEach((point, xi) => {
      const value = metricOf(point, metric)
      if (value === null) return
      if (best === null || (goal === 'max' ? value > bestValue : value < bestValue)) {
        best = { xi, yi }
        bestValue = value
      }
    }),
  )
  return best
}

export type SurfaceNeighborhood = {
  /** 有有效值的邻格数（不含中心格）。 */
  count: number
  /** 邻格的均值与（总体）方差；没有邻格是 null。 */
  mean: number | null
  variance: number | null
  /** 中心格自己的值。 */
  center: number | null
  /**
   * 保留率：邻格均值相对中心格的比例，1 是「周围和我一样好」，越小越是孤峰。
   * goal 为 max 是 mean / center，min 是 center / mean；中心或邻均值落在会让比值失去意义的符号上（max 时中心 ≤ 0，min 时有 ≤ 0）是 null。
   */
  retention: number | null
}

/** 一格的邻域（半径 radius 的方形，默认 1 即八邻）；网格边上的格邻居少。 */
export function surfaceNeighborhood(
  grid: SurfaceGrid,
  cell: Cell,
  metric: string,
  goal: SurfaceGoal,
  radius = 1,
): SurfaceNeighborhood {
  const center = metricOf(grid.cells[cell.yi]?.[cell.xi] ?? null, metric)
  const values: number[] = []
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue
      const value = metricOf(grid.cells[cell.yi + dy]?.[cell.xi + dx] ?? null, metric)
      if (value !== null) values.push(value)
    }
  if (values.length === 0) return { count: 0, mean: null, variance: null, center, retention: null }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  let retention: number | null = null
  if (center !== null)
    if (goal === 'max') retention = center > 0 ? mean / center : null
    else retention = center > 0 && mean > 0 ? center / mean : null
  return { count: values.length, mean, variance, center, retention }
}

/** 孤峰：保留率低于调用方给的阈值（阈值是策略判断，件里不写死）；算不出保留率不判。 */
export const isSpike = (stable: SurfaceNeighborhood, threshold: number): boolean =>
  stable.retention !== null && stable.retention < threshold

/** 色阶的值域：切片里所有有效值的最低与最高；没有有效值是 null。 */
export function gridRange(grid: SurfaceGrid, metric: string): { min: number; max: number } | null {
  const values = grid.cells
    .flat()
    .map((point) => metricOf(point, metric))
    .filter((v): v is number => v !== null)
  return values.length === 0 ? null : { min: Math.min(...values), max: Math.max(...values) }
}

/** 方向键走格：夹在网格里，不绕回；Home / End 到行首行尾。 */
export function moveCell(cell: Cell, key: string, width: number, height: number): Cell | null {
  const clamp = (value: number, max: number) => Math.min(max - 1, Math.max(0, value))
  switch (key) {
    case 'ArrowLeft':
      return { xi: clamp(cell.xi - 1, width), yi: cell.yi }
    case 'ArrowRight':
      return { xi: clamp(cell.xi + 1, width), yi: cell.yi }
    case 'ArrowUp':
      return { xi: cell.xi, yi: clamp(cell.yi - 1, height) }
    case 'ArrowDown':
      return { xi: cell.xi, yi: clamp(cell.yi + 1, height) }
    case 'Home':
      return { xi: 0, yi: cell.yi }
    case 'End':
      return { xi: width - 1, yi: cell.yi }
    default:
      return null
  }
}
