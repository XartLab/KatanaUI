// SPDX-License-Identifier: MIT
// 文档站中文标题按词断行（#250 第一部分，kubai 007「中文标题按词断行」）：BudouX（Google，Apache-2.0，见 NOTICE）把标题切成词，
// 词与词之间插 <wbr>，再由 theme/typesetting.css 的 [data-phrased]（keep-all + overflow-wrap:anywhere + balance）换行。
// 只用在文档站标题上，不进组件库（库的依赖里没有 BudouX：它带 linkedom、commander 两个传递依赖，每个使用者都得背；取舍写在 PR 与「中英排版开关」页）。
// 规矩：没有断点（BudouX 只切出一段）的标题绝不标 data-phrased，keep-all 对没有断点的汉字串会整串不折行；不含汉字的标题原样返回；不用于正文。
import { loadDefaultSimplifiedChineseParser } from 'budoux'
import { Fragment, type ReactNode } from 'react'

let parser: ReturnType<typeof loadDefaultSimplifiedChineseParser> | undefined

/** 把标题切成词；切不出两段以上、或没有汉字，就返回 null（调用方原样渲染，不标 data-phrased）。 */
export function phraseTitle(text: string): string[] | null {
  if (!/\p{Script=Han}/u.test(text)) return null
  parser ??= loadDefaultSimplifiedChineseParser()
  const parts = parser.parse(text)
  return parts.length > 1 ? parts : null
}

/** 标题的属性：有断点时给 data-phrased 与插了 <wbr> 的子节点，没有断点时只给原文。展开到 h1、h2 上：`<h1 {...phrased(title)} />`。 */
export function phrased(text: string): { 'data-phrased'?: ''; children: ReactNode } {
  const parts = phraseTitle(text)
  if (!parts) return { children: text }
  return {
    'data-phrased': '',
    children: parts.map((part, index) => (
      <Fragment key={index}>
        {index > 0 ? <wbr /> : null}
        {part}
      </Fragment>
    )),
  }
}
