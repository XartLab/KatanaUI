// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { assessImage, blankness, decodePng, encodePng, probeImage } from './image.ts'

/** 生成 RGBA：f(x, y) → [r, g, b, a]。 */
const pixels = (w: number, h: number, f: (x: number, y: number) => number[]) => {
  const out = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(f(x, y), (y * w + x) * 4)
  return out
}
/** 透明底上一个实心圆（像个徽标）。 */
const logo = (w: number, h: number) =>
  pixels(w, h, (x, y) =>
    (x - w / 2) ** 2 + (y - h / 2) ** 2 < (Math.min(w, h) / 3) ** 2 ? [214, 165, 72, 255] : [0, 0, 0, 0],
  )

describe('读格式与宽高', () => {
  it('PNG 能解像素；JPEG、GIF、WebP、ICO、SVG 读宽高', async () => {
    const png = await encodePng(40, 40, logo(40, 40))
    const p = decodePng(png)!
    expect([p.format, p.width, p.height, p.rgba!.length]).toEqual(['png', 40, 40, 6400])
    expect(Array.from(p.rgba!.subarray((20 * 40 + 20) * 4, (20 * 40 + 20) * 4 + 4))).toEqual([214, 165, 72, 255])

    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 120, 0, 200, 3, 0, 0, 0])
    expect(probeImage(jpeg)).toMatchObject({ format: 'jpeg', width: 200, height: 120 })
    const gif = new Uint8Array([71, 73, 70, 56, 57, 97, 64, 0, 48, 0])
    expect(probeImage(gif)).toMatchObject({ format: 'gif', width: 64, height: 48 })
    const webp = new Uint8Array(30)
    webp.set(new TextEncoder().encode('RIFF'), 0)
    webp.set(new TextEncoder().encode('WEBPVP8X'), 8)
    webp.set([127, 0, 0, 63, 0, 0], 24)
    expect(probeImage(webp)).toMatchObject({ format: 'webp', width: 128, height: 64 })
    expect(
      probeImage(new TextEncoder().encode('<svg viewBox="0 0 24 24"><path d="M0 0h24v24z"/></svg>')),
    ).toMatchObject({
      format: 'svg',
      width: 24,
      height: 24,
      empty: false,
    })
  })

  it('ICO：取最大的一帧，嵌 PNG 的连像素一起解', async () => {
    const small = await encodePng(16, 16, logo(16, 16))
    const big = await encodePng(48, 48, logo(48, 48))
    const head = new Uint8Array(6 + 32)
    const v = new DataView(head.buffer)
    v.setUint16(2, 1, true)
    v.setUint16(4, 2, true)
    const entry = (i: number, size: number, bytes: number, offset: number) => {
      head[6 + i * 16] = size
      head[6 + i * 16 + 1] = size
      v.setUint32(6 + i * 16 + 8, bytes, true)
      v.setUint32(6 + i * 16 + 12, offset, true)
    }
    entry(0, 16, small.length, 38)
    entry(1, 48, big.length, 38 + small.length)
    const ico = new Uint8Array([...head, ...small, ...big])
    const p = probeImage(ico)!
    expect([p.format, p.width, p.height, Boolean(p.rgba)]).toEqual(['ico', 48, 48, true])
    expect(assessImage(ico)).toEqual({ ok: true, format: 'ico', width: 48, height: 48 })
  })
})

describe('质量过滤', () => {
  it('好图过；< 32px 丢；Google 的 16px 地球占位丢', async () => {
    expect(assessImage(await encodePng(64, 64, logo(64, 64)))).toEqual({
      ok: true,
      format: 'png',
      width: 64,
      height: 64,
    })
    expect(assessImage(await encodePng(24, 24, logo(24, 24)))).toMatchObject({ ok: false, reason: 'too-small' })
    const globe = await encodePng(16, 16, logo(16, 16))
    expect(assessImage(globe, { url: 'https://www.google.com/s2/favicons?domain=x.cn&sz=64' })).toMatchObject({
      ok: false,
      reason: 'google-placeholder',
    })
  })

  it('宽高比 > 2.2 的横向字标丢；2.2 以内留', async () => {
    expect(assessImage(await encodePng(230, 100, logo(230, 100)))).toMatchObject({ ok: false, reason: 'wordmark' })
    expect(assessImage(await encodePng(220, 100, logo(220, 100))).ok).toBe(true)
    expect(assessImage(new TextEncoder().encode('<svg viewBox="0 0 300 100"><path d="M0 0"/></svg>'))).toMatchObject({
      reason: 'wordmark',
    })
  })

  it('全透明、单色铺满、空 SVG 丢；透明底上的单色图形留', async () => {
    expect(
      assessImage(
        await encodePng(
          64,
          64,
          pixels(64, 64, () => [0, 0, 0, 0]),
        ),
      ),
    ).toMatchObject({ reason: 'blank' })
    expect(
      assessImage(
        await encodePng(
          64,
          64,
          pixels(64, 64, () => [250, 250, 250, 255]),
        ),
      ),
    ).toMatchObject({
      reason: 'flat',
    })
    expect(assessImage(new TextEncoder().encode('<svg viewBox="0 0 64 64"><g/></svg>'))).toMatchObject({
      reason: 'blank',
    })
    expect(blankness(logo(64, 64))).toBeUndefined()
    expect(assessImage(new TextEncoder().encode('not an image'))).toMatchObject({ ok: false, reason: 'unreadable' })
  })
})
