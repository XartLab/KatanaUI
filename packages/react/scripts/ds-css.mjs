// SPDX-License-Identifier: MIT
// 设计系统包 bundle.css 的两步后处理（纯函数，单测在 ds-css.test.ts）。
// design-pipeline 的 check 对 bundle.css 有两条要求：声明里不许有色值（衍生色要放进自定义属性）；`var(--x)` 必须是 token 或在 bundle.css 里声明过。

const FUNCTIONS = ['color-mix', 'rgba', 'rgb', 'hsla', 'hsl', 'hwb', 'oklab', 'oklch', 'lab', 'lch', 'color']
const IDENT = /[A-Za-z0-9_-]/

/** 从 start 起（start 在左括号上）找配对的右括号；没有返回 -1。 */
function closingParen(text, start) {
  let depth = 0
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return i
  }
  return -1
}

/** 一个值里的色值片段：#hex 与色彩函数（含嵌套括号）。 */
function colourSpans(value) {
  const spans = []
  for (let i = 0; i < value.length;) {
    const before = i === 0 ? '' : value[i - 1]
    if (value[i] === '#' && !IDENT.test(before)) {
      const m = /^#[0-9a-fA-F]{3,8}(?![A-Za-z0-9_-])/.exec(value.slice(i))
      if (m) {
        spans.push([i, i + m[0].length])
        i += m[0].length
        continue
      }
    }
    const fn = IDENT.test(before) ? undefined : FUNCTIONS.find((name) => value.startsWith(`${name}(`, i))
    if (fn) {
      const end = closingParen(value, i + fn.length)
      if (end !== -1) {
        spans.push([i, end + 1])
        i = end + 1
        continue
      }
    }
    i++
  }
  return spans
}

/** 稳定、短的名字：按色值内容取，不按出现次序，样式的先后变了名字不变。 */
function nameOf(raw) {
  let h = 5381
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0
  return `--ds-c-${h.toString(36)}`
}

/**
 * 把非自定义属性的声明里的色值提成 :root 上的自定义属性（值原样，渲染结果不变），声明改成 var(--ds-c-…)。
 * 这样 bundle.css 的声明里没有裸色值，衍生色（白色透明度层）集中在 :root 一处，改主题时看得见、改得到。
 * 返回 { css, hoisted }：hoisted 是 名字 → 原值。
 */
export function hoistRawColours(css) {
  const hoisted = new Map()
  const lines = css.split('\n').map((line) => {
    const m = /^(\s*)([A-Za-z-]+)(\s*:\s*)(.*?)(\s*;)\s*$/.exec(line)
    if (!m || m[2].startsWith('--')) return line
    const [, indent, property, colon, value, end] = m
    const spans = colourSpans(value)
    if (!spans.length) return line
    let next = ''
    let at = 0
    for (const [from, to] of spans) {
      const raw = value.slice(from, to)
      const name = nameOf(raw)
      const known = hoisted.get(name)
      if (known !== undefined && known !== raw) throw new Error(`ds-css：${name} 撞名：${known} 与 ${raw}`)
      hoisted.set(name, raw)
      next += `${value.slice(at, from)}var(${name})`
      at = to
    }
    return `${indent}${property}${colon}${next}${value.slice(at)}${end}`
  })
  return { css: lines.join('\n'), hoisted }
}

/** 文本里所有 var(--x ...) 引用的名字。 */
export function referencedVars(text) {
  return new Set([...text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1]))
}

/** 文本里声明过的自定义属性（`--x:`）。 */
export function declaredVars(text) {
  return new Set([...text.matchAll(/(?:^|[\s;{"'])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]))
}

/**
 * 运行时才有值的变量（Radix 在打开的弹层上量好写进来、动效的 --k-in-* 由调用方覆盖）：
 * 在 :root 上声明成 initial（等于没声明，带 fallback 的 var() 照常走 fallback），让 check 认得它们。
 */
export function runtimeVarsBlock(names) {
  if (!names.length) return ''
  return `:root {\n${names.map((name) => `  ${name}: initial;`).join('\n')}\n}\n`
}
