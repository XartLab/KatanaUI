// SPDX-License-Identifier: MIT
// 动效组里「过场、背景、特效、媒体」的「怎么用 / 无障碍」；aliases 里写 SmoothUI 原件名，方便从原件名搜到。
import type { GuidanceMap } from './types'

const motionFx: GuidanceMap = {
  'shader-reveal': {
    aliases: [
      'shader-reveal-transition',
      'shader-reveal-noise-transition',
      'shader-reveal-zoom-transition',
      'shader-reveal-circle-transition',
      'shader-reveal-wipe-transition',
      'shader-reveal-luma-transition',
      'shader-reveal-planetary-transition',
      'shader-reveal-stripes-transition',
      'shader-reveal-push-transition',
      'Page transition',
      'View transition',
    ],
    use: [
      '整块视图换内容（持仓、订单、成交）时盖一下，让人看出「换了」。',
      '要某个原件的样子，给 variant 填它的名字；八种共用一个引擎。',
      '颜色默认取强调橙、蓝、琥珀、绿，换主题自动跟；要自己的色，传 colors。',
    ],
    avoid: [
      '表格行与价格的刷新不用它（用 LiveFlash 与 ReadoutFlash）。',
      '一屏不要放多个过场件：每个占一个 WebGL 上下文。',
    ],
    a11y: [
      '画布是 aria-hidden，不抢焦点，不挡指针。',
      '过半时才换内容：读屏用户拿到的是换好后的内容，不会读到旧的。',
      '没有跟随系统的「减少动态效果」（产品底线）；WebGL 不可用时退回淡入淡出。',
    ],
  },
  'sdf-blob-transition': {
    aliases: [
      'sdf-blob-transition',
      'sdf-circle-transition',
      'warped-circle-transition',
      'organic-merge-transition',
      'radial-circles-transition',
    ],
    use: [
      '首页、引导页的整页切换：形状从中间长开。',
      '五种形状（circle、warped、merge、radial、final）对应原件的五个名字。',
    ],
    avoid: ['盘中视图切换用更克制的 ShaderReveal 的 wipe。'],
    a11y: ['画布 aria-hidden，不挡指针。', '过半换内容，读屏拿到的是新内容。'],
  },
  'aperture-blur-transition': {
    aliases: ['aperture-blur-transition'],
    use: ['对话框式的整块内容换页：最短的一个，0.76 秒。'],
    avoid: ['不要在行情区用。'],
    a11y: ['画布 aria-hidden，不挡指针。', '过半换内容。'],
  },
  'chroma-blur-transition': {
    aliases: ['chroma-blur-transition'],
    use: ['整页或整块视图的切换：更柔更慢，1 秒出头。'],
    avoid: ['不要在行情区用。'],
    a11y: ['画布 aria-hidden，不挡指针。', '过半换内容。'],
  },
  'aurora-curtain': {
    aliases: ['aurora-curtain', 'Aurora background', 'Northern lights'],
    use: [
      '工作台的空状态、登录页、加载页的底：给空白一点氛围。',
      '内容放 children，永远在光带上面；对比不够就给内容加底色。',
      '颜色默认取绿、蓝、强调色；换主题自动跟。',
    ],
    avoid: ['不要拿它承载数据或状态（状态用 Led、Badge）。', '一屏不要放多个。'],
    a11y: [
      '整层 aria-hidden，不进读屏。',
      '屏外与标签页隐藏时停；paused 让它停在当前帧。',
      '没有跟随系统的「减少动态效果」（产品底线）。',
    ],
  },
  'gravity-stars': {
    aliases: ['gravity-stars', 'Starfield', 'Particle background'],
    use: ['文档站首页、未连接的占位页的底。', '指针即引力井：不需要额外控件。'],
    avoid: ['不要放进行情区：连线会被读成关联。', 'count 别开太高再放多个。'],
    a11y: ['整层 aria-hidden。', '屏外与标签页隐藏时停；paused 定格。', '没有精细指针（触屏）时只有漂移，没有引力。'],
  },
  'liquid-metal': {
    aliases: ['liquid-metal', 'Chrome text', 'Metallic surface'],
    use: ['会员、高级功能的徽标与标题：maskText 把材质裁进字形。', '四种材质：chrome、gold、mercury、oil。'],
    avoid: ['maskText 的字不当唯一信息：字形里是渐变，对比不稳。', '行情区不用。'],
    a11y: ['画布层 aria-hidden；maskText 时字仍是真文字，读屏照读。', '屏外停；paused 定格。'],
  },
  orb: {
    aliases: ['orb', 'Gradient orb', 'AI orb', 'Shader orb'],
    use: ['AI 思考中、连接中的占位：配一行文字说明状态。', '要听与想的状态（待命、聆听、思考）用 MatrixOrb。'],
    avoid: ['不要拿颜色表达数据。'],
    a11y: ['画布 aria-hidden：状态必须用文字另外说。', '约 60 帧封顶，离开屏幕就停。'],
  },
  'pixel-flow-field': {
    aliases: ['pixel-flow-field', 'Pixel text', 'Dot matrix background'],
    use: [
      '连接中、加载中的占位页：一个词（text）或一张图（src）化成会流动的像素。',
      '点「重播」同款的 scatter 加一，字炸开再聚拢。',
    ],
    avoid: ['不要用它显示要读的字：画布里的字读不到也复制不了。'],
    a11y: ['整层 aria-hidden：词本身要在页面上另有真文字。', '屏外停；paused 定格。'],
  },
  'border-beam': {
    aliases: ['border-beam', 'Magic border', 'Animated border', 'Shine border'],
    use: [
      '「等你处理」的卡片：AI 建议待审批、风控告警未确认；处理完设 active=false。',
      '圆角要跟卡片一致：radius 传像素，或 squircle。',
    ],
    avoid: ['不要同时让多张卡在跑。', '不要用它代替状态文字。'],
    a11y: ['SVG aria-hidden，不挡指针；光束不传达信息，信息要写在内容里。'],
  },
  'cursor-image-trail': {
    aliases: ['cursor-image-trail', 'Image trail', 'Mouse trail'],
    use: ['首页、作品集式的页面：指针经过留一串图。'],
    avoid: ['不要放进有操作的区域。', '不进盯盘界面。'],
    a11y: ['图层 aria-hidden，不挡指针；只在有精细指针的设备上启用。', '每张图的 alt 仍必填（类型要求）。'],
  },
  'drawing-cursor': {
    aliases: ['drawing-cursor', 'Cursor drawing', 'Scribble'],
    use: ['在图表截图上圈一下给同事看：decay=0 时笔迹留着，ref.clear() 清掉。', 'ref.toDataURL() 取走画布。'],
    avoid: ['不是正式的绘图工具：没有撤销与图层。', '不要盖在可点击的图表上。'],
    a11y: ['画布 aria-hidden，不挡指针；只在有精细指针的设备上启用，触屏与键盘没有对应操作。'],
  },
  'emboss-surface': {
    aliases: ['emboss-surface', 'Neumorphism', 'Letterpress', 'Deboss'],
    use: ['会员徽章、奖牌卡的面：压凸、压凹、石膏、金属压印四种。', 'interactive 让光源跟指针转。'],
    avoid: ['盘面上的控件用扁平的 token，不要浮雕。'],
    a11y: ['浮雕只是阴影，文字对比仍按文字色与底色算；石膏的 SVG 滤镜 aria-hidden。'],
  },
  'holographic-foil': {
    aliases: ['holographic-foil', 'Holo card', 'Foil card', 'Shiny card'],
    use: ['年度最佳策略、里程碑这类奖牌卡。', '四种箔：prism、aurora、gold、oil；颜色全由 token 混出，跟主题走。'],
    avoid: ['卡里的小字要有底色，箔会从下面透出来。', '列表里不要放几十张。'],
    a11y: [
      '箔层与柔光 aria-hidden；卡内容是普通 DOM，读屏照读。',
      'orientationLabel（授权按钮的文字）由调用方传，不传就没有按钮。',
    ],
  },
  'magnetic-field': {
    aliases: ['magnetic-field', 'Magnetic effect', 'Gravity tags'],
    use: [
      '首页的板块标签云：指针靠近时被吸、被推或绕着转。',
      '三种：attract、repel、orbit。',
      '传 items 时由组件排版：横排换行、间距 12px（gap-3），className 可改；传 children 时排版归调用方。',
    ],
    avoid: ['不要用在按钮、输入框上：它们会跑开，点不到。'],
    a11y: ['只在有精细指针的设备上启用；元素本身仍是普通 DOM，键盘与读屏照常。'],
  },
  'parallax-layers': {
    aliases: ['parallax-layers', 'Parallax', 'Scroll parallax'],
    use: ['首页头图、章节引子：多层按深度随滚动错位。', 'container 指向滚动容器时跟它滚。'],
    avoid: ['不要把要读的正文放进最前面的层。', '数据、表格不放进去。'],
    a11y: ['层的内容是普通 DOM，读屏照读；装饰层请自己带 aria-hidden。'],
  },
  'progressive-blur': {
    aliases: ['progressive-blur', 'Gradient blur', 'Edge blur', 'Scroll fade'],
    use: ['滚动列表的边缘渐渐虚掉，提示「下面还有」：新闻流、日志、侧栏。'],
    avoid: ['不要盖在需要点击的内容上：它不挡指针。', '表格里要读的行不要被它盖住。'],
    a11y: ['模糊层 aria-hidden，不挡指针；children 若有会保持可交互、可读。'],
  },
  'scroll-image-reveal': {
    aliases: ['scroll-image-reveal', 'Image reveal', 'Scroll mask'],
    use: ['首页、策略介绍页的配图：擦除、帘子、圆形、百叶、缩放。', 'once 让图揭开后不再合上。'],
    avoid: ['盘中界面的图表不用它。'],
    a11y: ['alt 必填：图是内容，不是装饰。'],
  },
  'svg-clip-mask': {
    aliases: ['svg-clip-mask', 'Clip path morph', 'Blob mask'],
    use: [
      '头像、封面图的异形裁切：blob、拱、菱形、波浪，或自己的路径（0 到 1 的坐标）。',
      '变形用的路径要有相同的命令结构。',
      '外框要给定宽高（className 或父级）：路径按外框算，外框被 flex 或块级撑宽时形状跟着拉宽、内容只露出一截；要铺满（如横幅波浪）就让外框铺满。',
    ],
    avoid: ['数据图表不裁。', '被裁掉的角上别放可点的东西。'],
    a11y: ['裁切只是视觉，children 是普通 DOM；被裁掉的部分看不到也点不到。'],
  },
  'svg-draw-on-scroll': {
    aliases: ['svg-draw-on-scroll', 'Draw on scroll', 'Path animation'],
    use: [
      '策略复盘页的权益曲线入场、引导页的路线图。',
      'marker 挂在笔尖：位置由路径几何算出，不依赖 CSS offset-path。',
    ],
    avoid: ['要读数的曲线用 EquityCurve：画到一半的曲线没有刻度。'],
    a11y: ['SVG aria-hidden：曲线表达的内容要另外写成文字。'],
  },
  'ascii-render': {
    aliases: ['ascii-render', 'ASCII art', 'Text image'],
    use: ['首页的氛围图、加载页的占位：把图或视频化成字符。', 'color=source 时字符带原图的色。'],
    avoid: ['不要拿它显示要读的图表。', 'columns 不超过 240。'],
    a11y: ['字符层 aria-hidden，alt 另放在 sr-only 里；读屏读 alt。', '屏外与 paused 时视频暂停。'],
  },
  'dither-image': {
    aliases: ['dither-image', 'Halftone', 'Dithering', 'Pixel image'],
    use: ['首页、文档的像素风配图：Bayer、Atkinson、Floyd-Steinberg、阈值四种。', 'progressive 让图滚进视口时擦出。'],
    avoid: ['不要拿它显示图表：量化后读不出数。'],
    a11y: ['原图的 alt 必填，抖动层 aria-hidden。'],
  },
  'pixel-brush-canvas': {
    aliases: ['pixel-brush-canvas', 'Pixel editor', 'Sprite editor'],
    use: [
      '给头像、策略图标画像素风小图：onChange 拿到像素缓冲，ref.toDataURL() 导出 PNG。',
      '读屏名、工具名、播报全走 labels，调用方传。',
    ],
    avoid: ['不是通用绘图工具：一层、最多九色、没有缩放。'],
    a11y: [
      '网格是 role=application，可聚焦；方向键移动，空格落笔，B、E、G 切笔，Ctrl 或 Cmd 加 Z 撤销。',
      '光标移动与落笔时 aria-live 播报当前格（labels.cell）。',
      '色板与工具是带 aria-pressed 的按钮。',
    ],
  },
}

export default motionFx
