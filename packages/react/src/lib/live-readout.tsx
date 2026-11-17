// SPDX-License-Identifier: MIT
// 读数（报价、指标值、LCD、状态栏的数）变了闪一下涨跌色：把已经格式化好的字包一层，走共用层 live.ts 的 useValueFlash 与 live.css 的 .k-live-flash，不另写闪烁。
// 读数是调用方格式化好的字符串（「1,284.50」「12.5%」「2.42M」），所以先取出开头那个数当方向的依据；取不出数（「—」「已断开」）就不闪。
// 单位变了（「9,800万」到「1.1亿」）会按数字比，方向可能不对，这种读数请调用方自己传 value 数值给用 useValueFlash 的版本；这里只做大多数读数的默认。
import type { ReactNode } from 'react'
import { cn } from './cn.ts'
import { useValueFlash } from './live.ts'

/** 读数文字开头的那个数：吃掉币种符号、千分位、正负号（含 U+2212 的减号）；取不出返回 null。 */
export function parseReadout(text: string | number | null | undefined): number | null {
  if (typeof text === 'number') return Number.isFinite(text) ? text : null
  if (typeof text !== 'string') return null
  const match = /^[\s¥$￥€£]*([+\-−]?)\s*(\d[\d,]*(?:\.\d+)?|\.\d+)/.exec(text)
  if (!match) return null
  const value = Number(match[2]!.replaceAll(',', ''))
  return Number.isFinite(value) ? (match[1] === '' || match[1] === '+' ? value : -value) : null
}

/** 读数的闪烁外壳：值变大闪涨色、变小闪跌色（同一处 1 秒内最多一次）；key 随闪烁换，CSS 动画才会重放。 */
export function ReadoutFlash({
  text,
  className,
  children,
}: {
  /** 读数的文字，方向从它开头的数字取。 */
  text: string | number | null | undefined
  className?: string
  /** 画什么；不给就画 text 本身。 */
  children?: ReactNode
}) {
  const { flash, key } = useValueFlash(parseReadout(text))
  return (
    <span key={key} className={cn('k-live-flash', className)} data-flash={flash ?? undefined}>
      {children ?? text}
    </span>
  )
}
