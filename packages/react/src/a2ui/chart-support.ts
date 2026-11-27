// SPDX-License-Identifier: MIT
// 图表类组件共用：数值写法的枚举、时间写法、图头三件的 schema、数据量上限。函数类属性智能体传不了，这里把枚举映射成库里的格式化函数。
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { formatPercentChange, formatPrice, formatVolume } from '../lib/chart/format/index.ts'
import { actionSchema } from './support.tsx'

/** 序列点数上限：防止智能体塞爆页面。 */
export const MAX_POINTS = 5000
/** 条目（品种、节点、层）数量上限。 */
export const MAX_ITEMS = 500

/** 一段必填的可见文字（标题、轴名、图例、读屏名）：组件不带兜底，所以不许空。 */
export const text = (what: string) => z.string().min(1).describe(what)

const formatStyle = z.enum(['number', 'percent', 'money', 'compact'])

/** 数值怎么写：函数传不了，用枚举加小数位。 */
export const formatSchema = (what: string) =>
  z
    .object({
      style: formatStyle.describe(
        "'number' is plain with thousands separators; 'money' is the same with a unit suffix; 'percent' treats the value as a percentage already (1.5 means 1.50%); 'compact' abbreviates to K, M or B.",
      ),
      digits: z.number().int().min(0).max(8).describe('Decimal places. Defaults to 2.').optional(),
      unit: z
        .string()
        .max(12)
        .describe('Unit written after the number, for example "USDT". Ignored for percent.')
        .optional(),
      signed: z.boolean().describe('Put + in front of positive values.').optional(),
    })
    .strict()
    .describe(what)

export type FormatSpec = z.infer<ReturnType<typeof formatSchema>>

/** 把枚举写法映射成库里的格式化函数；不是有限数写「—」。 */
export function makeFormat(spec: FormatSpec | undefined): (value: number) => string {
  const style = spec?.style ?? 'number'
  const digits = spec?.digits ?? 2
  const unit = spec?.unit
  const signed = spec?.signed === true
  return (value) => {
    if (!Number.isFinite(value)) return '—'
    const plus = signed && value > 0 ? '+' : ''
    if (style === 'percent')
      return signed ? formatPercentChange(value, digits) : `${formatPrice(value, { precision: digits })}%`
    if (style === 'compact') return `${plus}${formatVolume(value)}${unit ? ` ${unit}` : ''}`
    const body = formatPrice(value, { precision: digits })
    return `${plus}${body}${style === 'money' && unit ? ` ${unit}` : ''}`
  }
}

export const timeFormatSchema = z
  .enum(['date', 'datetime', 'month'])
  .describe("How a time is written: 'date' is 2026-11-17, 'datetime' is 2026-11-17 09:30 (UTC), 'month' is 2026-11.")

export type TimeFormat = z.infer<typeof timeFormatSchema>

/** 时间（毫秒，UTC）写成 ISO 次序的字；不是有限数写「—」。 */
export function formatTimeAs(time: number, kind: TimeFormat | undefined): string {
  if (!Number.isFinite(time)) return '—'
  const iso = new Date(time).toISOString()
  return kind === 'datetime'
    ? iso.slice(0, 16).replace('T', ' ')
    : kind === 'month'
      ? iso.slice(0, 7)
      : iso.slice(0, 10)
}

/** 图右上「表格视图 / 导出 / 全屏」三个按钮的读屏名与提示。 */
export const actionLabelsSchema = z
  .object({
    group: text('Accessible name of the group of three buttons at the top right of the chart.'),
    table: text('Name of the button that switches to the table view.'),
    exportCsv: text('Name of the export button.'),
    fullscreen: text('Name of the full screen button.'),
  })
  .strict()
  .describe('Names of the three chart buttons: table view, export and full screen.')

/** 图头三件相关的属性（ChartViewProps 那一组）：表格视图总有；导出与全屏只在给了 Action 时才出按钮。 */
export const viewShape = {
  actionLabels: actionLabelsSchema,
  tableLabel: text('Accessible name of the table view.'),
  tableHead: z
    .array(z.string())
    .min(1)
    .max(12)
    .describe('Column heads of the table view; the first is the row head column.'),
  source: z.string().describe('One line saying where the numbers come from and when.').optional(),
  onExport: actionSchema(
    'Dispatched when the user presses export. metadata.extensions.katanaChart carries {label}. Without it no export button is drawn.',
  ).optional(),
  onFullscreen: actionSchema(
    'Dispatched when the user presses full screen. metadata.extensions.katanaChart carries {label}. Without it no full screen button is drawn.',
  ).optional(),
}

/** 一行一个横轴位置、一列一条序列的表格视图（SeriesTableViewProps）：列头是横轴那一列的名字加各序列的名字，只给第一列的头。 */
export const seriesViewShape = {
  actionLabels: viewShape.actionLabels,
  tableLabel: viewShape.tableLabel,
  tableXHead: text('Column head of the x position in the table view; the other column heads are the series names.'),
  source: viewShape.source,
  onExport: viewShape.onExport,
  onFullscreen: viewShape.onFullscreen,
}

type ActionCall = (event: { metadata: { extensions: Record<string, unknown> } }) => unknown

/** 发一个 Action，把被点的项放进 metadata.extensions（宿主靠它知道是哪一项）。 */
export function dispatch(action: ActionCall | undefined, key: string, payload: unknown): void {
  void action?.({ metadata: { extensions: { [key]: payload } } })
}

type ViewIn = {
  actionLabels: { group: string; table: string; exportCsv: string; fullscreen: string }
  tableLabel: string
  tableHead: readonly string[]
  source?: string | undefined
  onExport?: ActionCall | undefined
  onFullscreen?: ActionCall | undefined
}

/** 把图头三件的属性接成库里 ChartViewProps：回调只在给了 Action 时才有。 */
export function viewProps(props: ViewIn, label: string) {
  const { onExport, onFullscreen } = props
  return {
    actionLabels: props.actionLabels,
    tableLabel: props.tableLabel,
    tableHead: props.tableHead,
    ...(props.source === undefined ? {} : { source: props.source }),
    ...(onExport === undefined ? {} : { onExport: () => dispatch(onExport, 'katanaChart', { label }) }),
    ...(onFullscreen === undefined ? {} : { onFullscreen: () => dispatch(onFullscreen, 'katanaChart', { label }) }),
  }
}

type SeriesViewIn = Omit<ViewIn, 'tableHead'> & { tableXHead: string }

/** 把 seriesViewShape 的属性接成库里 SeriesTableViewProps：回调只在给了 Action 时才有。 */
export function seriesViewProps(props: SeriesViewIn, label: string) {
  const { onExport, onFullscreen } = props
  return {
    actionLabels: props.actionLabels,
    tableLabel: props.tableLabel,
    tableXHead: props.tableXHead,
    ...(props.source === undefined ? {} : { source: props.source }),
    ...(onExport === undefined ? {} : { onExport: () => dispatch(onExport, 'katanaChart', { label }) }),
    ...(onFullscreen === undefined ? {} : { onFullscreen: () => dispatch(onFullscreen, 'katanaChart', { label }) }),
  }
}

/** 取一列对象：不是数组就是空，逐项解析、坏项丢掉，最多取 max 项（绑进来的数组不受 schema 的 .max() 约束）。 */
export function parseCapped<T>(schema: z.ZodType<T>, value: unknown, max: number): T[] {
  if (!Array.isArray(value)) return []
  const out: T[] = []
  for (const item of value) {
    if (out.length >= max) break
    const parsed = schema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/** 取一列数（有限数），最多 max 个。 */
export function numbersCapped(value: unknown, max: number = MAX_POINTS): number[] {
  if (!Array.isArray(value)) return []
  const out: number[] = []
  for (const item of value) {
    if (out.length >= max) break
    if (typeof item === 'number' && Number.isFinite(item)) out.push(item)
  }
  return out
}

/** 整列对象：可字面量，也可绑到数据模型里的数组；字面量有条数上限。 */
export const listSchema = <T extends z.ZodType>(item: T, max: number, what: string) =>
  z
    .union([z.array(item).max(max), CommonSchemas.DataBinding])
    .describe(
      `${what} Either a literal array (at most ${max}) or {"@path": "/some/array"} bound to the data model; bound items beyond ${max} and malformed items are dropped.`,
    )

/** 整列数：可字面量，也可绑定。 */
export const seriesSchema = (max: number, what: string) => listSchema(z.number(), max, what)

/** 两个数的数组取成二元组；长度不对就是空。 */
export function pair(value: readonly number[] | undefined): readonly [number, number] | undefined {
  return value && value.length === 2 ? [value[0]!, value[1]!] : undefined
}
