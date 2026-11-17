// SPDX-License-Identifier: MIT
// 模式页的目录与页面（照 Salt 的 Patterns）。patterns/ 下每个 <id>.tsx 默认导出一个 Pattern，这里自动收集，按标题排序。
import type { SideNavGroup } from '../../src/index'
import { GROUP_ICONS } from '../nav-icons'
import { PAGES } from '../registry'
import type { Pattern } from './types'

const files = import.meta.glob(['./*.tsx', '!./index.tsx'], { eager: true, import: 'default' }) as Record<
  string,
  Pattern
>
export const PATTERNS: readonly Pattern[] = Object.values(files).sort((a, b) => a.title.localeCompare(b.title, 'zh'))
export const patternById = (id: string) => PATTERNS.find((pattern) => pattern.id === id)

const Icon = GROUP_ICONS.patterns!
export const PATTERN_GROUPS: readonly SideNavGroup[] = PATTERNS.length
  ? [
      {
        id: 'patterns',
        title: '模式',
        icon: <Icon aria-hidden />,
        items: PATTERNS.map((pattern) => ({
          id: pattern.id,
          label: pattern.title,
          href: `#/${pattern.id}`,
          keywords: `${pattern.id} ${pattern.summary}`,
        })),
      },
    ]
  : []

const pageTitle = (id: string) => PAGES.find((page) => page.id === id)?.title.split(' ')[0] ?? id

function List({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul className="gal-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function PatternPage({ pattern }: { pattern: Pattern }) {
  const { Demo } = pattern
  return (
    <article className="gal-doc" data-page={pattern.id}>
      <header className="gal-doc-head">
        <h1>{pattern.title}</h1>
        <p>{pattern.summary}</p>
        {pattern.source ? (
          <dl className="gal-doc-meta">
            <div>
              <dt>照</dt>
              <dd>
                <a href={pattern.source.href} target="_blank" rel="noreferrer">
                  {pattern.source.label}
                </a>
              </dd>
            </div>
          </dl>
        ) : null}
      </header>
      <section className="gal-preview" data-gallery={pattern.id} aria-label="示例">
        <Demo />
      </section>
      <List title="什么时候用" items={pattern.use} />
      <List title="什么时候别用" items={pattern.avoid} />
      <section>
        <h2>用到的件</h2>
        <table className="gal-fd-table">
          <tbody>
            {pattern.parts.map((part) => (
              <tr key={part.page}>
                <td>
                  <a href={`#/${part.page}`}>{pageTitle(part.page)}</a>
                </td>
                <td className="gal-fd-usage">{part.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <List title="怎么拼" items={pattern.rules} />
    </article>
  )
}
