// SPDX-License-Identifier: MIT
// 代码块用的小型词法切分（katana/code-block.tsx 的文件头写了出处）：把一段源码按语言切成「类型 + 文字」，一行一组。
// 不是完整的语法分析：只认注释、字符串、数字、关键字、函数调用、标点这几类，够脚本、Agent 定义、文档里的代码看。
// 没有用 prism-react-renderer 之类的依赖：这几类用一条正则按次序切就够（2026-11-14 评估：加依赖要多一个包、多一份许可证审查，换来的只是更多语言）。

export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'function' | 'punctuation' | 'plain'
export type CodeToken = { type: TokenType; text: string }

export type Family = 'c' | 'python' | 'shell' | 'css' | 'json' | 'plain'

const C_KEYWORDS =
  'abstract as async await break case catch class const continue declare default delete do else enum export extends false finally for from function if implements import in instanceof interface let new null of private protected public readonly return static super switch this throw true try type typeof undefined var void while with yield'
const PYTHON_KEYWORDS =
  'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'
const SHELL_KEYWORDS = 'case do done elif else esac export fi for function if in local return select then until while'
const CSS_KEYWORDS = 'important media import supports keyframes layer font-face'

const FAMILIES: Readonly<Record<string, Family>> = {
  ts: 'c',
  tsx: 'c',
  js: 'c',
  jsx: 'c',
  mjs: 'c',
  javascript: 'c',
  typescript: 'c',
  rust: 'c',
  rs: 'c',
  go: 'c',
  java: 'c',
  c: 'c',
  cpp: 'c',
  py: 'python',
  python: 'python',
  sh: 'shell',
  bash: 'shell',
  shell: 'shell',
  zsh: 'shell',
  css: 'css',
  json: 'json',
  jsonc: 'json',
  yaml: 'shell',
  yml: 'shell',
  toml: 'shell',
}

export function familyOf(language: string): Family {
  return FAMILIES[language.toLowerCase()] ?? 'plain'
}

const words = (list: string) => `\\b(?:${list.trim().split(/\s+/).join('|')})\\b`
const STRING_DOUBLE = String.raw`"(?:[^"\\\n]|\\.)*"?`
const STRING_SINGLE = String.raw`'(?:[^'\\\n]|\\.)*'?`
const STRING_TICK = String.raw`\x60(?:[^\x60\\]|\\.)*\x60?`
const NUMBER = String.raw`\b(?:0x[\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b`
const PUNCTUATION = String.raw`[{}()[\];,.:<>=+\-*/%!&|^~?@]+`

/** 每一族一条正则：组的次序就是类型的次序（见 GROUPS），先写的先匹配。 */
const GROUPS: readonly TokenType[] = ['comment', 'string', 'number', 'keyword', 'function', 'punctuation']
const PATTERNS: Readonly<Record<Exclude<Family, 'plain'>, RegExp>> = {
  c: new RegExp(
    [
      String.raw`(//[^\n]*|/\*[\s\S]*?(?:\*/|$))`,
      `(${STRING_DOUBLE}|${STRING_SINGLE}|${STRING_TICK})`,
      `(${NUMBER})`,
      `(${words(C_KEYWORDS)})`,
      String.raw`([A-Za-z_$][\w$]*(?=\s*\())`,
      `(${PUNCTUATION})`,
    ].join('|'),
    'g',
  ),
  python: new RegExp(
    [
      String.raw`(#[^\n]*)`,
      `(${STRING_DOUBLE}|${STRING_SINGLE})`,
      `(${NUMBER})`,
      `(${words(PYTHON_KEYWORDS)})`,
      String.raw`([A-Za-z_]\w*(?=\())`,
      `(${PUNCTUATION})`,
    ].join('|'),
    'g',
  ),
  shell: new RegExp(
    [
      String.raw`(#[^\n]*)`,
      `(${STRING_DOUBLE}|${STRING_SINGLE})`,
      `(${NUMBER})`,
      `(${words(SHELL_KEYWORDS)})`,
      String.raw`((?<=\s)--?[A-Za-z][\w-]*)`,
      `(${PUNCTUATION})`,
    ].join('|'),
    'g',
  ),
  css: new RegExp(
    [
      String.raw`(/\*[\s\S]*?(?:\*/|$))`,
      `(${STRING_DOUBLE}|${STRING_SINGLE})`,
      String.raw`(#[\da-fA-F]{3,8}\b|-?\d[\d.]*(?:px|em|rem|%|ms|s|vh|vw|deg)?)`,
      String.raw`(@[\w-]+|!important|${words(CSS_KEYWORDS)})`,
      String.raw`(-{0,2}[A-Za-z][\w-]*(?=\s*:)|[A-Za-z-]+(?=\())`,
      `(${PUNCTUATION})`,
    ].join('|'),
    'g',
  ),
  json: new RegExp(
    [
      String.raw`(//[^\n]*)`,
      String.raw`("(?:[^"\\\n]|\\.)*"(?=\s*:))`,
      String.raw`("(?:[^"\\\n]|\\.)*"?)`,
      `(${NUMBER})`,
      String.raw`(\b(?:true|false|null)\b)`,
      `(${PUNCTUATION})`,
    ].join('|'),
    'g',
  ),
}
// JSON 的键与值分开着色：键当作 function 类（强调色浅一档），值是字符串。组次序与 GROUPS 不同，单独写。
const JSON_GROUPS: readonly TokenType[] = ['comment', 'function', 'string', 'number', 'keyword', 'punctuation']

/** 把源码切成行，每行是一串 token；多行的注释与模板字符串在每一行各自成一个 token。 */
export function highlight(code: string, language: string): CodeToken[][] {
  const family = familyOf(language)
  const lines: CodeToken[][] = [[]]
  const push = (type: TokenType, text: string) => {
    const parts = text.split('\n')
    parts.forEach((part, index) => {
      if (index > 0) lines.push([])
      if (part === '') return
      const line = lines[lines.length - 1]!
      const last = line[line.length - 1]
      if (last && last.type === type) last.text += part
      else line.push({ type, text: part })
    })
  }
  if (family === 'plain') {
    push('plain', code)
    return lines
  }
  const pattern = PATTERNS[family]
  const groups = family === 'json' ? JSON_GROUPS : GROUPS
  pattern.lastIndex = 0
  let cursor = 0
  for (const match of code.matchAll(pattern)) {
    const at = match.index
    if (at > cursor) push('plain', code.slice(cursor, at))
    const group = match.findIndex((value, index) => index > 0 && value !== undefined) - 1
    push(groups[group] ?? 'plain', match[0])
    cursor = at + match[0].length
  }
  if (cursor < code.length) push('plain', code.slice(cursor))
  return lines
}
