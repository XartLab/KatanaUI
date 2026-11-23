// SPDX-License-Identifier: MIT
// 徽标的质量过滤（纯函数，只在命令行 katana-logos sync 里用，Node 的 zlib 解 PNG）：
// 读出格式与宽高（PNG、JPEG、GIF、WebP、ICO、SVG），能解像素的（PNG、ICO 里嵌的 PNG）再查是不是空白或一整块单色。
// 丢的规则（#95，2026-11-19 定）：宽或高 < 32px 丢；Google favicon 服务的 16px 地球占位丢；宽高比 > 2.2 的横向字标丢（圆标里看不清）；
// 全透明或单色近似空白丢。被丢的给原因，流水线接着试下一个来源。
import { inflateSync } from 'node:zlib'

export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'ico' | 'svg'

export type ImageProbe = {
  format: ImageFormat
  width: number
  height: number
  /** 解得出像素时：RGBA，每像素 4 字节。 */
  rgba?: Uint8Array
}

export type RejectReason = 'unreadable' | 'too-small' | 'google-placeholder' | 'wordmark' | 'blank' | 'flat'

export type Assessment =
  | { ok: true; format: ImageFormat; width: number; height: number }
  | { ok: false; reason: RejectReason; format?: ImageFormat; width?: number; height?: number }

export const MIN_SIZE = 32
export const MAX_ASPECT = 2.2

const u16be = (b: Uint8Array, i: number) => (b[i]! << 8) | b[i + 1]!
const u16le = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8)
const u32be = (b: Uint8Array, i: number) => ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!
const ascii = (b: Uint8Array, i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n))

/** 解 PNG（8 / 16 位，灰、RGB、调色板、灰 + α、RGBA；不解隔行扫描，隔行只给宽高）。 */
export function decodePng(b: Uint8Array): ImageProbe | undefined {
  if (b.length < 33 || u32be(b, 0) !== 0x89504e47) return undefined
  const width = u32be(b, 16)
  const height = u32be(b, 20)
  const depth = b[24]!
  const type = b[25]!
  const interlace = b[28]!
  const idat: Uint8Array[] = []
  let palette: Uint8Array | undefined
  let trns: Uint8Array | undefined
  for (let i = 8; i + 8 <= b.length;) {
    const len = u32be(b, i)
    const name = ascii(b, i + 4, 4)
    const data = b.subarray(i + 8, i + 8 + len)
    if (name === 'IDAT') idat.push(data)
    else if (name === 'PLTE') palette = data
    else if (name === 'tRNS') trns = data
    else if (name === 'IEND') break
    i += 12 + len
  }
  const probe: ImageProbe = { format: 'png', width, height }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
  if (!channels || interlace !== 0 || (depth !== 8 && depth !== 16) || width * height > 4096 * 4096) return probe
  let raw: Uint8Array
  try {
    raw = inflateSync(Buffer.concat(idat))
  } catch {
    return probe
  }
  const bpp = channels * (depth / 8)
  const stride = width * bpp
  if (raw.length < (stride + 1) * height) return probe
  const px = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const row = px.subarray(y * stride, (y + 1) * stride)
    const up = y > 0 ? px.subarray((y - 1) * stride, y * stride) : undefined
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp]! : 0
      const c = up && x >= bpp ? up[x - bpp]! : 0
      const u = up ? up[x]! : 0
      let v = src[x]!
      if (filter === 1) v += a
      else if (filter === 2) v += u
      else if (filter === 3) v += (a + u) >> 1
      else if (filter === 4) {
        const p = a + u - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - u)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c
      }
      row[x] = v & 0xff
    }
  }
  const rgba = new Uint8Array(width * height * 4)
  const at = (i: number, ch: number) => px[i * bpp + ch * (depth / 8)]! // 16 位取高字节
  for (let i = 0; i < width * height; i++) {
    let r: number, g: number, bl: number, al: number
    if (type === 0) {
      r = g = bl = at(i, 0)
      al = trns && trns.length >= 2 && depth === 8 && u16be(trns, 0) === r ? 0 : 255
    } else if (type === 2) {
      ;[r, g, bl, al] = [at(i, 0), at(i, 1), at(i, 2), 255]
    } else if (type === 3) {
      const k = at(i, 0)
      r = palette?.[k * 3] ?? 0
      g = palette?.[k * 3 + 1] ?? 0
      bl = palette?.[k * 3 + 2] ?? 0
      al = trns?.[k] ?? 255
    } else if (type === 4) {
      r = g = bl = at(i, 0)
      al = at(i, 1)
    } else {
      ;[r, g, bl, al] = [at(i, 0), at(i, 1), at(i, 2), at(i, 3)]
    }
    rgba.set([r, g, bl, al], i * 4)
  }
  return { ...probe, rgba }
}

function probeJpeg(b: Uint8Array): ImageProbe | undefined {
  if (b[0] !== 0xff || b[1] !== 0xd8) return undefined
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) return undefined
    const marker = b[i + 1]!
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return { format: 'jpeg', height: u16be(b, i + 5), width: u16be(b, i + 7) }
    i += 2 + u16be(b, i + 2)
  }
  return undefined
}

function probeWebp(b: Uint8Array): ImageProbe | undefined {
  if (b.length < 30 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WEBP') return undefined
  const kind = ascii(b, 12, 4)
  if (kind === 'VP8 ') return { format: 'webp', width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff }
  if (kind === 'VP8L') {
    const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24)
    return { format: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (kind === 'VP8X')
    return {
      format: 'webp',
      width: (b[24]! | (b[25]! << 8) | (b[26]! << 16)) + 1,
      height: (b[27]! | (b[28]! << 8) | (b[29]! << 16)) + 1,
    }
  return undefined
}

/** ICO：挑最大的一张；嵌的是 PNG 就解它。 */
function probeIco(b: Uint8Array): ImageProbe | undefined {
  if (b.length < 6 || u16le(b, 0) !== 0 || u16le(b, 2) !== 1) return undefined
  const count = u16le(b, 4)
  let best: { w: number; h: number; offset: number; size: number } | undefined
  for (let k = 0; k < count && 6 + k * 16 + 16 <= b.length; k++) {
    const e = 6 + k * 16
    const w = b[e] || 256
    const h = b[e + 1] || 256
    const size = b[e + 8]! | (b[e + 9]! << 8) | (b[e + 10]! << 16) | (b[e + 11]! << 24)
    const offset = b[e + 12]! | (b[e + 13]! << 8) | (b[e + 14]! << 16) | (b[e + 15]! << 24)
    if (!best || w * h > best.w * best.h) best = { w, h, offset, size }
  }
  if (!best) return undefined
  const png = decodePng(b.subarray(best.offset, best.offset + best.size))
  return png ? { ...png, format: 'ico' } : { format: 'ico', width: best.w, height: best.h }
}

const SVG_DRAWING = /<(path|circle|rect|polygon|polyline|ellipse|line|image|text|use)\b/i

function probeSvg(text: string): (ImageProbe & { empty: boolean }) | undefined {
  const open = /<svg\b[^>]*>/i.exec(text)?.[0]
  if (!open) return undefined
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(open)?.[1]
  const viewBox = attr('viewBox')
    ?.split(/[\s,]+/)
    .map(Number)
  const num = (v: string | undefined) => (v && /^[\d.]+(px)?$/.test(v) ? Number.parseFloat(v) : undefined)
  const width = num(attr('width')) ?? viewBox?.[2] ?? 0
  const height = num(attr('height')) ?? viewBox?.[3] ?? 0
  return { format: 'svg', width, height, empty: !SVG_DRAWING.test(text) }
}

/** 读格式与宽高（能解像素的连像素）；认不出返回 undefined。 */
export function probeImage(bytes: Uint8Array): (ImageProbe & { empty?: boolean }) | undefined {
  if (bytes.length < 4) return undefined
  const head = ascii(bytes, 0, Math.min(bytes.length, 512)).trimStart().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml') || head.startsWith('<!--'))
    return probeSvg(new TextDecoder().decode(bytes))
  if (ascii(bytes, 0, 3) === 'GIF') return { format: 'gif', width: u16le(bytes, 6), height: u16le(bytes, 8) }
  return decodePng(bytes) ?? probeJpeg(bytes) ?? probeWebp(bytes) ?? probeIco(bytes)
}

/** 像素是不是空白（几乎全透明）或一整块单色。 */
export function blankness(rgba: Uint8Array): 'blank' | 'flat' | undefined {
  const n = rgba.length / 4
  if (!n) return 'blank'
  let visible = 0
  let opaque = 0
  const min = [255, 255, 255]
  const max = [0, 0, 0]
  for (let i = 0; i < n; i++) {
    const a = rgba[i * 4 + 3]!
    if (a <= 16) continue
    visible++
    if (a >= 240) opaque++
    for (let c = 0; c < 3; c++) {
      const v = rgba[i * 4 + c]!
      if (v < min[c]!) min[c] = v
      if (v > max[c]!) max[c] = v
    }
  }
  if (visible / n < 0.01) return 'blank'
  const range = Math.max(max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!)
  if (opaque / n > 0.95 && range <= 12) return 'flat'
  return undefined
}

/** 按规则判一张图；source 用来认 Google favicon 的 16px 占位。 */
export function assessImage(bytes: Uint8Array, source: { url?: string } = {}): Assessment {
  const probe = probeImage(bytes)
  if (!probe || !probe.width || !probe.height)
    return { ok: false, reason: 'unreadable', ...(probe ? { format: probe.format } : {}) }
  const { format, width, height } = probe
  const dims = { format, width, height }
  if (source.url?.includes('google.com/s2/favicons') && width <= 16 && height <= 16)
    return { ok: false, reason: 'google-placeholder', ...dims }
  // SVG 是矢量，不按像素尺寸丢。
  if (format !== 'svg' && Math.min(width, height) < MIN_SIZE) return { ok: false, reason: 'too-small', ...dims }
  if (width / height > MAX_ASPECT) return { ok: false, reason: 'wordmark', ...dims }
  if (probe.empty) return { ok: false, reason: 'blank', ...dims }
  if (probe.rgba) {
    const b = blankness(probe.rgba)
    if (b) return { ok: false, reason: b, ...dims }
  }
  return { ok: true, ...dims }
}

/** 测试与示例用：编码一张 RGBA 的 PNG（不压缩优化，过滤全 0）。 */
export async function encodePng(width: number, height: number, rgba: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const { deflateSync, crc32 } = await import('node:zlib')
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  const chunk = (name: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length)
    const view = new DataView(out.buffer)
    view.setUint32(0, data.length)
    out.set(new TextEncoder().encode(name), 4)
    out.set(data, 8)
    view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
    return out
  }
  const ihdr = new Uint8Array(13)
  const v = new DataView(ihdr.buffer)
  v.setUint32(0, width)
  v.setUint32(4, height)
  ihdr.set([8, 6, 0, 0, 0], 8)
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', new Uint8Array()),
    ]),
  )
}
