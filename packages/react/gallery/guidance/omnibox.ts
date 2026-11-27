// SPDX-License-Identifier: MIT
// 万能框与接近度悬停的「怎么用 / 无障碍」（#224）。交互借 Jamie Merrill 的搜索系列（2026-11-24 看的录屏帧）；写的数都是代码里的实值。
import type { GuidanceMap } from './types'

const omnibox: GuidanceMap = {
  omnibox: {
    aliases: ['Command bar', 'Universal search', 'Spotlight', 'Quick switcher', 'Search and ask', '万能框'],
    use: [
      'IDE 式工作台的主入口：品种、策略、命令、页面、插件在一处，还能直接提问；只要命令用 CommandPalette，只找品种用 SymbolSearch。',
      '类别由调用方给（categories），第一项是「全部」；页签在本地按 item.category 分组、数条数，onQuery 一次返回各类的结果（调用方自己限条数）。「全部」里每类最多 perCategory（4）条，多的是一行「显示全部 N」。受控（category + onCategoryChange）时设上或删掉作用域标签也会回「全部」并通知 onCategoryChange，不会停在原来那类。',
      '行有三种 kind，回车做的事不同：object 变成作用域标签（行尾提示「查看选项」）、command 直接运行（「运行」）、page 直接打开（「打开」）；item.hint 可改字，item.scope=false 让对象行也直接回调。',
      '作用域：选中的对象不打开，变成输入框里的标签（24 高胶囊 + ×），页签收起，onQuery 收到 scope，返回对它的操作（开图、下单草稿、看新闻、跑回测…，按 scope.type 由调用方给）；动作行回调时 info.scope 是那个对象。作用域下的动作不进「最近」。',
      '意图分强弱：强＝问号结尾、英文疑问词开头（后面还有词）、中文疑问词出现在句中任意位置（哪些、什么、怎么、如何、多少、是否、有没有…）、「吗 / 呢 / 么」收尾，一律收起结果区、右侧写「问 ↵」；弱＝只是够长（≥24 个字或 ≥6 个词），长的品种名（Taiwan Semiconductor Manufacturing）也会命中，所以要等搜索回来确实没有结果才当问句。回车调 onAsk(文字, scope)；判定函数用 detectIntent 属性换，返回 true / "weak" / false（createIntentDetector 改阈值）；没传 onAsk 或 labels.ask 就不判定。',
      '问句模式下仍在后台搜：搜出结果时右侧多一个「改为搜索」（labels.searchInstead），点它或按 ↓ 回到结果，文字再变就重新判定；没有任何结果、也不是问句时，回车也把打的字拿去问（空态多一行 labels.askInstead）。',
      '行尾提示：只在高亮行出现，替掉行尾 meta；按住 ⌘/Ctrl 时变「新标签打开」。⌘/Ctrl+Enter 或带修饰键点击：直接回调 onSelect，info.newTab=true，新标签怎么开是调用方的事。',
      '占位轮播：placeholders 给示例查询，每 2800ms 换一条（带 6px 上滑淡入），转 1 轮（placeholderCycles）后停在 labels.placeholder；指针在输入行上时暂停；不跟系统的「减少动态效果」（产品底线，theme/motion.css 头部）。',
      '禁用的行（item.disabled）不亮、不能选，回车跳过它；指针在它上面时底色回到当前行。',
      '预览：对象行的 preview 由调用方渲染（品种的 logo、名称、最新价与涨跌），高亮停 140ms 后浮在面板右侧 12px 外、宽 260；右边放不下换左边，两边都放不下不出。',
      '底栏：导航 ↑↓、选择 ↵、新标签 ⌘↵（Windows / Linux 上是 Ctrl↵）、关闭 Esc，36 高、sunken 底；字由 labels.footer 给，没给就没有底栏。',
      '最近：传 recent + onRecentChange 受控；不传只在内存里（刷新就没，对象行里的节点存不进 localStorage，需要持久化的调用方存 id 再还原）。「清除」是最近组里最后一个真选项（读屏与键盘能到），用样式摆到标题右端。',
      '高亮底色在行间滑动（useProximityHighlight）：滑动 333ms 的 snappy 弹簧，第一次出现不滑；行自己的选中底色是透明的。',
    ],
    avoid: [
      '只需要命令列表（带最近、带多步）用 CommandPalette。',
      '只找品种、要市场分段与按市场过滤的最近用 SymbolSearch。',
      '表单里选一个值用 combobox。',
    ],
    a11y: [
      '输入框是 combobox（cmdk，名字取 labels.title），列表是 listbox，行是 option；aria-selected 说的是当前高亮，不是已选；焦点不离开输入框。',
      'aria-keyshortcuts="Control+Enter Meta+Enter" 写在输入框上，读屏能知道「新标签」那一键。',
      '页签是 role=tablist / tab，aria-selected 标当前；按钮 tabIndex=-1：键盘用 Tab、Shift+Tab 在输入框里轮转，← → 只在输入框为空时切，鼠标点不抢输入框的焦点。作用域下页签收起，Tab 恢复成正常的焦点移动（能到 × 按钮）。',
      '作用域标签的 × 是真按钮，名字取 labels.removeScope(标签文字)，Enter、空格按的是它（不会冒泡去选高亮行）；标签文字用 aria-describedby 挂在输入框上；设上与删掉时在 role=status 里报一次（labels.scopeSet / scopeCleared），换页签报一次（labels.categorySet），结果稳定 400ms 后报一次个数（labels.resultCount，数的是画出来的行，不含「显示全部」）。',
      '问句模式：右侧「问」文字与「改为搜索」用 aria-describedby 挂在输入框上；输入框 aria-expanded=false，没有 aria-activedescendant（结果区不画行）；收起的结果区带 inert，不可聚焦也不被读到。',
      '焦点不被锁住：停在第一个页签再按 Shift+Tab、停在最后一个再按 Tab，焦点走出输入框（摆在页里的面板没有 Esc，WCAG 2.1.2）；作用域下、问句模式下 Tab 也是正常的焦点移动。',
      '回车与结果对得上才动手：结果没回来时按的回车先记着（连同作用域、查询、页签），结果一到、三者没变才对第一行生效；换了作用域、页签、按了方向键、改了字都作废。刚打开时高亮在「最近」上，回车直接选它，不等第一次搜索。',
      '输入法：回车、Esc、退格先判 isComposing 与 keyCode 229；组字中不搜索、不切意图、不删标签、对话框不因 Esc 关；组字结束才取最终的字。',
      '预览卡 aria-hidden、pointer-events: none：读屏不读，别把独有信息放进去。行尾提示、底栏键位也是 aria-hidden 的视觉提示。',
      '高亮底色元素与占位轮播文字都是 aria-hidden 的装饰；读屏读到的占位是输入框自己的静态 placeholder。',
      '占位轮播是自动更新的内容（WCAG 2.2.2 要求超过 5 秒的自动更新可暂停）：用户定了不加暂停钮，靠「转 1 轮就停、悬停暂停、输入后消失」；读屏读到的是输入框静态的 placeholder。',
    ],
  },
  'proximity-highlight': {
    aliases: ['Hover indicator', 'Sliding highlight', 'Magic hover', '接近度悬停'],
    use: [
      '菜单、列表、命令面板里让悬停底色在行间滑动：容器 position: relative，highlightRef 挂在第一个子元素上，行 position: relative、自己不画悬停底色。',
      '目标行：没给 activeSelector 时指针在容器里取最近的行（缝里与上下内边 12px 内也算，2px 迟滞防交界抖动）；给了 activeSelector（列表自己有当前行）时只认指针底下那一行，缝里回到当前行，免得高亮与回车选中的不是同一行；键盘把当前行换走了就作废指针行；禁用行（aria-disabled / data-disabled）不亮；指针不在时取当前行；都没有就收起。',
      '位置写在元素 style 的 translate / height / width 上，用 rAF 合并，不触发 React 重渲染，快速划过也不抖。',
      '换色换圆角：容器上设 --k-proximity-background、--k-proximity-radius（默认 selectable-subtle 悬停底、8px）。',
    ],
    avoid: ['只有两三个按钮的工具条：直接用按钮自己的悬停态。', '触屏：钩子忽略 touch 指针。'],
    a11y: [
      '底色元素是纯装饰：带 aria-hidden；放进 role=listbox 时再加 role="presentation"，免得 axe 报 listbox 里有不允许的子元素。',
      '过渡无条件写：产品不跟系统的「减少动态效果」（theme/motion.css 头部）。',
      '它不管焦点与选中：键盘怎么走、读屏读什么仍由列表自己负责。',
    ],
  },
}

export default omnibox
