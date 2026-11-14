// SPDX-License-Identifier: MIT
// 数字框里写算式（功能参照 Arc Scrub input（uiarc.dev/docs/components/scrub-input，2026-11-14 读：拖动调数、可写算式），实现原创）：
// 纯函数，组件（number-input.tsx）与单测共用，不用 eval。
// 规则（都是主会话在这里定的，Arc 页面没有写到这一层）：
//   - 以 + * / 开头：对当前值做相对运算（`+10`、`*2`、`/4`），以 - 开头只在最小值 ≥ 0 时按相对（这样的框里负数没有意义，`-5` 只可能是减 5）；
//   - `+10%`、`-10%`：当前值的百分比增减（`+10%` = ×1.1）；单独的 `50%` 是当前值的 50%；
//   - 其余按完整算式算（`100*1.5`、`(2+3)*4`、`-5`）：+ - * / 括号与后缀 %（`%` = ÷100）；
//   - 算不出（语法错、除以零）返回 null；结果夹进范围并去掉浮点尾巴（tidy）。
import { tidy, typed, type Range } from './number-field-model'

type Token = { kind: 'num'; value: number } | { kind: 'op'; value: string }

function tokenize(text: string): Token[] | null {
  const tokens: Token[] = []
  const pattern = /\s*(?:(\d+\.?\d*|\.\d+)|([-+*/()%]))/y
  let index = 0
  while (index < text.length) {
    pattern.lastIndex = index
    const match = pattern.exec(text)
    if (!match) return text.slice(index).trim() === '' ? tokens : null
    tokens.push(match[1] !== undefined ? { kind: 'num', value: Number(match[1]) } : { kind: 'op', value: match[2]! })
    index = pattern.lastIndex
  }
  return tokens
}

/** 纯算式：expr = term (+|- term)*；term = unary (*|/ unary)*；unary = (+|-) unary | primary %*；primary = 数 | ( expr )。 */
export function parseExpression(text: string): number | null {
  const tokens = tokenize(text)
  if (!tokens || tokens.length === 0) return null
  let at = 0
  const op = (value: string) => {
    const token = tokens[at]
    if (token?.kind === 'op' && token.value === value) {
      at++
      return true
    }
    return false
  }
  const primary = (): number | null => {
    const token = tokens[at]
    if (token?.kind === 'num') {
      at++
      return token.value
    }
    if (op('(')) {
      const inner = expr()
      return inner !== null && op(')') ? inner : null
    }
    return null
  }
  const unary = (): number | null => {
    if (op('-')) {
      const inner = unary()
      return inner === null ? null : -inner
    }
    if (op('+')) return unary()
    let value = primary()
    while (value !== null && op('%')) value /= 100
    return value
  }
  const term = (): number | null => {
    let left = unary()
    while (left !== null) {
      if (op('*')) {
        const right = unary()
        left = right === null ? null : left * right
      } else if (op('/')) {
        const right = unary()
        left = right === null ? null : left / right
      } else break
    }
    return left
  }
  function expr(): number | null {
    let left = term()
    while (left !== null) {
      if (op('+')) {
        const right = term()
        left = right === null ? null : left + right
      } else if (op('-')) {
        const right = term()
        left = right === null ? null : left - right
      } else break
    }
    return left
  }
  const value = expr()
  return value !== null && at === tokens.length && Number.isFinite(value) ? value : null
}

const PERCENT = /^[+-]?\s*(\d+\.?\d*|\.\d+)\s*%$/

/** 框里写的字（可以是算式）按当前值算出新值；不是合法算式返回 null。 */
export function evaluateInput(text: string, current: number, range: Pick<Range, 'min' | 'max'>): number | null {
  const t = text.trim()
  if (t === '') return null
  const lead = t[0]!
  let result: number | null
  if (PERCENT.test(t)) {
    const percent = Number(t.replace(/[+\-\s%]/g, ''))
    result =
      lead === '+'
        ? current * (1 + percent / 100)
        : lead === '-'
          ? current * (1 - percent / 100)
          : (current * percent) / 100
  } else if (
    lead === '+' ||
    lead === '*' ||
    lead === '/' ||
    (lead === '-' && range.min !== undefined && range.min >= 0)
  ) {
    const rest = parseExpression(t.slice(1))
    if (rest === null) return null
    result =
      lead === '+' ? current + rest : lead === '-' ? current - rest : lead === '*' ? current * rest : current / rest
  } else {
    result = parseExpression(t)
  }
  return result !== null && Number.isFinite(result) ? tidy(result, range) : null
}

/**
 * 边打边生效的那部分：只有纯数字（可带负号与小数点）才在每次按键时生效；带运算符的（`+10`、`*2`）等回车或离开再算，
 * 否则打到一半的 `+1` 会先被当成 1 写进去。最小值 ≥ 0 的框里 `-5` 是相对运算，也不边打边生效。
 */
export function typedLive(text: string, range: Pick<Range, 'min' | 'max'>): number | null {
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text.trim())) return null
  if (text.trim().startsWith('-') && range.min !== undefined && range.min >= 0) return null
  return typed(text, range)
}
