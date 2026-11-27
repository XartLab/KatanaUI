// SPDX-License-Identifier: MIT
// 积木与布局件共用的小工具：必填文案的 schema 片段、相对时间、子组件列表。只给 src/a2ui/components 里的件用。
import { z } from 'zod'
import { fill } from './support.tsx'

/** 一句必填的界面文字：包里不带文案，所以每一句都由智能体按用户语言写。 */
export const text = (what: string) => z.string().describe(what)

/** 相对时间的四句模板，{n} 是数；放进各件的 labels 里。 */
export const agoShape = {
  secondsAgo: text('Relative time under a minute; {n} is the number of seconds, for example "{n}s ago".'),
  minutesAgo: text('Relative time under an hour; {n} is the number of minutes, for example "{n} min ago".'),
  hoursAgo: text('Relative time under a day; {n} is the number of hours, for example "{n} h ago".'),
  daysAgo: text('Relative time of a day or more; {n} is the number of days, for example "{n} d ago".'),
}

export type AgoText = Readonly<Record<keyof typeof agoShape, string>>

/** 已过去的秒数写成「3 分钟前」这样的话。 */
export const agoOf = (labels: AgoText) => (seconds: number) =>
  seconds < 60
    ? fill(labels.secondsAgo, { n: Math.max(0, Math.floor(seconds)) })
    : seconds < 3600
      ? fill(labels.minutesAgo, { n: Math.floor(seconds / 60) })
      : seconds < 86_400
        ? fill(labels.hoursAgo, { n: Math.floor(seconds / 3600) })
        : fill(labels.daysAgo, { n: Math.floor(seconds / 86_400) })

/** 悬停时出的绝对时间：UTC 的「年-月-日 时:分」，不依赖语言。 */
export const utcStamp = (ms: number) => `${new Date(ms).toISOString().replace('T', ' ').slice(0, 16)} UTC`

/** 子组件列表里的一项：同一数据作用域是 id 字符串，模板展开的项带 basePath。 */
export type ChildRef = { id: string; basePath?: string }

/** 取子组件列表：渲染器给的是 id 或 {id, basePath} 的数组，别的形状当空。 */
export function childRefs(value: unknown): ChildRef[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): ChildRef[] => {
    if (typeof item === 'string') return [{ id: item }]
    if (item && typeof item === 'object' && typeof (item as ChildRef).id === 'string') {
      const { id, basePath } = item as ChildRef
      return [basePath === undefined ? { id } : { id, basePath }]
    }
    return []
  })
}

/** 一个 Action 带的行信息：宿主从 metadata.extensions 里取，键名由各件自己定。 */
export const withExtension = (key: string, value: Record<string, unknown>) => ({
  metadata: { extensions: { [key]: value } },
})
