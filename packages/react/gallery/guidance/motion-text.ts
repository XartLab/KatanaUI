// SPDX-License-Identifier: MIT
// 动效组里「文字动效」的「怎么用 / 无障碍」；aliases 里写 SmoothUI 原件名，方便从原件名搜到。
import type { GuidanceMap } from './types'

const motionText: GuidanceMap = {
  'text-reveal': {
    aliases: [
      'blur-out-up',
      'bottom-up-letters',
      'top-down-letters',
      'per-character-rise',
      'soft-blur-in',
      'per-word-crossfade',
      'depth-parallax-words',
      'spring-scale-in',
      'stagger-from-center',
      'stagger-from-edges',
      'reveal-text',
      'micro-scale-fade',
      'scale-down-fade',
      'focus-blur-resolve',
      'shimmer-sweep',
      'line-by-line-slide',
      'mask-reveal-up',
      'Split text',
      'Text animate',
    ],
    use: [
      '新闻标题、结论句、空状态标题出现的那一下：短标题按字，句子按词，两三行的标题按行。',
      '要换成某个 SmoothUI 原件的样子，给 preset 填它的名字；之后改任一参数就是自己的变体。',
      '放在长列表里时开 triggerOnView，滚进视口才播。',
    ],
    avoid: [
      '数据变了的刷新用 TextMorph 或 RollingText，进场只出现一次。',
      '长段落不要按字进场，用 by="word" 或 by="line"。',
    ],
    a11y: [
      '读屏读完整的句子（sr-only 副本），逐块的字是 aria-hidden。',
      '动效不跟系统的减少动态设置；时长都在一秒内，不遮挡内容。',
    ],
  },
  'text-swap': {
    aliases: [
      'fade-through',
      'shared-axis-x',
      'shared-axis-y',
      'shared-axis-z',
      'short-slide-right',
      'Phrase cycling',
      'Rotating text',
      'Headline ticker',
    ],
    use: [
      '滚动的新闻标题、轮播的提示语。',
      '切换视图时让标题跟着换：给 index，用 axis-x 表示左右并列的视图。',
      '一句话里想要硬切的节奏用 word-cut。',
    ],
    avoid: ['每秒都在变的数字不要用，用 RollingText。', '句子长短差得多时版面会跳，先把容器宽度定下来。'],
    a11y: [
      '外层 aria-live=polite，换句时读屏播报新句；轮播太快会不停播报，interval 别低于 2 秒。',
      '动效只是辅助，换了什么由文字本身说明。',
    ],
  },
  'word-build': {
    aliases: ['kinetic-center-build', 'short-slide-down', 'Word by word', 'Keynote build'],
    use: ['一句话的市场摘要、AI 的一行结论，一个词一个词地出现。'],
    avoid: ['需要一眼读完的关键数据不要用：整句要等所有词出齐。'],
    a11y: ['外层 aria-live=polite，读屏读到的是已出现的词；句子短一些，播报才不零碎。'],
  },
  'typewriter-text': {
    aliases: ['typewriter-text', 'Typing effect', 'Streaming text', 'Type out'],
    use: [
      'AI 回复与交易建议的逐字出现；流式时把累积的整段文字传进来，会接着打。',
      '终端风格的状态提示，caret 给光标。',
    ],
    avoid: ['用户必须马上读到的告警直接出整句。', '一屏里同时打很多段，注意力会被抢光。'],
    a11y: ['读屏读完整的句子（sr-only），打到一半的字是 aria-hidden，不会读到半句。', '光标是装饰，不进读屏。'],
  },
  'scramble-text': {
    aliases: ['scramble-hover', 'Text scramble', 'Decode effect', 'Glitch text'],
    use: [
      '代码与价格换了时扰一次（trigger="change"），配等宽字体。',
      '次要按钮、链接的悬停反馈（trigger="hover"）。',
      '数字较长时用 settle="left-to-right"，一位一位定下来更好读。',
    ],
    avoid: ['不要当作涨跌的唯一提示，涨跌另有颜色和符号。', '比例字体里数字宽度不同，扰动时会晃。'],
    a11y: [
      '读屏读真实文字，乱码是 aria-hidden。',
      'hover 同样在键盘聚焦时触发；只有带悬停的指针设备才会在悬停时触发。',
    ],
  },
  'text-morph': {
    aliases: ['text-morph', 'Text diff', 'Shared element text', 'Morphing text'],
    use: ['订单状态词、价格这类在原地变成另一串字的文字。', '没变的字要原地不动时用它，比整串淡入淡出看得清哪里变了。'],
    avoid: ['要看涨跌方向的滚动数字用 RollingText。', '整段正文不要用，每个字一个动画节点。'],
    a11y: ['完整文字在 sr-only，逐字 aria-hidden；根元素可用 as 换成标题。'],
  },
  'shine-text': {
    aliases: ['shine-text', 'Shimmer text', 'Text shimmer', 'Loading text'],
    use: ['AI 在分析、数据在加载的「进行中」文字。'],
    avoid: ['已经完成的状态换成普通文字，流光只表示进行中。'],
    a11y: ['文字照常可读；流光是背景渐变，不影响读屏。', '高光与底色的对比度都要够，传自定义色时检查。'],
  },
  'wave-text': {
    aliases: ['wave-text', 'Bouncing text', 'Live indicator text'],
    use: ['一个词表示「正在实时」，如 Live、Streaming。'],
    avoid: ['不要放进密集的表格，一整屏起伏会盖过数据。'],
    a11y: ['整句在 sr-only，逐字 aria-hidden。', '一直在动，尽量只放一处。'],
  },
  'scroll-reveal-paragraph': {
    aliases: ['scroll-reveal-paragraph', 'Scroll text reveal', 'Word highlight on scroll'],
    use: ['长篇研报摘要、说明页导读：随滚动逐词点亮。', '在自己的滚动容器里用时传 container。'],
    avoid: ['需要马上读到的重点不要用：未点亮的字对比度低。'],
    a11y: ['整段在 sr-only，读屏读全文，与滚动位置无关。', '暗字只是视觉，不会妨碍复制与查找。'],
  },
  'kinetic-type-scroll': {
    aliases: ['kinetic-type-scroll', 'Scroll typography', 'Variable font scroll'],
    use: ['标题与分段大字随滚动「呼吸」。', '用可变字体时给 weightRange，波峰处变粗。'],
    avoid: ['正文不要用，字距与大小在变会打断阅读。'],
    a11y: ['整句在 sr-only，逐词 aria-hidden。', '最暗时仍有 45% 的不透明度，句子不会消失。'],
  },
  'perspective-text-3d': {
    aliases: ['perspective-text-3d', '3D text', 'Depth text', 'Parallax text'],
    use: ['大标题的景深装饰，随指针或滚动倾斜。'],
    avoid: ['小字号和表格里不要用，透视会让字发虚。'],
    a11y: ['整句在 sr-only，各段 aria-hidden。', '指针驱动没有键盘等价，它只是装饰。'],
  },
  'gravity-letters': {
    aliases: ['gravity-letters', 'Falling letters', 'Text physics', 'Drop text'],
    use: ['空状态、熔断提示这类带一点玩笑的场合。', '需要程序控制时用 collapsed 受控。'],
    avoid: ['需要读的警告不要用：字掉下去就读不了，用 Alert。'],
    a11y: [
      'click 触发时是 role=button 加 aria-pressed，Enter 与空格可切换。',
      '整句在 sr-only，读屏不受字掉下去的影响。',
    ],
  },
  'ransom-note': {
    aliases: ['ransom-note', 'Cut-out text', 'Collage text'],
    use: ['空状态与品牌页的装饰标题。'],
    avoid: ['数据与要认真读的内容不要用：字体与倾斜是故意不统一的。'],
    a11y: ['整句在 sr-only，纸片 aria-hidden。', '纸色与字色取 token，换主题时对比度仍要自己检查。'],
  },
}

export default motionText
