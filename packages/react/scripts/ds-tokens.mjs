// SPDX-License-Identifier: MIT
// design/tokens.json → design-pipeline 设计系统包的 tokens.json（格式见 design-pipeline `skill/references/design-system-package.md`，2026-11-14 读，0.15.0-beta.1）。
// 纯函数，不读写文件，单测在 ds-tokens.test.ts。数值原样搬，不凑整、不改色：对不上对比度的保留原值，把比值写进 usage（管线规矩：合规变体是另一个主题，不偷偷改色）。

/** 设计系统包里出的主题：本包的 tokens.css 实装了的两个（Paper 在 @katana-ui/tokens 的 tokens.json 里有值，但没有实装，不进包）。 */
export const THEMES = [
  { id: 'console', name: 'Console' },
  { id: 'graphite', name: 'Graphite' },
]

/** 样式分组：一个字体角色一组（管线要求组内的样式同一个 family）。 */
const STYLE_GROUP = [
  ['Interface', 'sans', ['display', 'title', 'body', 'data', 'caption', 'micro']],
  ['Dot label', 'dot', ['tag', 'tag-md']],
  ['LCD readout', 'lcd', ['lcd']],
  ['Dense display', 'display', ['display-dense']],
  ['Chart numerals', 'mono', ['num-sm']],
]

/**
 * 要量对比度的文字与标记：[前景, 背景们, 下限]。
 * 4.5：正文大小的字；3：焦点环、有意义的标记与 24px 以上的大字（管线的分档）。
 * 一对一对量：过不了的不写进 contrast（写进去 check 就红），而是把比值写进前景 token 的 usage，颜色保持原值。
 */
const GROUNDS = ['bg-000', 'bg-100', 'bg-200', 'bg-300', 'bg-400']
const MEASURED = [
  ['ink-100', GROUNDS],
  ['ink-200', GROUNDS],
  ['ink-300', GROUNDS],
  ['ink-400', GROUNDS],
  ['signal-orange', GROUNDS],
  ['signal-amber', GROUNDS],
  ['signal-green', GROUNDS],
  ['signal-red', GROUNDS],
  ['signal-blue', GROUNDS],
  ['pnl-up', GROUNDS],
  ['pnl-down', GROUNDS],
  ['link-a', GROUNDS],
  ['link-b', GROUNDS],
  ['link-c', GROUNDS],
  ['link-d', GROUNDS],
  ['focus-ring', GROUNDS],
  ['lcd-fg', ['lcd-bg']],
  ['seg-on-ink', ['seg-on-bg']],
]
/** 焦点环按 3:1 量（管线：focus-ring 3:1）；其余先试 4.5，不过再试 3。 */
const FLOOR_ONLY_3 = new Set(['focus-ring'])

const clamp = (n) => Math.min(1, Math.max(0, n))

/** 解析 #rgb / #rrggbb；别的写法（rgba、渐变）返回 null：半透明色的对比度取决于压在什么上面，不量。 */
export function parseHex(value) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim())
  if (!m) return null
  const hex =
    m[1].length === 3
      ? m[1]
          .split('')
          .map((c) => c + c)
          .join('')
      : m[1]
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
}

export function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(clamp(r)) + 0.7152 * lin(clamp(g)) + 0.0722 * lin(clamp(b))
}

export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** token 在某个主题下的值（对象按主题取，字符串各主题共用）。 */
const valueIn = (token, theme) => (typeof token.value === 'object' ? token.value[theme] : token.value)

/** 沿 {别名} 解到最终的色值。 */
export function resolveColor(byName, name, theme, seen = new Set()) {
  if (seen.has(name)) throw new Error(`design/tokens.json：${name} 的别名成环`)
  seen.add(name)
  const token = byName.get(name)
  if (!token) throw new Error(`design/tokens.json：别名指向不存在的 token ${name}`)
  const value = valueIn(token, theme)
  const alias = /^\{([^}]+)\}$/.exec(value)
  return alias ? resolveColor(byName, alias[1], theme, seen) : value
}

const fmt = (n) => n.toFixed(2)

/** 量一对：在每个主题里都得过线才算过。返回最低的那个比值。 */
function measure(byName, fg, bg) {
  let worst = Infinity
  for (const { id } of THEMES) {
    const a = parseHex(resolveColor(byName, fg, id))
    const b = parseHex(resolveColor(byName, bg, id))
    if (!a || !b) return null
    worst = Math.min(worst, ratio(a, b))
  }
  return worst
}

/**
 * 对比度表与「没过线」的备注。
 * 返回 { contrast, notes }：notes 是 token 名 → 要追加进 usage 的句子。
 */
export function buildContrast(source) {
  const byName = new Map(source.color.tokens.map((t) => [t.name, t]))
  const groups = new Map() // `${fg}|${min}` → grounds
  const notes = new Map()
  for (const [fg, grounds] of MEASURED) {
    const failed = []
    for (const bg of grounds) {
      const r = measure(byName, fg, bg)
      if (r === null) throw new Error(`design/tokens.json：${fg} 或 ${bg} 不是不透明色值，没法量对比度`)
      const min = FLOOR_ONLY_3.has(fg) ? 3 : r >= 4.5 ? 4.5 : r >= 3 ? 3 : 0
      if (!min) {
        failed.push(`${bg} ${fmt(r)}:1`)
        continue
      }
      if (min === 3 && !FLOOR_ONLY_3.has(fg)) failed.push(`${bg} ${fmt(r)}:1（只到 3:1）`)
      const key = `${fg}|${min}`
      groups.set(key, [...(groups.get(key) ?? []), bg])
    }
    if (failed.length) {
      notes.set(
        fg,
        `对比度（取两个主题里较低的）：${failed.join('、')}，低于正文的 4.5:1。保留原值不改色；只用在不要求 4.5:1 的地方（大字、标记、装饰），小字不用它。`,
      )
    }
  }
  const contrast = [...groups].map(([key, on]) => {
    const [text, min] = key.split('|')
    return { text, on, min: Number(min) }
  })
  return { contrast, notes }
}

/** 色板：去掉 Paper，补上对比度没过线的备注。 */
function buildColors(source, notes) {
  const tokens = source.color.tokens.map((token) => {
    const value =
      typeof token.value === 'object' ? Object.fromEntries(THEMES.map(({ id }) => [id, token.value[id]])) : token.value
    // 只在两个主题的值相同时折成字符串；不同就留对象。
    const same = typeof value === 'object' && THEMES.every(({ id }) => value[id] === value[THEMES[0].id])
    const note = notes.get(token.name)
    return {
      name: token.name,
      value: same ? value[THEMES[0].id] : value,
      usage: note ? `${token.usage} ${note}` : token.usage,
    }
  })
  return { themes: THEMES, tokens }
}

function buildType(source) {
  const families = Object.fromEntries(Object.entries(source.type.families).map(([key, f]) => [key, f.value]))
  const byName = new Map(source.type.scale.tokens.map((t) => [t.name, t]))
  const used = new Set()
  const groups = STYLE_GROUP.map(([name, family, members]) => ({
    name,
    family,
    styles: members.map((member) => {
      const s = byName.get(member)
      if (!s) throw new Error(`design/tokens.json：type.scale 里没有 ${member}`)
      used.add(member)
      return {
        name: member,
        family,
        fontSize: s.size,
        lineHeight: s.line,
        fontWeight: Number(s.weight),
        ...(s.tracking ? { letterSpacing: s.tracking } : {}),
        usage: s.usage,
        sample: SAMPLES[member] ?? member,
      }
    }),
  }))
  for (const name of byName.keys()) {
    if (!used.has(name))
      throw new Error(`design/tokens.json：type.scale 的 ${name} 没有归进 ds-tokens.mjs 的 STYLE_GROUP`)
  }
  // 字体文件在应用里按 design/tokens.json 的 type.fonts 装载，设计系统包不带 fonts/。
  return { fonts: [], families, groups }
}

/** 文字样式的示例文字：真实场景里的写法，不是 lorem。数值是示例。 */
const SAMPLES = {
  display: '1,234.50',
  title: 'Order ticket',
  body: 'Position limit applies per account.',
  data: 'Last 1,234.50',
  caption: 'Updated 14:32:10',
  micro: 'BID',
  lcd: '14:32:10',
  tag: 'PAPER',
  'tag-md': 'ACCT A',
  'display-dense': '1,200',
  'num-sm': '1,230.00',
}

/**
 * 间距与圆角：长度表，管线只收一个值（不分主题）。主题级的值取 Console 的，其余主题的值写进 usage，
 * 不丢：真正按主题出值的是 tokens.css（bundle.css 里带着）。
 */
function buildLengths(group) {
  return {
    tokens: group.tokens.map((token) => {
      if (typeof token.value !== 'object') return { name: token.name, value: token.value, usage: token.usage }
      const others = THEMES.slice(1)
        .filter(({ id }) => token.value[id] !== token.value[THEMES[0].id])
        .map(({ name, id }) => `${name} 下为 ${token.value[id]}`)
      return {
        name: token.name,
        value: token.value[THEMES[0].id],
        usage: others.length ? `${token.usage} ${others.join('，')}。` : token.usage,
      }
    }),
  }
}

/** design/tokens.json → 设计系统包的 tokens.json。 */
export function buildDesignSystemTokens(source) {
  const { contrast, notes } = buildContrast(source)
  return {
    name: source.name,
    version: 1,
    color: buildColors(source, notes),
    type: buildType(source),
    spacing: buildLengths(source.spacing),
    radius: buildLengths(source.radius),
    contrast,
  }
}
