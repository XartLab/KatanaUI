// SPDX-License-Identifier: MIT
// 品种徽标：品种名前的小圆标（TradingView 的列表里每个品种前都有企业 / 币种标志）。有 src 显示圆形裁切的图片，加载失败退回字母；
// 没有 src 就是字母圆标：底色中性（bg-400）、字 ink-200，不按代码随机上色（颜色是留给数据的）。
// 退回思路照应用的 src/ui/AssetIcon.tsx（图标没有或加载不出来就退回字母块），但不依赖应用与 web3icons：图片来源由调用方给。
// 字母用界面无衬线（--font-sans，照 TradingView 的字母圆标，2026-11-17 改），整数字号 12（直径 28 以上 16，在 symbol-mark.css 里按 data-size 取 token）、不加字距。
// 尺寸统一 sm（18，行高 28 的一行）| md（28，卡片），2026-11-18；热力图格子、新闻芯片这类要别的直径的仍可传数。
// 字母规则：代码里的拉丁字母取前 2 个（大写）；代码里没有字母（A 股的 600519、港股的 00700）取名称首字；都没有取代码首字符。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'

export type SymbolMarkProps = {
  /** Symbol code (BTCUSDT, 600519). */
  symbol?: string
  /** Deprecated: use symbol. @deprecated Use symbol. */
  code?: string
  /** Name: the accessible name, and the first character when the code has no letters. */
  name?: string
  /** Image URL; letters are drawn when omitted or when it fails to load. */
  src?: string
  /** sm is 18px (a 28px row), md is 28px (cards); a number is a custom diameter in pixels. */
  size?: 'sm' | 'md' | number
  /** Extra class name on the root. */
  className?: string
}

const DIAMETER = { sm: 18, md: 28 } as const

/** 字母圆标上写什么（纯函数，单测用）。 */
export function symbolMarkLetters(code: string, name?: string): string {
  const latin = code.match(/[A-Za-z]/g)
  if (latin) return latin.slice(0, 2).join('').toUpperCase()
  // 按码点取首字（Array.from）：生僻汉字不被拆成半个；不处理组合 emoji（品种名里没有）。
  const first = (text: string | undefined) => (text ? (Array.from(text.trim())[0] ?? '') : '')
  return first(name) || first(code)
}

export function SymbolMark({ symbol, code: legacyCode, name, src, size = 'sm', className }: SymbolMarkProps) {
  const code = symbol ?? legacyCode ?? ''
  const diameter = typeof size === 'number' ? size : DIAMETER[size]
  // 记下加载失败的那个地址：换了 src 自然重新尝试，不用在 effect 里重置。
  const [failed, setFailed] = useState<string | null>(null)
  const showImage = src !== undefined && src !== '' && failed !== src
  return (
    <span
      className={cn('k-symbol-mark', className)}
      data-slot="symbol-mark"
      data-kind={showImage ? 'image' : 'letters'}
      role="img"
      aria-label={name ?? code}
      data-size={diameter >= DIAMETER.md ? 'md' : 'sm'}
      style={{ width: diameter, height: diameter }}
    >
      {showImage ? (
        <img src={src} alt="" draggable={false} onError={() => setFailed(src)} />
      ) : (
        <span aria-hidden="true">{symbolMarkLetters(code, name)}</span>
      )}
    </span>
  )
}
