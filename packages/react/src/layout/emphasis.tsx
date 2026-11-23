// SPDX-License-Identifier: MIT
// 分量（emphasis）：同一个组件放在看板顶上当主角、放在中间当正文、放在边栏当一行，该画成什么样。三档：
//   hero      主角。大数用 display 档，配迷你线；一个区里最多一处（跟 display 档「每个面板最多一处」同一条）。
//   standard  正文（默认）。完整的表、图、列表，数据用 data 档。
//   compact   一行。标签加读数并排；表只留前几行且不出表头；列表一行一条。
// 用 EmphasisProvider 包一层，里面的件各自读 useEmphasis()，往下继承，里层的 Provider 盖住外层的。
// 分量只改字号档、显示多少、要不要表头；不改颜色，不改密度（密度仍由 data-density 管）。没接分量的件照 standard 画。
import { createContext, useContext, type ReactNode } from 'react'

/** 三档分量。 */
export type Emphasis = 'hero' | 'standard' | 'compact'

/** 全部分量档，从重到轻。 */
export const EMPHASIS_LEVELS: readonly Emphasis[] = ['hero', 'standard', 'compact']

const EmphasisContext = createContext<Emphasis>('standard')

export type EmphasisProviderProps = {
  /**
   * The emphasis of everything inside.
   * 里面所有件的分量。
   */
  value: Emphasis
  /** The content. */
  children?: ReactNode
}

/** 给里面的件定分量；不包就是 standard。 */
export function EmphasisProvider({ value, children }: EmphasisProviderProps) {
  return <EmphasisContext value={value}>{children}</EmphasisContext>
}

/** 读最近一层 EmphasisProvider 给的分量；没有就是 standard。 */
export function useEmphasis(): Emphasis {
  return useContext(EmphasisContext)
}
