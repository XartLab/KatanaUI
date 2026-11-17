// SPDX-License-Identifier: MIT
// 视觉回归（pixelgate，自研、MIT、本地跑）的共用部分：主配置与高清配置都从这里取，免得两份各写一遍。
// 用法与取舍写在文档站「开发接入 → 视觉回归」一节；这里只留代码里该有的「为什么」。
import type { Config, PageSnap } from 'pixelgate-cli'
import { PAGES } from './gallery/registry.ts'

export type ThemeId = 'graphite' | 'console'

/** 固定时钟：文档站里「更新于 xx」「刚刚」这类读 Date.now() 的文字不随运行时间变。 */
const FIXED_TIME = '2026-01-01T00:00:00Z'

/**
 * 不进视觉回归的页：页内容靠时间或随机数每帧都在变，截不出稳定的图；每条写原因。
 * 行为（点击、键盘、无障碍）仍由 e2e/ui-gallery*.spec.ts 管，这里只放弃「像素」这一层。
 */
export const EXCLUDED: Readonly<Record<string, string>> = {
  // 下面这些页要么动画由 JS 逐帧驱动（rAF、motion 库的重复动画、canvas 计时，CSS 归零管不到），要么布局随量到尺寸的时机变；
  // 整页都是这个内容，没有「稳定的一块」可以单独遮住，pixelgate 的稳定循环等不到两张相同的帧，或两次运行不一致。
  'agent-avatar': 'JS 驱动的头像呼吸与眼神动画，每帧不同',
  'arcade-pixel': 'canvas 像素街机动画，每帧不同',
  'border-beam': '沿边框跑的光束，rAF 驱动，每帧不同',
  'grid-loader': '点阵加载动画，JS 定时换帧',
  'matrix-orb': 'canvas 矩阵球体持续旋转',
  'motion-loader': '加载动画，motion 库无限重复',
  'ransom-note': '字母随机换样，计时驱动',
  'shine-text': '扫光文字，motion 库无限重复',
  'pixel-flow-field': 'canvas 流场粒子持续运动（rAF），每帧不同',
  'market-heatmap':
    '格子按容器尺寸分块，尺寸量到的时机不同（ResizeObserver）会排出不同的块，两次运行差 0.1% 到 0.5% 的像素；待组件在量到尺寸前不画，再收进来',
  'ai-status': '流光、起伏等循环动画停在哪一帧不固定，两次运行差几十个像素（约 0.007%）',
  'aurora-curtain': '背景极光 canvas，两次运行偶尔差几十个像素（rAF 驱动）',
  'wave-text': '逐字起伏的波浪文字，motion 库无限重复',
}

/** 组件页：只截预览容器 [data-gallery="<页 id>"]，不带侧栏与顶栏，别处改了不会让所有页一起红。 */
export const componentPages = (theme: ThemeId, ids: readonly string[] = PAGES.map((page) => page.id)): PageSnap[] =>
  ids
    .filter((id) => !(id in EXCLUDED))
    .map((id) => ({
      // 主题进名字：pixelgate 的页清单对每个 target 都跑一遍，主题只能走各页的 URL 参数。
      name: `${theme}--${id}`,
      url: `/?theme=${theme}#/${id}`,
      selector: `[data-gallery="${id}"]`,
      waitFor: `[data-gallery="${id}"]`,
    }))

/** 文档站外壳与基础页：整页，看侧栏、顶栏、正文版式。 */
export const wholePage = (theme: ThemeId, id: string, name = id, fullPage = false): PageSnap => ({
  name: `${theme}--${name}`,
  url: `/?theme=${theme}#/${id}`,
  waitFor: '.gal-page-body',
  // 外壳默认只截一屏（1440x900）：长页的下半截由各自的预览截图管；要看全页的（字样表）传 fullPage。
  fullPage,
})

export const base = {
  // 先 build 再静态服务：测的就是线上发布的那份产物（与 e2e 一致），不受 dev 服务器的依赖预构建与重载影响。
  vite: { mode: 'preview', configFile: 'pixelgate.vite.config.ts' },
  // 只放行文档站自己的地址：外部字体、图片一律拦掉，免得网络好坏改变图。
  allowedHostnames: [],
  // pixelmatch 逐像素比，threshold 0.1 是 pixelgate 默认；字体抗锯齿若抖动再评估 ssim（结论见文档站）。
  threshold: 0.1,
  stabilize: {
    fixedTime: FIXED_TIME,
    // 无限循环的动画（shimmer、加载环、AI 流光、光标闪烁、ping）pixelgate 已把时长归零；这里再把次数压成 1，免得停在随机相位。
    css: '*, *::before, *::after { animation-iteration-count: 1 !important; caret-color: transparent !important; }',
  },
} satisfies Config
