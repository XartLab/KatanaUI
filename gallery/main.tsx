// SPDX-License-Identifier: AGPL-3.0-only
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './gallery.css'
import '../src/ui.css'
import { Gallery } from './gallery'

// 展示页的入口（开发服务器的 /ui-gallery.html，测试台也给；正式构建里没有）。
// ?theme=console 或 ?theme=graphite：只摆这一个主题。不带参数：左右并排两个主题（各一个 iframe，主题是根节点上的 data-theme，同一页放不下两套）。

const THEMES = ['console', 'graphite'] as const
const theme = new URLSearchParams(location.search).get('theme')
const root = document.getElementById('root')
if (!root) throw new Error('展示页缺少 #root')

if (theme === 'console' || theme === 'graphite') {
  document.documentElement.dataset.theme = theme
  createRoot(root).render(
    <StrictMode>
      <Gallery theme={theme} />
    </StrictMode>,
  )
} else {
  createRoot(root).render(
    <StrictMode>
      <div className="gal-split">
        {THEMES.map((name) => (
          <iframe key={name} title={name} src={`?theme=${name}`} />
        ))}
      </div>
    </StrictMode>,
  )
}
