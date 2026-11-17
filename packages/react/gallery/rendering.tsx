// SPDX-License-Identifier: MIT
// 「渲染」页 `#/rendering`：RenderingSettings 加一张字样表。设置写在根节点上，切到别的组件页也生效；文档站把它存在 localStorage（只为方便对比）。
// 字样表照字体测试的做法：每个文字档一行，同一行里放最容易糊、最容易认错的字（0O 1lI、负号、千分位、百分比、中英混排），暗底几档灰，再加 1px 线与格子。

import { useEffect, useMemo, useState } from 'react'
import {
  FONT_CATALOG,
  RenderingSettings,
  applyRendering,
  readRendering,
  type RenderingSettingsValue,
} from '../src/index'

export const RENDERING_ID = 'rendering'
const STORE = 'katana-ui.rendering'

/** 文档站启动时调：把上次存的设置写回根节点。 */
export function restoreRendering() {
  try {
    const raw = localStorage.getItem(STORE)
    if (raw)
      applyRendering({
        ...readRendering(),
        ...(JSON.parse(raw) as Partial<RenderingSettingsValue>),
      })
  } catch {
    // 存储不可用就用默认值。
  }
}

const RAMP: readonly { token: string; px: number; family: 'small' | 'text' }[] = [
  { token: 'tag', px: 9, family: 'small' },
  { token: 'micro', px: 10, family: 'small' },
  { token: 'num-sm', px: 10, family: 'small' },
  { token: 'caption', px: 11, family: 'small' },
  { token: 'data', px: 12, family: 'text' },
  { token: 'body', px: 13, family: 'text' },
  { token: 'title', px: 15, family: 'text' },
  { token: 'lcd', px: 16, family: 'text' },
]
const SAMPLE = 'BTCUSDT 0O 1lI −0.87% +12.40% 1,234,567.89 示例银行 涨停封板 Bid/Ask'
const INKS = ['--ink-100', '--ink-200', '--ink-300', '--ink-400'] as const

/** 某个本地字体在不在：跟回退字体比宽度（document.fonts.check 对系统字体总是 true，不能用）。 */
function hasFont(name: string) {
  const canvas = document.createElement('canvas').getContext('2d')
  if (!canvas) return false
  const text = 'mmmmmmmmmmlli 0123456789 示例'
  return ['monospace', 'serif'].some((base) => {
    canvas.font = `16px ${base}`
    const plain = canvas.measureText(text).width
    canvas.font = `16px "${name}", ${base}`
    return canvas.measureText(text).width !== plain
  })
}
const PROBES = [
  'Segoe UI Variable Small',
  'Segoe UI Variable Text',
  'Segoe UI Variable Display',
  'Segoe UI',
  'Microsoft YaHei UI',
  'PingFang SC',
  'Noto Sans SC',
] as const

export function RenderingPage() {
  const [value, setValue] = useState(readRendering)
  const fonts = useMemo(() => PROBES.map((name) => [name, hasFont(name)] as const), [])
  const [dpr, setDpr] = useState(() => window.devicePixelRatio)
  useEffect(() => {
    const media = matchMedia(`(resolution: ${dpr}dppx)`)
    const update = () => setDpr(window.devicePixelRatio)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [dpr])

  const change = (next: RenderingSettingsValue) => {
    setValue(next)
    applyRendering(next)
    try {
      localStorage.setItem(STORE, JSON.stringify(next))
    } catch {
      // 不存也能用。
    }
  }

  return (
    <article className="gal-render-page">
      <h1>渲染设置</h1>
      <p className="gal-lede">
        改这里会写到页面根节点上，切到任何组件页都生效；应用里放在「设置 →
        渲染」。字样表放的是最容易糊、最容易认错的字，在你自己的屏幕上对比着调。
      </p>
      <RenderingSettings value={value} onChange={change} />

      <h2>本机</h2>
      <dl className="gal-render-env">
        <dt>设备像素比</dt>
        <dd>
          {dpr}
          {Number.isInteger(dpr) ? '' : '（非整数缩放：1px 线与小字最容易糊，像素对齐最有用）'}
        </dd>
        {fonts.map(([name, ok]) => (
          <div key={name} className="gal-render-envrow">
            <dt>{name}</dt>
            <dd data-ok={ok ? '' : undefined}>{ok ? '有' : '没有（回退到下一个字体）'}</dd>
          </div>
        ))}
      </dl>

      <h2>字体库</h2>
      <p className="gal-lede">
        设置里能选的全部字体，每个用它自己画同一行字。「开源」打包在文档站里；「本机」要你电脑上装了才显示，没装的那一行会落到回退字体。
      </p>
      <table className="gal-render-ramp gal-render-fonts">
        <tbody>
          {FONT_CATALOG.filter((font) => font.kind !== 'system').map((font) => (
            <tr key={font.id}>
              <th>
                {font.label}
                <br />
                <span>
                  {font.roles.join(' / ')} · {font.kind === 'web' ? `开源 ${font.license ?? ''}` : '本机'}
                </span>
              </th>
              <td style={{ fontFamily: `${font.family}, var(--font-sans)`, fontSize: 14, fontWeight: 400 }}>
                {SAMPLE}
                {font.note ? <small>{font.note}</small> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>文字档</h2>
      <table className="gal-render-ramp">
        <tbody>
          {RAMP.map((row) => (
            <tr key={row.token}>
              <th>
                {row.token} · {row.px}px · {row.family === 'small' ? 'Small' : 'Text'}
              </th>
              <td
                style={{
                  font: `var(--text-${row.token}) var(${row.family === 'small' ? '--font-sans-small' : '--font-sans'})`,
                }}
              >
                {SAMPLE}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>暗底灰阶（12px）</h2>
      <div className="gal-render-inks">
        {(['--bg-000', '--bg-200'] as const).map((bg) => (
          <div key={bg} style={{ background: `var(${bg})` }}>
            {INKS.map((ink) => (
              <p
                key={ink}
                style={{
                  color: `var(${ink})`,
                  font: 'var(--text-data) var(--font-sans)',
                }}
              >
                {ink.slice(2)} on {bg.slice(2)} · {SAMPLE}
              </p>
            ))}
          </div>
        ))}
      </div>

      <h2>线与格子</h2>
      <div className="k-ck gal-render-lines">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
          {[20, 40.5, 60.3, 80.7, 100].map((y) => (
            <line key={y} className="k-ck-grid" x1="0" x2="1000" y1={y} y2={y} />
          ))}
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={i * 25 + 3.3} y={110 - ((i * 37) % 80)} width="19.4" height={(i * 37) % 80} />
          ))}
        </svg>
      </div>
    </article>
  )
}

/** 组件页的演示：同一个件，值也写到根节点上（跟 rendering 页同一份设置）。 */
export function RenderingSettingsDemo() {
  const [value, setValue] = useState(readRendering)
  return (
    <RenderingSettings
      value={value}
      onChange={(next) => {
        setValue(next)
        applyRendering(next)
      }}
    />
  )
}
