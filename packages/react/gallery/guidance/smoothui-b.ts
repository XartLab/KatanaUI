// SPDX-License-Identifier: MIT
// 照 SmoothUI 搬来的「浮层、导航、展示与布局」一批的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const smoothuiB: GuidanceMap = {
  avatar: {
    aliases: ['Profile picture', 'User icon', 'Presence'],
    use: [
      '标出「谁」：评审人、协作者、策略作者。',
      '要显示在线、离开、忙碌：给 status 与 statusLabel。',
      '一群人：用 AvatarGroup 叠放，设 max 折成 +N。',
    ],
    avoid: ['要显示一个人的详情，用 RichPopover 或 HoverCard 接在头像后面。'],
    a11y: [
      '头像的读屏名取自 alt；状态点是 role=img，名字取自 statusLabel。',
      'AvatarGroup 是 role=group，读屏名 label 必填；+N 的名字由 overflowLabel 给。',
    ],
  },
  breadcrumb: {
    aliases: ['Breadcrumbs', 'Path', 'Trail'],
    use: ['层级较深（策略 / 动量 / 某次回测）时标出当前位置并允许一步回到上层。'],
    avoid: ['要切换并列视图，用 tabs。', '只有一层时不要用。'],
    a11y: ['nav 带读屏名 label；当前页带 aria-current="page"；分隔符是装饰，aria-hidden。'],
  },
  pagination: {
    aliases: ['Pager', 'Page navigation', 'Paging'],
    use: ['表格、报告这类按页取数、总页数已知的列表。'],
    avoid: ['行情、新闻这类无限流，用加载更多或虚拟滚动。'],
    a11y: ['nav 的名字、上一页 / 下一页、每个页码的名字都由 labels 传；当前页带 aria-current="page"；到头的按钮禁用。'],
  },
  collapsible: {
    aliases: ['Disclosure', 'Expander', 'Show more'],
    use: ['单独一段次要内容默认收起（高级参数、说明）。'],
    avoid: ['几段并列、同时只看一两段，用 accordion。'],
    a11y: ['基于 UI SDK Collapsible：触发器是 button，带 aria-expanded 与 aria-controls；读屏名取自标题文字。'],
  },
  menubar: {
    aliases: ['Menu bar', 'Application menu', 'File menu'],
    use: ['编辑器类界面顶上一排「文件、视图、运行」。'],
    avoid: ['整页导航用 side-nav，带大块说明的顶栏用 navigation-menu。', '上下文操作用 context-menu。'],
    a11y: ['基于 Radix Menubar：role=menubar，← → 在顶层菜单间走，↓ 或 Enter 打开，Esc 关闭并回到触发器。'],
  },
  'navigation-menu': {
    aliases: ['Mega menu', 'Nav menu', 'Top navigation'],
    use: ['顶栏上几个入口，每个展开一个带说明或分组的面板。'],
    avoid: [
      '入口只是链接、没有面板，直接放链接（用 navigationMenuTriggerClass 做同样外观）。',
      '要把条撑高、面板长在条里，用 expandable-navbar。',
    ],
    a11y: [
      '基于 Radix NavigationMenu：nav + 列表，触发器带 aria-expanded；← → 在入口间走，Esc 关闭。',
      '面板里的链接是真正的 a，当前页写 data-active。',
    ],
  },
  'file-tree': {
    aliases: ['Explorer', 'Folder tree', 'Directory tree'],
    use: ['策略目录、回测产物、数据集：有文件夹也有文件，需要图标与行尾徽标。'],
    avoid: ['纯分类的层级（品种分类、数据集目录），用 tree-view。', '几千个节点：它没有虚拟化。'],
    a11y: [
      'role=tree，读屏名 label 必填；每行 role=treeitem，带 aria-level、aria-expanded（文件夹）、aria-selected。',
      '同一时刻只有一行在 Tab 顺序里（roving tabindex），方向键走。',
    ],
  },
  dock: {
    aliases: ['App dock', 'Launcher', 'Magnifying toolbar'],
    use: ['底部或侧边的一排常用工具（图表、回测、新闻），指针靠近时放大。'],
    avoid: ['主导航用 side-nav。', '触屏为主的界面不要用：放大靠指针。'],
    a11y: [
      'role=toolbar，读屏名 label 必填；每格是 button，名字取自 label；标签是装饰、aria-hidden，不靠它给名字。',
      '← → 走（竖排 ↑ ↓）；放大只是视觉，点击区不依赖它。',
    ],
  },
  'rich-popover': {
    aliases: ['Rich tooltip', 'Info card', 'Preview popover'],
    use: ['点一个品种代码，弹出名称、一句说明、财报时间和「打开图表」。', '需要一个主动作的轻量卡片。'],
    avoid: ['只读的悬停预览用 hover-card。', '一句话提示用 tooltip。', '要填表单用 popover 或 dialog。'],
    a11y: ['基于 Radix Popover：触发器带 aria-expanded，Esc 关闭并回到触发器。', '外链图标的读屏名由 hrefLabel 给。'],
  },
  'animated-file-upload': {
    aliases: ['Dropzone', 'File picker', 'Import'],
    use: ['导入回测数据、策略文件：拖入或点击选择，有大小与类型限制。'],
    avoid: [
      '要显示上传进度或做真实上传，由调用方在 onFilesSelected 里做。',
      '只选一个文件且已有按钮的地方，用普通按钮加隐藏 input。',
    ],
    a11y: [
      '落点是 role=button，名字与说明在 labels.zone；Enter 或 Space 打开选择器；隐藏的 input 不进读屏树。',
      '超限提示是 role=alert，立即播报。',
    ],
  },
  'expandable-cards': {
    aliases: ['Accordion cards', 'Expanding cards'],
    use: ['并排比较几个版本或方案：窄卡看摘要，展开一张看详情。'],
    avoid: ['要同时看见几张的详情，用表格或并排的卡。', '线性的版本回看，用 time-machine-stack。'],
    a11y: [
      '每张卡的标题是 button，带 aria-expanded；整张卡面靠 ::after 覆盖层可点，不嵌套按钮。',
      '外层 role=group，名字 label 必填。',
    ],
  },
  'time-machine-stack': {
    aliases: ['Card stack', 'History stack', 'Version stack'],
    use: ['回看版本史：最前是当前，往后是更早；每次只读一张。'],
    avoid: ['要并排对比，用 expandable-cards 或表格。'],
    a11y: [
      'role=listbox，面板是 option，aria-activedescendant 指向最前一张；位置由 aria-live 播报（status 回调给文字）。',
      '键盘 ↑ ↓ Home End；到头时滚轮还给页面，不拦截。',
    ],
  },
  'floating-navbar': {
    aliases: ['Sticky nav', 'Pill nav', 'Section nav'],
    use: ['长报告、长文档页内的章节跳转。'],
    avoid: ['整个应用的导航用 side-nav。'],
    a11y: [
      'nav 带读屏名 label；当前项带 aria-current="page"；隐藏时 pointer-events 关掉，但仍在 Tab 顺序里（滚回来即显示）。',
    ],
  },
  'expandable-navbar': {
    aliases: ['Mega nav', 'Expanding header'],
    use: ['顶栏入口带大块说明，面板长在条里。'],
    avoid: ['面板要浮在条外、可嵌多级，用 navigation-menu。'],
    a11y: [
      '入口是 button，带 aria-expanded 与 aria-controls；面板是 role=region，名字取自入口。',
      'Esc 收起，焦点移出收起；悬停开合之外点击与键盘都能开。',
    ],
  },
  'mac-terminal': {
    aliases: ['Terminal window', 'Console replay', 'Log player'],
    use: ['演示回测日志、部署输出或 AI 推理的逐步过程。'],
    avoid: ['真的日志与可搜索输出，用 code-block 或表格。', '需要用户输入命令。'],
    a11y: [
      '外壳 role=group（autoPlay 关时是 role=button，Enter 开始），名字取自 labels.window。',
      '逐字变化的区域对读屏隐藏，完整文本另放一份在 sr-only 里。',
    ],
  },
  'folder-reveal': {
    aliases: ['Folder', 'File stack', 'Reveal'],
    use: ['首页、营销页里「一组东西收在一起」的示意。'],
    avoid: ['交易主界面：它是插画式交互。', '卡里要放可点的东西。'],
    a11y: [
      '前盖是 button，带 aria-expanded，名字取自 label；Enter 或 Space 开合（trigger=hover 时聚焦即开）。',
      '卡合着时 aria-hidden。',
    ],
  },
  'glass-card': {
    aliases: ['Frosted card', 'Liquid glass', 'Glassmorphism'],
    use: ['压在图片或渐变上的首页、营销页卡片。'],
    avoid: ['交易主界面：大面积背景模糊重绘很贵。', '压在纯色底上。'],
    a11y: ['卡里文字与玻璃底的对比度要自己核（底会随背景变），不低于 4.5:1。', '高光与色散边是装饰，aria-hidden。'],
  },
  'glow-hover-card': {
    aliases: ['Spotlight card', 'Hover glow'],
    use: ['首页的功能入口卡、营销页并排卡片。'],
    avoid: ['交易主界面。'],
    a11y: ['光斑只是装饰，aria-hidden；信息不能只靠亮起的边线传达。'],
  },
  'gooey-popover': {
    aliases: ['Gooey menu', 'Blob popover', 'Liquid popover'],
    use: ['首页或营销页里的小彩蛋式入口。'],
    avoid: ['交易主界面的弹层用 popover。'],
    a11y: [
      '圆钮是 button，带 aria-expanded，名字取自 triggerLabel；Esc 与点外面关闭。',
      'goo 滤镜层 aria-hidden，面板在滤镜上层，文字不糊。',
    ],
  },
  'morph-surface': {
    aliases: ['Dynamic island', 'Morphing pill', 'Ask AI pill'],
    use: ['首页浮在页面一角的「问 AI」入口。'],
    avoid: ['交易主界面：提问走命令面板或 AI 输入件。'],
    a11y: ['药丸是 button，带 aria-expanded，名字取自 openLabel；展开时药丸退出 Tab 顺序，Esc 关闭。'],
  },
  'tilt-card': {
    aliases: ['3D card', 'Parallax card', 'Hover tilt'],
    use: ['首页、营销页的功能卡。'],
    avoid: ['交易主界面：行情与下单区要稳。', '长文字卡：转动时文字会糊。'],
    a11y: ['倾斜只在精细指针设备上出现；键盘聚焦给固定的小倾斜。', '高光是装饰，aria-hidden。'],
  },
}

export default smoothuiB
