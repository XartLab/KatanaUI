// SPDX-License-Identifier: MIT
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './gallery.css'
import '../src/fonts.css'
import '../src/ui.css'
import { applyTheme, Docs, themeFromUrl, type ThemeName } from './docs'

// 文档站的入口（开发服务器的 /ui-gallery.html，测试台也给；正式构建里没有）。
// 主题默认 Console；?theme=graphite 直接以 Graphite 打开，页头的切换也会改它。根节点的 data-theme 在渲染前就写好，不闪一下别的主题。

const root = document.getElementById('root')
if (!root) throw new Error('展示页缺少 #root')
document.documentElement.dataset.theme = themeFromUrl()

function App() {
  const [theme, setTheme] = useState<ThemeName>(themeFromUrl)
  return (
    <Docs
      theme={theme}
      onTheme={(next) => {
        setTheme(next)
        applyTheme(next)
      }}
    />
  )
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
