// SPDX-License-Identifier: MIT
// 设计系统包的封面（components/Cover/preview.html）：规矩见 design-pipeline `design-system-package.md` 的 Cover 一节（2026-11-14 读）。
// 一个固定 960px 的版面：左下是名字与一行说明，右边（x ≥ 480）是三到五块取自色板的色块与一种从自己刻度里来的纹理。
// 色块与纹理的每个尺寸都取自 token（space-8 = 32px、space-2 = 8px 的倍数），颜色全是 token，没有渐变与动画。

export function renderCover({ name, tagline }) {
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cover</title></head>
<body style="margin:0;width:960px;background:var(--bg-100)">
<!--
封面的推导（每个尺寸取自 tokens.json 的刻度：space-2 = 8px，space-4 = 16px，space-8 = 32px）：
- 大块：signal-orange，352 x 224（space-8 的 11 x 7 格）。这是认出这套系统的颜色：焦点、选中、LED。
- 小块：ink-100，160 x 32（5 x 1 格），数据层的亮色，压在橙块下沿。
- 一对小块：pnl-up 与 pnl-down，各 64 x 64（2 x 2 格），并排：量化界面独有的涨跌一对，两块都小，状态色不抢主色。
- 底块：bg-400，352 x 96（11 x 3 格），上面铺纹理。
- 纹理：点阵（点阵标签 Doto 的来历），间距 space-2 = 8px，点半径 2px，颜色 line-200，只铺在底块里。一个主角，一种纹理。
- 圆角与描边：全部直角，无描边（radius-panel = 0）。
- 名字用 display 字体，说明用 body；两行都在 x = 32 的左下角，宽度不超过 440px。
-->
<svg width="960" height="540" viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
<defs>
<pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="var(--line-200)"/></pattern>
</defs>
<rect x="0" y="0" width="960" height="540" fill="var(--bg-100)"/>
<rect x="512" y="64" width="352" height="224" fill="var(--signal-orange)"/>
<rect x="512" y="256" width="160" height="32" fill="var(--ink-100)"/>
<rect x="800" y="288" width="64" height="64" fill="var(--pnl-up)"/>
<rect x="736" y="288" width="64" height="64" fill="var(--pnl-down)"/>
<rect x="512" y="352" width="352" height="96" fill="var(--bg-400)"/>
<rect x="512" y="352" width="352" height="96" fill="url(#dots)"/>
<text x="32" y="448" style="font:700 64px/1 var(--font-display)" fill="var(--ink-100)">${name}</text>
<text x="32" y="488" style="font:var(--text-body) var(--font-sans)" fill="var(--ink-200)">${tagline}</text>
</svg>
</body>
</html>
`
}
