// SPDX-License-Identifier: MIT
// 最新价的尾数闪色：数变了，从第一位不同的数字起到末尾闪一下涨跌色底（共用层 useValueFlash：方向、1 秒节流、key 都由它给）。
// 照 TradingView 右侧自选栏（主会话 2026-11-15 实测）：只闪变了的尾数，不闪整格。Watchlist 与 QuoteTable 的价格格共用（2026-11-18 从 watchlist.tsx 抽出）。
import { useState } from 'react'
import { useValueFlash } from '../lib/live.ts'
import { changedTail } from './watchlist-model.ts'

/**
 * Last price whose changed trailing digits flash the up or down color when the value changes.
 * 渲染时比较新旧值，不用 effect；被节流掉的变化不闪也不换尾数。
 */
export function FlashPrice({ value, text, className }: { value: number; text: string; className?: string }) {
  const { flash, key } = useValueFlash(value)
  // hist.prev 是变化前的文字：useValueFlash 与这里的 setState 在同一轮渲染里生效，第二遍渲染读到新 key 时，旧文字只能从 prev 拿。
  const [hist, setHist] = useState({ value, text, prev: text })
  const [mark, setMark] = useState({ key, tail: '' })
  // Object.is：NaN 与 NaN 视为同值，否则每轮渲染都 setState，React 报 Too many re-renders（Codex #73）。
  if (!Object.is(value, hist.value)) setHist({ value, text, prev: hist.text })
  if (key !== mark.key) setMark({ key, tail: changedTail(hist.prev, text).tail })
  const tail = flash && mark.key === key && mark.tail && text.endsWith(mark.tail) ? mark.tail : null
  const head = tail ? text.slice(0, text.length - tail.length) : text
  return (
    <span className={className ?? 'k-watch-last'} data-slot="watch-last">
      {head}
      {tail ? (
        <span key={key} className="k-watch-flash k-live-flash" data-slot="watch-flash" data-flash={flash ?? undefined}>
          {tail}
        </span>
      ) : null}
    </span>
  )
}
