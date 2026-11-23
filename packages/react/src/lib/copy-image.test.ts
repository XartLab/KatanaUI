// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  familyNames,
  fontFaceCss,
  fontUrlOf,
  parseUnicodeRange,
  pickFontFaces,
  rangeCoversText,
  type FontFaceSource,
} from './copy-image.ts'

// 复制图时内嵌网页字体（#87 补充第 7 条）：只嵌图里用到的族、unicode-range 碰到图里文字的那几片。

const face = (family: string, unicodeRange = '', src = 'url("/fonts/a.woff2") format("woff2")'): FontFaceSource => ({
  family,
  src,
  unicodeRange,
  weight: '400',
  style: 'normal',
  stretch: '',
  base: 'https://example.test/assets/fonts.css',
})

describe('字体内嵌的纯函数', () => {
  it('familyNames：拆逗号、去引号、小写', () => {
    expect(familyNames(`"DM Mono", 'Barlow', ui-monospace`)).toEqual(['dm mono', 'barlow', 'ui-monospace'])
  })

  it('parseUnicodeRange：单点、区间、通配；空串是全部', () => {
    expect(parseUnicodeRange('U+0-FF, U+20AC, U+4??')).toEqual([
      [0, 0xff],
      [0x20ac, 0x20ac],
      [0x400, 0x4ff],
    ])
    expect(parseUnicodeRange('')).toEqual([[0, 0x10ffff]])
  })

  it('rangeCoversText：有一个字落进区间就算', () => {
    expect(rangeCoversText(parseUnicodeRange('U+4E00-4FFF'), 'BTC 一')).toBe(true)
    expect(rangeCoversText(parseUnicodeRange('U+4E00-4FFF'), 'BTC 63971')).toBe(false)
  })

  it('fontUrlOf：有 woff2 先取 woff2，local() 不算', () => {
    expect(fontUrlOf(`local("Barlow"), url(a.woff) format("woff"), url('b.woff2') format('woff2')`)).toBe('b.woff2')
    expect(fontUrlOf('url(/fonts/c.ttf)')).toBe('/fonts/c.ttf')
    expect(fontUrlOf('local(Barlow)')).toBeNull()
  })

  it('pickFontFaces：只留用到的族、碰到图里文字的切片', () => {
    const faces = [face('Barlow'), face('Doto'), face('Ark Pixel', 'U+4E00-4FFF'), face('Ark Pixel', 'U+5000-5FFF')]
    const picked = pickFontFaces(faces, new Set(['barlow', 'ark pixel']), 'BTC 一')
    expect(picked.map((entry) => [entry.family, entry.unicodeRange])).toEqual([
      ['Barlow', ''],
      ['Ark Pixel', 'U+4E00-4FFF'],
    ])
  })

  it('fontFaceCss：照原描述写，src 换成给的地址', () => {
    expect(fontFaceCss(face('Barlow', 'U+0-FF'), 'data:font/woff2;base64,AA')).toBe(
      '@font-face{font-family:"Barlow";src:url("data:font/woff2;base64,AA");font-weight:400;font-style:normal;unicode-range:U+0-FF}',
    )
  })
})
