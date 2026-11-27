// SPDX-License-Identifier: MIT
// 各组的「怎么用 / 无障碍」内容汇总；组文件由各组自己维护，没写的页显示「待补」。
import type { Guidance, GuidanceMap } from './types'

const files = import.meta.glob(['./*.ts', '!./index.ts', '!./types.ts'], { eager: true, import: 'default' }) as Record<
  string,
  GuidanceMap
>

export const GUIDANCE: GuidanceMap = Object.assign({}, ...Object.values(files))
export const guidanceOf = (id: string): Guidance => GUIDANCE[id] ?? {}
export type { Guidance } from './types'
