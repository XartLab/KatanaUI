// SPDX-License-Identifier: MIT
// A2UI 适配层的公共件：各组件共用的 schema 片段、文案模板、日期与链接的安全检查。只给 src/a2ui 里的组件用。
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import type { ReactNode } from 'react'
import { z } from 'zod'

/** 在 Row / Column 里占的比例；放在每个组件的 schema 里，智能体才能给我们的件排版（基础目录的件都有这个字段）。 */
export const weightSchema = z
  .number()
  .min(0.000001)
  .describe(
    'Relative share of the free space inside a Row or Column, like CSS flex-grow. Only valid for a direct child of a Row or Column.',
  )
  .optional()

/** 给智能体读的说明里反复出现的一句：文字全部由智能体传，组件自己不带文案。 */
export const TEXT_NOTE = 'Write all user-visible text in the language of the user.'

/** 一个 Action 属性：触发时由宿主处理；交易类动作只能走这里，组件本身不做事。 */
export const actionSchema = (what: string) =>
  CommonSchemas.Action.describe(
    `${what} The host receives the action and decides what to do; the component itself does nothing else.`,
  )

/** 只收 https 链接：别的协议（javascript:、data:、http:）一律不收。 */
export const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), 'Only https links are allowed.')
  .describe('An absolute https URL. Other schemes are rejected.')

/**
 * 件的根节点：带 weight 的件在 Row / Column 里按比例分空间。
 * 渲染器给每个 React 件造的宿主元素是 display: contents，写在宿主上的 flex 不生效，所以 flex 写在这一层根节点上。
 */
export function Cell({ weight, children, className }: { weight?: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={className ? `k-a2ui-cell ${className}` : 'k-a2ui-cell'}
      style={weight === undefined ? undefined : { flex: weight, minWidth: 0 }}
    >
      {children}
    </div>
  )
}

/** 文案模板：把 `{name}` 换成值；缺的变量原样留着，方便智能体看出写错了。 */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replaceAll(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole))
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}(:\d{2})?$/

/** ISO 8601 的「日期」或「日期 + T + 时刻」拆成两段；认不出来就是空。 */
export function splitIso(value: string | undefined): { date: string; time: string } {
  const [date = '', time = ''] = (value ?? '').split('T')
  return { date: DAY.test(date) ? date : '', time: TIME.test(time.slice(0, 8)) ? time.slice(0, 8) : '' }
}

/** 两段合成 ISO 8601：没有日期就是空串；没开时间就只回日期。 */
export function joinIso(date: string, time: string | undefined): string {
  if (!DAY.test(date)) return ''
  return time === undefined ? date : `${date}T${TIME.test(time) ? time : '00:00'}`
}

/** ISO 8601 转毫秒；认不出来返回 undefined（调用方丢掉这一项或用兜底值）。 */
export function isoToMs(value: string | undefined): number | undefined {
  if (!value) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

/** 一列数：可以直接写，也可以绑到数据模型里的数组；绑进来的值不可信，用 numberList 取。 */
export const numberListSchema = (what: string) =>
  z
    .union([z.array(z.number()), CommonSchemas.DataBinding])
    .describe(`${what} Either a literal array or {"@path": "/some/array"} bound to the data model.`)

/** 取一列数：不是数组就是空，里面不是有限数的项丢掉。 */
export function numberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : []
}

/** 取一列对象：绑进来的数组不可信，逐项按 schema 解析，不合格的项丢掉，不让一项坏数据拖垮整块。 */
export function parseList<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

/**
 * 拦下子树里来源链接的点击：真实的 https 链接不放进 DOM，卡上的 href 只是占位；点击交给宿主（走 Action），由宿主决定开不开。
 * selector 选中那个来源链接的 a；onOpen 收到占位 href。
 */
export function SourceClicks({
  selector,
  onOpen,
  children,
}: {
  selector: string
  onOpen: (placeholder: string) => void
  children: ReactNode
}) {
  return (
    <div
      onClickCapture={(event) => {
        const anchor = (event.target as Element).closest(selector)
        if (!anchor) return
        event.preventDefault()
        onOpen(anchor.getAttribute('href') ?? '')
      }}
    >
      {children}
    </div>
  )
}
