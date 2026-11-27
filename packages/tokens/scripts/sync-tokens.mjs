// SPDX-License-Identifier: MIT
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// src/tokens.json + src/motion.tokens.json → src/tokens.css（本包的 token 层）。
// 搬自 KATANAview 的 scripts/sync-tokens.mjs（2026-11-14，KatanaUI #2：设计系统独立成仓库，token 源头随包走），2026-11-14 从 @katana-ui/react 拆进 @katana-ui/tokens；原作者同为本项目，许可证改为 MIT。
// token 名与组件卡、原型完全一致，卡里的 CSS 可以原样搬进来。
// 主题：:root 是默认主题 Graphite（用户 2026-11-14 定，KATANAview #1775）；其余已实装的主题（Console）各出一块 :root[data-theme='…']，只写与 Graphite 不同的值（引用型 token 随被引用的值走，不用重写）。
// 有 reduced 的 token（玻璃）在「减少透明度」时另出一块 :root:not([data-theme='…'])[data-transparency='reduced']（默认主题的，不影响别的主题）。
// 用法：node scripts/sync-tokens.mjs 重新生成；加 --check 只比对，生成物与源头不一致就退出码 1（pnpm test 跑这个）。

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const tokens = JSON.parse(readFileSync(resolve(pkg, 'src/tokens.json'), 'utf8'))
const motion = JSON.parse(readFileSync(resolve(pkg, 'src/motion.tokens.json'), 'utf8'))
const target = resolve(pkg, 'src/tokens.css')

const cssValue = (value) => String(value).replace(/\{([^}]+)\}/g, (_, name) => `var(--${name})`)

/** 弹簧 → CSS linear() 缓动 + 时长（与 motion.ts 里 motion/react 用的是同一组参数）。 */
function springEasing({ stiffness, damping, mass }) {
  const dt = 1 / 600
  const points = []
  let x = 0
  let v = 0
  let t = 0
  while (t < 2) {
    const a = (-stiffness * (x - 1) - damping * v) / mass
    v += a * dt
    x += v * dt
    t += dt
    points.push([t, x])
    if (t > 0.1 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break
  }
  const total = points[points.length - 1][0]
  const samples = Array.from({ length: 25 }, (_, i) => {
    if (i === 0) return 0
    const at = (total * i) / 24
    const nearest = points.reduce((best, point) => (Math.abs(point[0] - at) < Math.abs(best[0] - at) ? point : best))
    return Math.round(nearest[1] * 1000) / 1000
  })
  return { easing: `linear(${samples.join(', ')})`, ms: Math.round(total * 1000) }
}

/** 默认主题：它的值在 :root，没写 data-theme 的地方就是它。 */
const DEFAULT_THEME = 'graphite'
/** 已实装、要出样式块的非默认主题。 */
// 其余主题读 tokens.json 的 color.themes（2026-11-17 起：Console、Paper、Midnight、Dim、High contrast）。
const THEMES = tokens.color.themes.map((theme) => theme.id).filter((id) => id !== DEFAULT_THEME)

/**
 * 「红涨绿跌」（#456、决策记录 0019）：data-updown="cn" 时互换的 token 对。每个主题各出一块（-100/-200 档是写死的色值，两个主题不一样），
 * 内容是把一对的值对调；引用型的（pnl-up → signal-green）对调后仍是引用，Graphite 的绿红跟着 Graphite 走。
 * 表示错误、危险的 signal-red 不在里面。
 * 涨跌约定能在任意子树上切（A 股看板与加密货币面板并排，KATANAview #2164）：块的选择器认 [data-updown='cn'] / [data-updown='intl'] 这个元素本身，
 * 而不只认根。自定义属性里的 var() 在声明它的元素上就算成定值再往下继承，所以光换 --pnl-up 不够：引用了这四对 token 的派生 token
 * （--k-tone-up-foreground、--div-pos 这类，递归找）要在同一个块里重声明，才会按子树元素自己的 --pnl-up 重新算。
 */
const UPDOWN_SWAPS = [
  ['pnl-up', 'pnl-down'],
  ['pnl-up-area', 'pnl-down-area'],
  ['div-neg-100', 'div-pos-100'],
  ['div-neg-200', 'div-pos-200'],
]

const groups = [tokens.color, tokens.spacing, tokens.radius, tokens.shadow, tokens.border, tokens.motion]
const lines = []
const defaultReducedLines = []
const themed = Object.fromEntries(THEMES.map((theme) => [theme, { values: [], reduced: [] }]))
for (const group of groups) {
  for (const token of group.tokens) {
    const themedValue = token.value && typeof token.value === 'object'
    const value = themedValue ? token.value[DEFAULT_THEME] : token.value
    if (value !== undefined) lines.push(`  --${token.name}: ${cssValue(value)};`)
    if (!themedValue) continue
    for (const theme of THEMES) {
      const other = token.value[theme]
      if (other === undefined) throw new Error(`src/tokens.json：${token.name} 缺少 ${theme} 的值`)
      if (cssValue(other) !== cssValue(value)) themed[theme].values.push(`  --${token.name}: ${cssValue(other)};`)
      const reduced = token.reduced?.[theme]
      if (reduced !== undefined) themed[theme].reduced.push(`  --${token.name}: ${cssValue(reduced)};`)
    }
    const defaultReduced = token.reduced?.[DEFAULT_THEME]
    if (defaultReduced !== undefined) defaultReducedLines.push(`  --${token.name}: ${cssValue(defaultReduced)};`)
  }
}
const colorValue = (name, theme) => {
  const token = tokens.color.tokens.find((item) => item.name === name)
  if (!token) throw new Error(`src/tokens.json：UPDOWN_SWAPS 里的 ${name} 不存在`)
  return cssValue(token.value[theme])
}
// 派生 token：值里引用了换色 token（或别的派生 token）的，递归找到不动点。分主题的值各主题都看一遍。
const swapped = new Set(UPDOWN_SWAPS.flat())
const everyToken = [...groups, tokens.foundation, tokens.characteristics].flatMap((group) => group.tokens)
const derived = new Set()
for (let grew = true; grew; ) {
  grew = false
  for (const token of everyToken) {
    if (swapped.has(token.name) || derived.has(token.name)) continue
    const values = token.value && typeof token.value === 'object' ? Object.values(token.value) : [token.value]
    const refs = values.flatMap((value) => [...String(value).matchAll(/\{([^}]+)\}/g)].map((match) => match[1]))
    if (!refs.some((name) => swapped.has(name) || derived.has(name))) continue
    derived.add(token.name)
    grew = true
  }
}
const tokenValue = (token, theme) => cssValue(token.value && typeof token.value === 'object' ? token.value[theme] : token.value)
const derivedLines = (theme) =>
  everyToken.filter((token) => derived.has(token.name)).map((token) => `  --${token.name}: ${tokenValue(token, theme)};`)
// cn：互换；intl：不互换（原样），用来在 cn 的根下面切回来。两种都带上派生 token。
const updown = { cn: {}, intl: {} }
for (const theme of [DEFAULT_THEME, ...THEMES]) {
  updown.cn[theme] = []
  updown.intl[theme] = []
  for (const [a, b] of UPDOWN_SWAPS) {
    const [va, vb] = [colorValue(a, theme), colorValue(b, theme)]
    if (va === vb) continue
    updown.cn[theme].push(`  --${a}: ${vb};`, `  --${b}: ${va};`)
    updown.intl[theme].push(`  --${a}: ${va};`, `  --${b}: ${vb};`)
  }
  updown.cn[theme].push(...derivedLines(theme))
  updown.intl[theme].push(...derivedLines(theme))
}
// 文字样式表：--text-<档> 是 font 简写的前三项（字重 字号/行高），组件写 font: var(--text-档) var(--font-角色)；
// --text-<档>-size 给只要字号的地方（继承字重与行高的小件、画布取字号）；有字距的档另出 --text-<档>-tracking。
for (const { name, weight, size, line, tracking } of tokens.type.scale.tokens) {
  // 字重加 --k-weight-adjust（渲染设置的字重补偿，默认 0）；字号与行高乘 --k-text-scale（默认 1）后取整到整像素，缩放后文字仍落在像素格上。
  const px = (v) => `round(nearest, calc(${v} * var(--k-text-scale, 1)), 1px)`
  lines.push(
    `  --text-${name}: calc(${weight} + var(--k-weight-adjust, 0)) ${px(size)}/${px(line)};`,
    `  --text-${name}-size: ${px(size)};`,
  )
  if (tracking) lines.push(`  --text-${name}-tracking: ${tracking};`)
}
for (const [name, family] of Object.entries(tokens.type.families)) lines.push(`  --font-${name}: ${family.value};`)
for (const name of ['snappy', 'gentle', 'settle']) {
  const { easing, ms } = springEasing(motion[name])
  lines.push(`  --ease-${name}: ${easing};`, `  --dur-${name}: ${ms}ms;`)
}

// Foundation 与 characteristics（#1943，照 Salt 的三层）：不分主题，都生成在 :root；characteristics 只引用 palette 与 foundation。
for (const group of [tokens.foundation, tokens.characteristics]) {
  for (const token of group.tokens) {
    if (typeof token.value !== 'string') throw new Error(`src/tokens.json：${token.name} 必须是不分主题的字符串`)
    lines.push(`  --${token.name}: ${cssValue(token.value)};`)
  }
}

// 密度：medium 在最前（同时挂 :root，没声明 data-density 的地方就是它），high、low 同权重、后写的赢。
const densityBlock = (level) =>
  tokens.density.tokens.map((token) => `  --${token.name}: ${cssValue(token.value[level])};`).join('\n')
const densityBlocks = [
  tokens.density.default,
  ...tokens.density.levels.filter((l) => l !== tokens.density.default),
].map((level, index) => {
  const selector = index === 0 ? `:root, [data-density='${level}']` : `[data-density='${level}']`
  return `${selector} {\n${densityBlock(level)}\n}`
})

const blocks = [`:root {\n${lines.join('\n')}\n}`, ...densityBlocks]
// 默认主题的「减少透明度」块写在主题块之前：Console 没有 reduced 值，不该被它改到，所以用 :not 排除。
if (defaultReducedLines.length) {
  const others = THEMES.map((theme) => `:not([data-theme='${theme}'])`).join('')
  blocks.push(`:root${others}[data-transparency='reduced'] {\n${defaultReducedLines.join('\n')}\n}`)
}
for (const theme of THEMES) {
  blocks.push(`:root[data-theme='${theme}'] {\n${themed[theme].values.join('\n')}\n}`)
  if (themed[theme].reduced.length)
    blocks.push(`:root[data-theme='${theme}'][data-transparency='reduced'] {\n${themed[theme].reduced.join('\n')}\n}`)
}
// 涨跌约定块放在主题块之后：选择器的权重相同，后写的赢。
// 选择器权重要与主题块相同或更高（0,2,0 起）：根上的 [data-updown] 与 :root[data-theme] 同权重，靠写在后面赢；子树上的元素是直接声明，本来就压过继承。
// intl 在根上不用写（根默认就是不互换的），只在根下面的元素上写。
for (const theme of [DEFAULT_THEME, ...THEMES]) {
  const scope = theme === DEFAULT_THEME ? ':root' : `:root[data-theme='${theme}']`
  blocks.push(`${scope}[data-updown='cn'],\n${scope} [data-updown='cn'] {\n${updown.cn[theme].join('\n')}\n}`)
  blocks.push(`${scope} [data-updown='intl'] {\n${updown.intl[theme].join('\n')}\n}`)
}
const generated = `/* Generated from src/tokens.json + src/motion.tokens.json by scripts/sync-tokens.mjs. Do not edit. */\n${blocks.join('\n')}\n`
let current = ''
try {
  current = readFileSync(target, 'utf8')
} catch {
  /* first run */
}
if (current !== generated) {
  if (check) {
    console.error('src/tokens.css 与 token 源头不一致：跑 pnpm tokens:sync 重新生成并提交。')
    process.exit(1)
  }
  writeFileSync(target, generated)
}
