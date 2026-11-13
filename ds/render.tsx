// SPDX-License-Identifier: MIT
import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { InlineOverlays } from '../src/index'
import { DEMOS, OPEN_DEMOS } from '../gallery/demos'
import { GROUPS, PAGES, type DocPage, type PropTable } from '../gallery/registry'

// 设计系统包（packages/ui/design-system/）每个件的说明与静态预览：全部读文档站的页数据（gallery/registry.ts 的 PAGES）与页上的预览（gallery/demos.tsx 的 DEMOS），
// 这里不再另写一份。ds-build.mjs 经 vite 的 ssrLoadModule 载入本文件。预览是 react-dom/server 把页上的实时预览渲染成静态 HTML：
// 状态靠属性摆，悬停、按下、焦点这些瞬时状态不静态摆，在 e2e/ui-gallery.spec.ts 里用真浏览器量；弹层（Portal）服务端不渲染，浮层类的页只摆触发器。

export const pages: readonly DocPage[] = PAGES

/** 页 id（短横线小写）→ 设计系统包里的文件夹名（大驼峰）：button → Button，multi-select → MultiSelect。 */
export const folderName = (id: string): string =>
  id
    .split('-')
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join('')

/** 预览卡的分组（@dsCard group）：文档站的分组 id 大驼峰。 */
export const cardGroup = (page: DocPage): string => {
  const group = GROUPS.find((item) => item.id === page.group)
  if (!group) throw new Error(`${page.id} 的分组 ${page.group} 不在 GROUPS 里`)
  return folderName(group.id)
}

const list = (items: readonly string[]): string => items.map((item) => `- ${item}`).join('\n')

const propsMarkdown = (table: PropTable): string => {
  const head = `### ${table.part}\n${table.note ? `\n${table.note}\n` : ''}`
  if (table.rows.length === 0) return head
  const rows = table.rows.map(
    (row) =>
      `| \`${row.name}\` | \`${row.type.replaceAll('|', '\\|')}\` | ${row.default ? `\`${row.default}\`` : '—'} | ${row.desc} |`,
  )
  return `${head}\n| 属性 | 类型 | 默认 | 说明 |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n`
}

/** 一个件的 README：标题、一句说明、属性（调用方要给什么）、组成、键盘。 */
export function componentReadme(page: DocPage): string {
  const keys = page.keys.length
    ? `\n## Keyboard\n\n${page.keys.map(([key, what]) => `- \`${key}\`：${what}`).join('\n')}\n`
    : ''
  return `# ${folderName(page.id)}

${page.summary}

## Provide

${page.props.map(propsMarkdown).join('\n')}
## States

${list(page.states)}

## Don't

${list(page.donts)}

## Composition

\`\`\`
${page.composition}
\`\`\`
${keys}`
}

const bodyStyle = [
  'margin:0',
  'padding:var(--space-4)',
  'background:var(--bg-100)',
  'color:var(--ink-200)',
  'font:var(--text-body) var(--font-sans)',
  'display:flex',
  'flex-direction:column',
  'gap:var(--space-3)',
].join(';')

/** 浮层的「打开的样子」：内容不进 Portal，原地渲染在 .ds-open 里（版面类在 gallery/preview.css）。 */
function OpenSection({ open: { Demo, height } }: { open: { Demo: ComponentType; height: number } }) {
  return (
    <InlineOverlays>
      <div className="ds-open" style={{ minHeight: height }}>
        <Demo />
      </div>
    </InlineOverlays>
  )
}

/** 一个件的预览页（不含第 1、2 行的标记与许可证头，由 ds-build.mjs 加）。 */
export function renderPreviewBody(page: DocPage): string {
  const Demo = DEMOS[page.id]
  const open = OPEN_DEMOS[page.id]
  if (!Demo) throw new Error(`${page.id} 没有预览（gallery/demos.tsx）`)
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${folderName(page.id)}</title></head>`,
    `<body style="${bodyStyle}">`,
    renderToStaticMarkup(<Demo />),
    open ? renderToStaticMarkup(<OpenSection open={open} />) : '',
    '</body>',
    '</html>',
    '',
  ].join('\n')
}
