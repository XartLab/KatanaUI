// SPDX-License-Identifier: MIT
// 复制图与复制文字（#77 第 4 条，#22 G11）：把一张图（figure 或任何元素）拍成 PNG 写进剪贴板；写不进去就退回下载，结果用一个对象交回，提示由调用方画（katana/copy-toast）。
// 拍法：深拷贝节点，把每个元素的计算样式逐项写成行内样式（CSS 变量、类名在图片里都不生效），canvas 换成同尺寸的 <img>，
//   整棵放进 SVG 的 foreignObject，当图片画到 canvas 上再转 PNG。跟 html-to-image（MIT）同一个思路，实现是自己写的，没拷代码。
//   不用 canvas 的 drawElementImage（只有一个内核在实验，modern-web-guidance 标为 volatile）。
// 不进图：data-copy-image="skip" 的元素（ChartActions 自己带着，工具条不进截图，TradingView 的截图也不带工具条）。
// 字体（#87）：SVG 当图片画时取不到页面的网络字体，会退回系统字体；所以把图里用到的 @font-face 内嵌成 data URL 放进拷贝。
//   只嵌用到的：族名出现在图里某个元素的 font-family 里，且 unicode-range 碰到图里的字（方舟像素这类按字段切片的中文字体只拉用到的几片）；
//   跨源的样式表读不到规则、取字体失败的，都照旧退回系统字体。取过的字体按地址缓存，第二次复制不再下载。embedFonts: false 关掉。
// 剪贴板：ClipboardItem 直接收 Promise<Blob>，在点击的同一拍里调用 write，Safari 才认用户手势；只在安全上下文（https、localhost）可用。

export type CopyFailReason = 'unsupported' | 'denied' | 'render'

/** 复制的结果：copied 写进了剪贴板；downloaded 剪贴板不行（reason 说为什么）、改成下载了文件；failed 连图都没拍出来或文字没写进去。 */
export type CopyResult =
  | { status: 'copied'; kind: 'image' | 'text' }
  | { status: 'downloaded'; kind: 'image'; reason: Exclude<CopyFailReason, 'render'>; filename: string }
  | { status: 'failed'; kind: 'image' | 'text'; reason: CopyFailReason }

export type CopyImageOptions = {
  /** 退回下载时的文件名（不带也行，补 .png）；默认 chart.png。 */
  filename?: string
  /** 底色；默认取节点或最近一个有底色的祖先的背景色（图片默认透明，贴进聊天里会变成黑底或白底）。 */
  background?: string
  /** 像素倍数；默认 devicePixelRatio（至少 1，最多 3）。 */
  scale?: number
  /** 剪贴板拿不到时不下载，直接返回 failed。默认 false（退回下载）。 */
  noDownload?: boolean
  /** 把图里用到的网页字体内嵌进图片（不嵌就退回系统字体）。默认 true。 */
  embedFonts?: boolean
}

/** 一条 @font-face 的描述（嵌字体时照它重写一条，只把 src 换成 data URL）。 */
export type FontFaceSource = {
  family: string
  src: string
  unicodeRange: string
  weight: string
  style: string
  stretch: string
  /** 解析 src 里相对地址用的基准（样式表的地址）。 */
  base: string
}

/** font-family 的值拆成族名（去引号、小写）。 */
export function familyNames(value: string): string[] {
  return value
    .split(',')
    .map((name) =>
      name
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .toLowerCase(),
    )
    .filter(Boolean)
}

/** unicode-range 拆成闭区间：U+0-FF、U+4??（通配）、U+20AC；空串是全部。认不出的段丢掉。 */
export function parseUnicodeRange(range: string): [number, number][] {
  if (range.trim() === '') return [[0, 0x10ffff]]
  return range.split(',').flatMap((part): [number, number][] => {
    const match = /^\s*u\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?\s*$/i.exec(part)
    if (!match) return []
    const [, start, end] = match
    if (start!.includes('?'))
      return [[parseInt(start!.replaceAll('?', '0'), 16), parseInt(start!.replaceAll('?', 'f'), 16)]]
    const from = parseInt(start!, 16)
    return [[from, end ? parseInt(end, 16) : from]]
  })
}

/** 这段文字里有没有字落在这些区间里。 */
export function rangeCoversText(ranges: readonly (readonly [number, number])[], text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0)!
    if (ranges.some(([from, to]) => code >= from && code <= to)) return true
  }
  return false
}

/** src 里取一个地址：有 woff2 先用 woff2，没有取第一个 url()；local() 不算。 */
export function fontUrlOf(src: string): string | null {
  const urls = [...src.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)(?:\s*format\(\s*['"]?([\w-]+)['"]?\s*\))?/g)].map(
    (match) => ({ url: match[2]!, format: match[3] }),
  )
  return (urls.find((entry) => entry.format === 'woff2' || /\.woff2([?#]|$)/i.test(entry.url)) ?? urls[0])?.url ?? null
}

/** 挑出要嵌的 @font-face：族名在 used 里，unicode-range 碰到 text 里的字。 */
export function pickFontFaces(
  faces: readonly FontFaceSource[],
  used: ReadonlySet<string>,
  text: string,
): FontFaceSource[] {
  return faces.filter(
    (face) => used.has(face.family.toLowerCase()) && rangeCoversText(parseUnicodeRange(face.unicodeRange), text),
  )
}

/** 照描述写一条 @font-face，src 换成给的地址（data URL）。 */
export function fontFaceCss(face: FontFaceSource, url: string): string {
  const parts = [`font-family:"${face.family}"`, `src:url("${url}")`]
  if (face.weight) parts.push(`font-weight:${face.weight}`)
  if (face.style) parts.push(`font-style:${face.style}`)
  if (face.stretch) parts.push(`font-stretch:${face.stretch}`)
  if (face.unicodeRange) parts.push(`unicode-range:${face.unicodeRange}`)
  return `@font-face{${parts.join(';')}}`
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const XHTML_NS = 'http://www.w3.org/1999/xhtml'

/** 剪贴板能不能写图：要 ClipboardItem、clipboard.write，且是安全上下文。 */
export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    globalThis.isSecureContext !== false &&
    (typeof ClipboardItem.supports !== 'function' || ClipboardItem.supports('image/png'))
  )
}

/** 节点的底色：从自己往上找第一个不透明的背景色；都没有给白。 */
function backgroundOf(node: Element): string {
  for (let el: Element | null = node; el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor
    if (color && color !== 'transparent' && !/rgba?\(.*,\s*0\)$/.test(color) && !/\/\s*0\)$/.test(color)) return color
  }
  return '#ffffff'
}

/** 把源节点的计算样式逐项抄到拷贝上（两棵树同构，按同样的次序走）。 */
function inlineStyles(source: Element, clone: Element) {
  const computed = getComputedStyle(source)
  const style = (clone as HTMLElement | SVGElement).style
  if (style) {
    let text = ''
    for (let i = 0; i < computed.length; i++) {
      const name = computed[i]!
      // 自定义属性已经算进了具体的值，不用带；过渡与动画会让图停在中间帧，去掉。
      if (name.startsWith('--') || name.startsWith('transition') || name.startsWith('animation')) continue
      text += `${name}:${computed.getPropertyValue(name)};`
    }
    style.cssText = text
  }
  const kids = source.children
  const cloneKids = clone.children
  for (let i = 0; i < kids.length; i++) if (cloneKids[i]) inlineStyles(kids[i]!, cloneKids[i]!)
}

/** 拷贝一棵树：去掉 skip 的元素，canvas 换成 img（带上当前画面）。返回的拷贝与源节点同构（skip 的换成空的占位，次序不乱）。 */
function cloneForImage(node: Element): Element {
  const clone = node.cloneNode(true) as Element
  // 先抄样式（此时两棵树仍同构），再改结构。
  inlineStyles(node, clone)
  const sourceCanvases = node.querySelectorAll('canvas')
  clone.querySelectorAll('canvas').forEach((canvas, index) => {
    const source = sourceCanvases[index]
    if (!source) return
    const img = document.createElement('img')
    try {
      img.src = source.toDataURL('image/png')
    } catch {
      // 被跨源图片弄脏的 canvas 读不出来：留空。
    }
    img.style.cssText = canvas.getAttribute('style') ?? ''
    img.width = source.clientWidth || source.width
    img.height = source.clientHeight || source.height
    canvas.replaceWith(img)
  })
  // 用 opacity 藏：子元素的行内样式里抄进了 visibility: visible，会压过父元素的 hidden；opacity 管住整棵，位置也不动。
  clone.querySelectorAll('[data-copy-image="skip"]').forEach((el) => {
    ;(el as HTMLElement).style.opacity = '0'
  })
  return clone
}

/** 页面上所有读得到的 @font-face（跨源样式表读不到规则，跳过）；进 @media、@supports、@layer 与 @import 里找。 */
function pageFontFaces(): FontFaceSource[] {
  const out: FontFaceSource[] = []
  const walk = (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const style = rule.style
        const family = style
          .getPropertyValue('font-family')
          .trim()
          .replace(/^['"]|['"]$/g, '')
        if (!family) continue
        out.push({
          family,
          src: style.getPropertyValue('src'),
          unicodeRange: style.getPropertyValue('unicode-range'),
          weight: style.getPropertyValue('font-weight'),
          style: style.getPropertyValue('font-style'),
          stretch: style.getPropertyValue('font-stretch'),
          base,
        })
      } else if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules, rule.styleSheet.href ?? base)
        } catch {
          // 跨源的 @import 读不到规则。
        }
      } else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, base)
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, sheet.href ?? document.baseURI)
    } catch {
      // 跨源样式表（如 Google Fonts）读 cssRules 会抛 SecurityError：这些字体照旧退回系统字体。
    }
  }
  return out
}

/** 取过的字体（地址 → data URL）；取失败记 null，不再重试。 */
const fontCache = new Map<string, Promise<string | null>>()

const fontDataUrl = (url: string): Promise<string | null> => {
  let cached = fontCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
      .then(
        (blob) =>
          new Promise<string | null>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          }),
      )
      .catch(() => null)
    fontCache.set(url, cached)
  }
  return cached
}

/** 图里用到的网页字体写成一段内嵌的 @font-face；没有可嵌的返回空串。不抛错。 */
async function embeddedFontCss(node: Element): Promise<string> {
  const used = new Set<string>()
  for (const el of [node, ...Array.from(node.querySelectorAll('*'))])
    for (const name of familyNames(getComputedStyle(el).fontFamily)) used.add(name)
  const faces = pickFontFaces(pageFontFaces(), used, node.textContent ?? '')
  const rules = await Promise.all(
    faces.map(async (face) => {
      const url = fontUrlOf(face.src)
      if (!url) return null
      const data = await fontDataUrl(new URL(url, face.base).href)
      return data ? fontFaceCss(face, data) : null
    }),
  )
  return rules.filter((rule): rule is string => rule !== null).join('\n')
}

/** 把元素拍成 PNG（不碰剪贴板）。拍不出来时抛错。 */
export async function elementToPng(
  node: Element,
  options: Pick<CopyImageOptions, 'background' | 'scale' | 'embedFonts'> = {},
) {
  const box = node.getBoundingClientRect()
  const width = Math.max(1, Math.ceil(box.width))
  const height = Math.max(1, Math.ceil(box.height))
  const scale = options.scale ?? Math.min(3, Math.max(1, globalThis.devicePixelRatio || 1))
  const clone = cloneForImage(node)
  ;(clone as HTMLElement).style.margin = '0'
  clone.setAttribute('xmlns', XHTML_NS)
  const fontCss = options.embedFonts === false ? '' : await embeddedFontCss(node).catch(() => '')
  if (fontCss) {
    const style = document.createElementNS(XHTML_NS, 'style')
    style.textContent = fontCss
    clone.prepend(style)
  }

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('xmlns', SVG_NS)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  const object = document.createElementNS(SVG_NS, 'foreignObject')
  object.setAttribute('width', '100%')
  object.setAttribute('height', '100%')
  object.append(clone)
  svg.append(object)
  const markup = new XMLSerializer().serializeToString(svg)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

  const image = new Image()
  image.decoding = 'async'
  image.src = url
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no 2d context')
  context.fillStyle = options.background ?? backgroundOf(node)
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)
  const { promise, resolve, reject } = Promise.withResolvers<Blob>()
  canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  return promise
}

/** 存成文件（a[download]）。 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const reasonOf = (error: unknown): Exclude<CopyFailReason, 'render'> =>
  error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unsupported'

/**
 * 把元素拍成 PNG 写进剪贴板；剪贴板不支持或被拒，就退回下载（options.noDownload 时不下载）。
 * 要在点击处理里直接调用（不要先 await 别的），浏览器才认这是用户手势。不抛错，结果见 CopyResult。
 */
export async function copyImage(node: Element, options: CopyImageOptions = {}): Promise<CopyResult> {
  const filename = (options.filename ?? 'chart').replace(/(\.png)?$/i, '.png')
  const png = elementToPng(node, options)
  // 先接住拍图的失败，免得 ClipboardItem 那边把它当成剪贴板被拒。
  let rendered: Blob | undefined
  const settled = png.then(
    (blob) => (rendered = blob),
    () => undefined,
  )
  let reason: Exclude<CopyFailReason, 'render'> = 'unsupported'
  if (canCopyImage()) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      return { status: 'copied', kind: 'image' }
    } catch (error) {
      reason = reasonOf(error)
    }
  }
  await settled
  if (!rendered) return { status: 'failed', kind: 'image', reason: 'render' }
  if (options.noDownload) return { status: 'failed', kind: 'image', reason }
  downloadBlob(rendered, filename)
  return { status: 'downloaded', kind: 'image', reason, filename }
}

/** 写一段文字进剪贴板（复制代码、复制直链）。不抛错。 */
export async function copyText(text: string): Promise<CopyResult> {
  if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function')
    return { status: 'failed', kind: 'text', reason: 'unsupported' }
  try {
    await navigator.clipboard.writeText(text)
    return { status: 'copied', kind: 'text' }
  } catch (error) {
    return { status: 'failed', kind: 'text', reason: reasonOf(error) }
  }
}
