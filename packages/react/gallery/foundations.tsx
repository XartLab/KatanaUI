// SPDX-License-Identifier: MIT
// 「基础」一组页（照 Salt 文档站的 Foundations：颜色、字体、间距、圆角、阴影、边框、密度、语义特征）。
// 内容全从 @katana-ui/tokens 的 tokens.json 读（名称、各主题的值、用途说明），不手抄：令牌改了，这几页跟着变。
// 预览都用 CSS 变量画，所以切页头的主题就能看到当前主题下的样子；值表把三套主题并排列出。

import type { ReactNode } from 'react'
import tokens from '../src/tokens-json'
import { Button } from '../src/index'
import { MORE_PAGES } from './foundations-more'

type Valued = string | Record<string, string>
type Token = {
  name: string
  value: Valued
  usage?: string
  size?: string
  weight?: string
  line?: string
  source?: string
}
type Group = { note?: string; tokens: Token[] }

const T = tokens as unknown as {
  color: { themes: { id: string; name: string }[]; tokens: Token[] }
  type: {
    families: Record<string, { value: string; role: string; note?: string }>
    scale: { tokens: Token[] }
  }
  spacing: Group
  radius: Group
  shadow: Group
  border: Group
  foundation: Group
  density: Group & { levels: string[]; default: string }
  characteristics: Group
}
const THEMES = T.color.themes

/** 入门、基础、Token 与主题三组页（照 Salt 文档站的目录）；顺序就是目录顺序。 */
export const FOUNDATION_PAGES = [
  { id: 'developing', title: '开发接入', section: 'start' },
  { id: 'styling', title: '样式引入', section: 'start' },
  { id: 'color', title: '颜色', section: 'foundations' },
  { id: 'typography', title: '字体与文字档', section: 'foundations' },
  { id: 'spacing', title: '间距', section: 'foundations' },
  { id: 'size', title: '尺寸', section: 'foundations' },
  { id: 'density', title: '密度', section: 'foundations' },
  { id: 'radius', title: '圆角', section: 'foundations' },
  { id: 'border', title: '边框', section: 'foundations' },
  { id: 'shadow', title: '层级与阴影', section: 'foundations' },
  { id: 'duration', title: '时长与动效', section: 'foundations' },
  { id: 'modes', title: '主题与模式', section: 'foundations' },
  { id: 'responsiveness', title: '响应式', section: 'foundations' },
  { id: 'cursor', title: '光标', section: 'foundations' },
  { id: 'assets', title: '图标与资源', section: 'foundations' },
  { id: 'dataviz', title: '数据可视化', section: 'foundations' },
  { id: 'foundations', title: '三层 token', section: 'tokens' },
  { id: 'characteristics', title: '语义特征', section: 'tokens' },
  { id: 'token-naming', title: 'Token 命名', section: 'tokens' },
  { id: 'theming', title: '主题接入', section: 'tokens' },
] as const
export type FoundationId = (typeof FOUNDATION_PAGES)[number]['id']
export const FOUNDATION_SECTIONS = [
  { id: 'start', title: '入门' },
  { id: 'foundations', title: '基础' },
  { id: 'tokens', title: 'Token 与主题' },
] as const
export const isFoundation = (id: string): id is FoundationId => FOUNDATION_PAGES.some((page) => page.id === id)

/** 值表里的一格：引用写成 {name}，显示成 var(--name)。 */
const show = (value: string) => value.replace(/\{([a-z0-9-]+)\}/g, 'var(--$1)')

function Values({ value }: { value: Valued }) {
  if (typeof value === 'string') return <code>{show(value)}</code>
  const keys = Object.keys(value)
  const themed = keys.every((key) => THEMES.some((theme) => theme.id === key))
  return (
    <dl className="gal-fd-values">
      {(themed ? THEMES.map((theme) => theme.id) : keys).map((key) => (
        <div key={key}>
          <dt>{THEMES.find((theme) => theme.id === key)?.name ?? key}</dt>
          <dd>
            <code>{show(value[key] ?? '—')}</code>
          </dd>
        </div>
      ))}
    </dl>
  )
}

function TokenTable({ rows, preview }: { rows: readonly Token[]; preview: (token: Token) => ReactNode }) {
  return (
    <table className="gal-fd-table">
      <thead>
        <tr>
          <th>预览</th>
          <th>名称</th>
          <th>值</th>
          <th>用途</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((token) => (
          <tr key={token.name}>
            <td className="gal-fd-preview">{preview(token)}</td>
            <td>
              <code>--{token.name}</code>
            </td>
            <td>
              <Values value={token.value} />
            </td>
            <td className="gal-fd-usage">{token.usage}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const Note = ({ text }: { text?: string }) => (text ? <p className="gal-lede">{text}</p> : null)
const swatch = (name: string) => <span className="gal-fd-swatch" style={{ background: `var(--${name})` }} />

/** 颜色按名字前缀分组（bg、ink、line、signal…），每组一张表。 */
function ColorPage() {
  const groups = new Map<string, Token[]>()
  for (const token of T.color.tokens) {
    const key = token.name.replace(/-[0-9a-z]+$/, '').replace(/-\d+$/, '')
    groups.set(key, [...(groups.get(key) ?? []), token])
  }
  return (
    <>
      <p className="gal-lede">
        调色层（palette）：Console、Graphite、Paper
        三套主题各一份值。组件不直接读这一层，读「语义特征」；预览按页头当前的主题画。
      </p>
      {[...groups].map(([key, rows]) => (
        <section key={key}>
          <h2>{key}</h2>
          <TokenTable rows={rows} preview={(token) => swatch(token.name)} />
        </section>
      ))}
    </>
  )
}

function TypographyPage() {
  return (
    <>
      <p className="gal-lede">
        字族按角色分；文字档是 font 简写的前三项（字重 字号/行高），组件写{' '}
        <code>font: var(--text-档) var(--font-角色)</code>
        。字重补偿、字号缩放、平滑与像素对齐见总览里的 <a href="#/rendering">rendering</a> 页。
      </p>
      <h2>字族</h2>
      <table className="gal-fd-table">
        <thead>
          <tr>
            <th>示例</th>
            <th>token</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(T.type.families).map(([name, family]) => (
            <tr key={name}>
              <td className="gal-fd-preview">
                <span className="k-fd-sample" style={{ fontFamily: `var(--font-${name})` }}>
                  Aa 0123 示例
                </span>
              </td>
              <td>
                <code>--font-{name}</code>
                <code className="k-fd-stack" title={family.value}>
                  {family.value}
                </code>
              </td>
              <td className="gal-fd-usage">
                {family.role}
                {family.note ? ` ${family.note}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>文字档</h2>
      <TokenTable
        rows={T.type.scale.tokens.map((token) => ({
          ...token,
          value: `${token.weight} ${token.size}/${token.line}`,
          usage: [token.usage, token.source ? `出处：${token.source}` : ''].filter(Boolean).join(' '),
          name: `text-${token.name}`,
        }))}
        preview={(token) => <span style={{ font: `var(--${token.name}) var(--font-sans)` }}>1,234.56 示例</span>}
      />
    </>
  )
}

function DensityPage() {
  return (
    <>
      <Note text={T.density.note} />
      <h2>三档对比</h2>
      <div className="gal-fd-density">
        {T.density.levels.map((level) => (
          <div key={level} data-density={level}>
            <span>
              {level}
              {level === T.density.default ? '（默认）' : ''}
            </span>
            <Button>下单</Button>
            <Button variant="ghost">取消</Button>
          </div>
        ))}
      </div>
      <TokenTable
        rows={T.density.tokens}
        preview={(token) =>
          token.name.includes('size') ? (
            <span className="gal-fd-bar" style={{ height: `var(--${token.name})`, width: 6 }} />
          ) : (
            <span className="gal-fd-bar" style={{ width: `var(--${token.name})` }} />
          )
        }
      />
    </>
  )
}

function CharacteristicsPage() {
  const colorish = (name: string) => /background|foreground|Color/.test(name)
  return (
    <>
      <p className="gal-lede">
        语义特征层（照 Salt 的
        characteristics）：按「这是什么」命名——actionable（可点的）、content（文字）、separable（分隔线）、container（容器）、focused（焦点环）——值引用调色层。组件只该读这一层与密度变量，换主题只改调色层。
      </p>
      <TokenTable
        rows={T.characteristics.tokens}
        preview={(token) => (colorish(token.name) ? swatch(token.name) : <code>{token.name.split('-').at(-1)}</code>)}
      />
    </>
  )
}

function OverviewPage() {
  const layers: [string, string, string, number][] = [
    ['Foundation', '与主题无关的原值（纯白等）', 'foundation', T.foundation.tokens.length],
    ['Palette（调色）', '每套主题一份值：底色、文字灰阶、线、信号色、色阶', 'color', T.color.tokens.length],
    [
      'Characteristics（语义特征）',
      '按用途命名，引用调色层；组件读这一层',
      'characteristics',
      T.characteristics.tokens.length,
    ],
    ['Density（密度）', '高度与内距三档，data-density 写在任意容器上往下继承', 'density', T.density.tokens.length],
  ]
  return (
    <>
      <p className="gal-lede">
        照 J.P. Morgan 的 Salt Design System（salt-ds，Apache-2.0）分层与命名；只学结构，样子以工作台现有样式为准。源在
        @katana-ui/tokens 的 tokens.json，生成 tokens.css。这一组页面全从 tokens.json 读。
      </p>
      <table className="gal-fd-table">
        <thead>
          <tr>
            <th>层</th>
            <th>放什么</th>
            <th>个数</th>
          </tr>
        </thead>
        <tbody>
          {layers.map(([name, what, id, count]) => (
            <tr key={id}>
              <td>
                <a href={`#/${id}`}>{name}</a>
              </td>
              <td className="gal-fd-usage">{what}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note text={T.foundation.note} />
    </>
  )
}

export function FoundationPage({ id }: { id: FoundationId }) {
  const title = FOUNDATION_PAGES.find((page) => page.id === id)!.title
  const more = MORE_PAGES[id as keyof typeof MORE_PAGES]
  const body = (() => {
    if (more) return <more.Body />
    switch (id) {
      case 'foundations':
        return <OverviewPage />
      case 'color':
        return <ColorPage />
      case 'typography':
        return <TypographyPage />
      case 'density':
        return <DensityPage />
      case 'characteristics':
        return <CharacteristicsPage />
      case 'spacing':
        return (
          <>
            <Note text={T.spacing.note} />
            <TokenTable
              rows={T.spacing.tokens}
              preview={(t) => <span className="gal-fd-bar" style={{ width: `var(--${t.name})` }} />}
            />
          </>
        )
      case 'radius':
        return (
          <>
            <Note text={T.radius.note} />
            <TokenTable
              rows={T.radius.tokens}
              preview={(t) => <span className="gal-fd-box" style={{ borderRadius: `var(--${t.name})` }} />}
            />
          </>
        )
      case 'shadow':
        return (
          <>
            <Note text={T.shadow.note} />
            <TokenTable
              rows={T.shadow.tokens}
              preview={(t) =>
                /hatch|hazard|scanline/.test(t.name) ? (
                  <span className="gal-fd-box" style={{ background: `var(--${t.name})` }} />
                ) : /blur/.test(t.name) ? (
                  <code>{t.name}</code>
                ) : (
                  <span className="gal-fd-box" style={{ boxShadow: `var(--${t.name})` }} />
                )
              }
            />
          </>
        )
      case 'border':
        return (
          <>
            <Note text={T.border.note} />
            <TokenTable
              rows={T.border.tokens}
              preview={(t) => <span className="gal-fd-box" style={{ border: `var(--${t.name})` }} />}
            />
          </>
        )
    }
  })()
  return (
    <article className="gal-fd">
      <h1>{title}</h1>
      {body}
    </article>
  )
}
