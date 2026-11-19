// SPDX-License-Identifier: MIT
// 模式页（照 Salt 的 Patterns）：几个件怎么拼起来解决一类问题，不是单个件。一个模式一个文件（patterns/<id>.tsx），默认导出 Pattern。
import type { ComponentType } from 'react'

export type Pattern = {
  id: string
  title: string
  /** 一两句：解决什么问题。 */
  summary: string
  /** 活的示例：用包里的件真的拼出来，演示数据标「演示数据」。 */
  Demo: ComponentType
  /** 什么时候用。 */
  use: readonly string[]
  /** 什么时候别用（改用什么）。 */
  avoid: readonly string[]
  /** 用到的件：页 id（链到组件页）+ 在这个模式里干什么。 */
  parts: readonly { page: string; role: string }[]
  /** 参考表：模式自己带一张表（例如 A2UI 目录里登记了哪些组件），放在「用到的件」后面；没有就不画。 */
  Reference?: ComponentType
  /** 怎么拼：按顺序的几条规则（布局、交互、数值）。 */
  rules: readonly string[]
  /** 照的出处（Salt 的同名模式、别的产品实测）。 */
  source?: { label: string; href: string }
}
