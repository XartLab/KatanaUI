// SPDX-License-Identifier: MIT
// 照 Salt 文档站补齐的页（2026-11-17，用户：「这些都得补上，而不是那些 MD 文档」）：入门两页、基础七页、Token 与主题两页。
// 写法照 Salt：每页一张表或几条规则，一条一句；数值从 tokens.json / motion.tokens.json 读，不手抄。
// Salt 有、我们原来没定过的（光标、响应式断点、时长档）照搬 Salt 的规则，页上写出处。

import type { ReactNode } from 'react'
import motion from '@katana-ui/tokens/motion.tokens.json'
import tokens from '../src/tokens-json'
import { HEAD_HEIGHTS, HEAD_SUB_EXTRA, ROW_HEIGHTS, type GridDensity } from '../src/blocks/data-grid/data-grid-props'
import { CodeBlock, SymbolMark } from '../src/index'
import { GROUP_ICONS, KatanaMark } from './nav-icons'

type Token = { name: string; value: string | Record<string, string>; usage?: string }
const T = tokens as unknown as {
  color: { themes: { id: string; name: string; note?: string }[]; tokens: Token[] }
  density: { levels: string[]; tokens: Token[] }
  motion: { tokens: Token[] }
}

/** 数据浓度档（tokens.json 的 characteristics k-heat-*），数据可视化页与语义特征页都画这一排。 */
export const HEAT = ['k-heat-0', 'k-heat-1', 'k-heat-2', 'k-heat-3', 'k-heat-4', 'k-heat-5'] as const

export const Lede = ({ children }: { children: ReactNode }) => <p className="gal-lede">{children}</p>
const Src = ({ href, children }: { href: string; children: ReactNode }) => (
  <p className="gal-fd-source">
    出处：
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  </p>
)

export function Table({ head, rows }: { head: readonly string[]; rows: readonly (readonly ReactNode[])[] }) {
  return (
    <table className="gal-fd-table">
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell}>{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className={j === row.length - 1 ? 'gal-fd-usage' : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
const code = (text: string) => <code>{text}</code>

/* ---------- 入门 ---------- */

function DevelopingPage() {
  return (
    <>
      <Lede>在一个 React 项目里用起来：装两个包，引三份 CSS，根节点写主题。没有 Provider。</Lede>
      <h2>1. 装包</h2>
      <CodeBlock
        copyLabel="复制"
        copiedLabel="已复制"
        language="bash"
        code={`pnpm add "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/tokens" \\
         "git+https://github.com/XartLab/KatanaUI.git#v0.1.0&path:packages/react"`}
      />
      <p>还没发 npm：按 git 标签装。pnpm 要在 allowBuilds 里放行 @katana-ui/react（装的时候编译到 lib/）。</p>
      <h2>2. 引 CSS（顺序固定）</h2>
      <CodeBlock
        copyLabel="复制"
        copiedLabel="已复制"
        language="tsx"
        code={`import '@katana-ui/tokens/tokens.css' // 令牌：颜色、文字档、间距、密度、动效
import '@katana-ui/react/fonts.css'    // 随包字体（LCD、点阵、窄体）
import '@katana-ui/react/ui.css'       // 组件样式、渲染层，最后引`}
      />
      <h2>3. 根节点</h2>
      <Table
        head={['属性', '值', '作用']}
        rows={[
          [code('data-theme'), '不写 / console', '不写是 Graphite（默认）；console 是暖色旧主题'],
          [code('data-updown'), '不写 / cn', 'cn 红涨绿跌'],
          [code('data-density'), 'high / medium / low', '可写在任意容器上往下继承，默认 medium'],
          [code('data-text-smoothing'), '等', '渲染设置，见「渲染设置」页与 RenderingSettings'],
        ]}
      />
      <h2>4. 用件</h2>
      <CodeBlock
        copyLabel="复制"
        copiedLabel="已复制"
        language="tsx"
        code={`import { Button, DataGrid } from '@katana-ui/react'
import { EquityCurve } from '@katana-ui/react/quant'`}
      />
      <p>也可以用 shadcn 注册表把单个件拷进项目：{code('npx shadcn add <站点>/r/<件名>.json')}。</p>
      <h2>文档站版式</h2>
      <Table
        head={['规则', '数值']}
        rows={[
          ['页头：标题 → 导语 → meta 行 → 页签', '间距 8 / 12 / 24px，全走 --space-*'],
          ['标题', 'display 档（28px）、字重 600'],
          ['导语', 'title 档（15px）、行高约 26px，最宽 68ch'],
          ['正文列', '最宽 960px；示例卡片横向滚动，内容不出卡片边'],
          ['页签行', '吸在顶栏下，页面底色，下边一条 --line-100'],
          [
            '右侧「本页」目录',
            '视口 ≥ 1560px 才显示（先保正文 960），200px 宽，列当前页签的 h2 / h3；没有 h2 就不显示',
          ],
          ['目录条目', '13px、次级文字色；当前项主文字色加左侧 2px 线'],
          ['切页与锚点', '切页回到顶；锚点落点让开顶栏与页签'],
          ['基础页表格', '三列顶对齐、行高 20px；长字体栈单行截断，全文在悬停提示'],
        ]}
      />
      <h2>视觉回归</h2>
      <p>
        用自研的 pixelgate（MIT，本地跑，没有云服务）做两层像素比对，都跟提交进仓库的基线逐像素比，有变化就退出码 1：
        组件截图（Vitest
        浏览器模式里直接渲染件，每个件一张，两个主题）管件本身；整页回归管文档站外壳和没有组件截图的页。
      </p>
      <Table
        head={['规则', '做法']}
        rows={[
          [
            '平时改了组件',
            <>
              {code('pnpm fast')}：一分钟内跑完（超过就算 bug）。只截改动的件和引用它的件（Graphite，最多 30
              个，波及更多截代表件）； 改动全有组件截图时不跑整页
            </>,
          ],
          [
            '组件截图',
            <>
              {code('browser/*.browser.test.tsx')}，测试名等于件的文件名（lcd.tsx → lcd）；基线在
              .pixelgate-unit/baseline/。 新件要配一张，不然快速模式认不出，只能退回整页
            </>,
          ],
          [
            '截图停在哪一帧：能等的等终态',
            <>
              不赌「等 N 毫秒够不够」。截图前统一过 {code('settled()')}（browser/settle.ts）：连着 3
              帧都没有在跑的有限动画或过渡才放行，Radix 浮层要先定好位（定位前外壳是 translate(0,
              -200%)，只看动画会误判已静）
            </>,
          ],
          [
            '截图停在哪一帧：计时器长出来的件',
            <>
              {code('waitUntil()')} 等一个看得见的终态再截：打字件等 data-typing 消失，终端回放等可见区（不是
              sr-only）出现最后一行，WordBuild 只放一句、等词数到齐（演示件两句会循环退场，永远没有静止的时刻）
            </>,
          ],
          [
            '截图停在哪一帧：一直在动的件',
            <>
              先看件有没有静态参数：{code('animate={false}')}（DitherChart）、{code('paused')}
              （Orb、InfiniteSlider）。没有就钉时间：画布靠 rAF 与 performance.now 画的，挂载前装 {code(
                'frameClock()',
              )}{' '}
              走固定 60 帧；靠 setInterval 变的（SwitchboardCard，种子固定），挂载前假掉 setInterval、走固定 8
              跳，再换回只假 Date。无限循环的 CSS 动画（打字光标）用 {code('settled({ freezeInfinite: true })')} 停在第
              0 刻
            </>,
          ],
          [
            '截图停在哪一帧：不要靠 prefers-reduced-motion',
            '产品不跟系统的「减少动态效果」（theme/motion.css 头部），组件里没有这条分支；motion 组的 CDP 模拟只对少数件有效，别当稳定手段',
          ],
          [
            '并发与超时',
            <>
              组件截图同时最多 4 页（{code('maxWorkers')}，机器核数更少就取核数），测试 30s、等稳定的截图 10s。13
              个文件一起开页时 WebGL 件的软渲染把 CPU 占满，别的页「等元素稳定」会超时（2026-11-24 main 的 run
              45412157714 有 5 个 15s 超时）；超时是排队，不是件坏了，先看有没有一起开的重件，别先调大超时
            </>,
          ],
          ['怎么验稳定', '同一环境连跑 3 次，截图逐字节一致才算稳；只红一次的像素差先当成不稳定查，不要先收基线'],
          [
            '整页回归（pnpm vr）',
            <>
              有组件截图的页不再截预览区（2026-11-18：423 张降到 30 张，5 分半降到 35
              秒）；留下没有组件截图的页、Paper（浅色）的 11 个浮层页（阴影在浅底上最显眼）、文档站外壳三张与 dpr 2
              的几页关键页
            </>,
          ],
          [
            '全量在哪跑',
            'CI 上并行：单测、组件截图、整页回归、e2e（切 4 片）各一个 job；runner 由仓库变量 KATANAUI_RUNNER 指到自建机，没设用 GitHub 托管机。本地只在必要时跑全量',
          ],
          ['看什么', '只看报告（.pixelgate/report/index.html）里 changed 的图，并排、滑块、红色标出变化的像素'],
          ['确认是预期改动', <>{code('pnpm vr:approve')} 收为新基线，连同代码一起提交；不预期就改代码</>],
          [
            'CI',
            '整页回归只在 PR 上跑 pnpm vr --ci：不写基线，缺基线算失败；失败时 report 作为 artifact 上传，摘要写进 job summary',
          ],
          [
            '基线在哪',
            '.pixelgate/baseline/（Linux 渲染，要提交）；在别的系统上字体光栅不同，要接受 CI 的图时用 pnpm vr:approve --from <下载的 artifact 目录>',
          ],
          [
            '组件截图的基线',
            <>
              .pixelgate-unit/baseline/，只收自建 runner 上渲染的（Playwright 1.56.1 镜像）：沙箱与别的机器的 Chromium
              与字形不同，同样的代码也会红（primitives 七张浮层图在沙箱红、在 runner 过，#218）。CI
              上组件截图红了，artifact pixelgate-unit 里有 runner 的实际截图，核对是预期改动后用{' '}
              {code('pnpm exec pixelgate approve --out-dir .pixelgate-unit --from <下载的目录>')} 收
            </>,
          ],
          [
            '比较方式',
            'pixelmatch，逐像素色差阈值 0.1，忽略抗锯齿；稳定化：固定时钟、关光标闪烁、动画归零、实时演示保持暂停',
          ],
          [
            '不进视觉回归的页',
            'agent-avatar、arcade-pixel、aurora-curtain、border-beam、grid-loader、matrix-orb、motion-loader、pixel-flow-field、ransom-note、shine-text、wave-text：动画由 JS 逐帧驱动，CSS 关不掉，整页都是这个动画，没有稳定的一块可遮；ai-status：循环动画停的帧不固定，两次运行差几十个像素；market-heatmap：分块布局随量到容器尺寸的时机变，两次运行不一致；它们的行为仍由 e2e 管',
          ],
        ]}
      />
    </>
  )
}

function StylingPage() {
  return (
    <>
      <Lede>样式怎么进页面、怎么跟应用自己的样式共存。</Lede>
      <Table
        head={['规则', '为什么']}
        rows={[
          ['样式是静态 CSS，不在运行时注入', '没有 CSP nonce 的问题；可以缓存、可以按需拆'],
          ['ui.css 最后引', '组件类没有分层，排后面才压得过前面没分层的规则'],
          ['组件只读 --k-* 语义特征与密度变量，不读调色层', '换主题只改调色层；见「三层 token」'],
          ['应用要改样子，覆盖变量，不覆盖类', '类名会随版本变，变量是公开约定'],
          ['类名前缀 k-，data 属性 data-slot', '跟应用的类不撞；测试按 data-slot 找部件'],
          ['Tailwind v4 可以和应用共用', '包里的类按需生成，应用不用额外配置'],
        ]}
      />
    </>
  )
}

/* ---------- 基础 ---------- */

function DurationPage() {
  const springs = Object.entries(motion as Record<string, { stiffness: number; damping: number; mass: number }>)
  const use: Record<string, string> = {
    snappy: '按下、开关、勾选、悬停高亮：跟手，几乎不回弹',
    gentle: '面板最大化 / 还原、侧栏滑出、浮层升起、分割线复位',
    settle: '松手后落位（滑块把手、拖拽卡片）：慢一点、稳',
  }
  return (
    <>
      <Lede>两套东西：等待的时长档（照 Salt），和动效的三条弹簧（我们自己的，位移与缩放只用弹簧）。</Lede>
      <h2>等待时长</h2>
      <Table
        head={['档', '时长', '什么时候']}
        rows={[
          ['instant', '0 ms', '输入的直接反馈：点、打字、拖、悬停——反馈本身就是确认'],
          ['perceptible', '300 ms', '次要信息延迟出现，如提示'],
          ['notable', '1000 ms', '取数、加载；超过这个就要显示进度（加载件、progress 光标）'],
          ['cutoff', '10000 ms', '系统响应的最晚时间；到了就给状态说明，并让用户能去做别的'],
        ]}
      />
      <Src href="https://www.saltdesignsystem.com/salt/foundations/duration">Salt Design System · Duration</Src>
      <h2>弹簧</h2>
      <Table
        head={['名', '刚度 / 阻尼 / 质量', '等效时长', '用在']}
        rows={springs.map(([name, s]) => [
          code(`--ease-${name}`),
          `${s.stiffness} / ${s.damping} / ${s.mass}`,
          code(`--dur-${name}`),
          use[name] ?? '',
        ])}
      />
      <ul className="gal-list">
        <li>
          CSS 用 {code('transition: transform var(--dur-gentle) var(--ease-gentle)')}；JS 用 motion/react
          的同名弹簧参数。
        </li>
        <li>颜色、透明度用 120–200ms 线性过渡，不用弹簧。</li>
        <li>不跟系统的「减少动态效果」：动效只有三类原因（状态变了、东西进出、跟手），本来就克制（产品底线）。</li>
      </ul>
      <h2>数据刷新</h2>
      <p>
        数据会自己更新的地方（行情、新闻流、连板天梯、自选），变了的地方要让人看得出，但不能晃眼。五条规则，共用层在{' '}
        {code('src/lib/live.ts')}，皮肤在 {code('src/theme/live.css')}，各件不再自己写闪烁。
      </p>
      <Table
        head={['规则', '做法']}
        rows={[
          [
            '数值变了，闪 600ms',
            '涨 / 跌色的弱化档铺在背景上，线性淡到透明；字色不动，对比度不降。用 useValueFlash + .k-live-flash。',
          ],
          [
            '新条目高亮 1200ms',
            '左侧 2px 蓝线（--signal-blue，与选中的橙、涨跌色、炸板的琥珀都分开）加底色，前一半保持、后一半淡出。用户已经滚离顶部时，新条目只计数、不插入，点「新增 n 条」再合入。用 useEnterMarks + .k-live-enter。',
          ],
          [
            '重排位移 240ms',
            '行从旧位置平滑移到新位置（FLIP，只动 transform），缓动用 --ease-snappy。用 useFlipList。',
          ],
          [
            '状态变化闪一次',
            '状态字符串变了闪一次；炸板这类坏消息用警示色（琥珀，更糟用跌红）闪两下。用 useStatusFlash + .k-live-alert。',
          ],
          [
            '同一格 1 秒最多闪一次',
            '窗口里的变化直接换值、不补闪，行情密的时候不晃眼。常量 LIVE_FLASH_GAP_MS，只在 JS 里。',
          ],
        ]}
      />
      <Table
        head={['名', '值', '什么时候']}
        rows={[
          ...T.motion.tokens.map((token) => [code(`--${token.name}`), token.value as string, token.usage ?? '']),
          [code('LIVE_FLASH_GAP_MS'), '1000 ms', '同一格两次闪烁之间至少隔多久（节流，TS 常量，不是 CSS 变量）。'],
          [code('--ease-snappy'), '弹簧', '重排位移的缓动；颜色与透明度的淡出用线性，不用弹簧。'],
        ]}
      />
      <ul className="gal-list">
        <li>涨跌色读 --pnl-up / --pnl-down，「涨跌颜色」设成红涨绿跌时跟着互换，闪烁不用再写一遍。</li>
        <li>
          tokens 里没有涨跌色的弱化档，所以用 color-mix 把涨跌色按 24% 混进底色；底下本来有色的件（热力图格子）用
          --k-live-base 交出自己的底色。
        </li>
        <li>动效只是辅助：变化本身要写在文字里，不靠闪色一个通道。</li>
        <li>用法与演示见「布局与导航」里的 live 页。</li>
      </ul>
    </>
  )
}

function ModesPage() {
  return (
    <>
      <Lede>一套 token 名，多套值。组件不知道当前是哪套主题。</Lede>
      <Table
        head={['主题', '怎么开', '说明']}
        rows={T.color.themes.map((theme) => [
          theme.name,
          theme.id === 'graphite' ? '根节点不写 data-theme（默认）' : code(`data-theme="${theme.id}"`),
          theme.note ?? '',
        ])}
      />
      <ul className="gal-list">
        <li>新主题 = 以 Graphite 为底、只改底色、灰阶、线与信号色；阴影、圆角、材质跟底主题走。</li>
        <li>每套主题都过对比度：正文灰（ink-300）与涨跌色在面板底（bg-300）上 ≥ 4.5:1。</li>
        <li>加主题只改 tokens.json 的 color.themes 与各 token 的值，生成脚本与文档站自动跟上。</li>
      </ul>
      <h2>叠加在主题上的开关</h2>
      <Table
        head={['开关', '值', '作用']}
        rows={[
          [code('data-updown'), 'cn', '涨跌色对调（红涨绿跌）；组件只写 pnl-up / pnl-down'],
          [code('data-transparency'), 'reduced', '去掉毛玻璃与半透明'],
          [code('data-density'), 'high / medium / low', '高度与内距，见「密度」'],
        ]}
      />
      <ul className="gal-list">
        <li>LCD 窗在任何主题下都是深色岛（lcd-bg）。</li>
        <li>主题切换只改根节点属性，不重渲染组件。</li>
      </ul>
    </>
  )
}

/** DataGrid 各档的格内边距、正文与用处（行高与表头高读组件里的常量，不手抄）。 */
const GRID_DENSITY: readonly [GridDensity, string, string, string][] = [
  ['compact', '8px', '12px w500（数据字）', '面板密表：自选栏、盘口'],
  ['default', '8px', '12px w500（数据字）', '面板里的一般表'],
  ['relaxed', '8px', '12px w500（数据字）', '带子行、按钮的表'],
  ['comfortable', '12px，首列左 20px', '14px w400；表头 13px 次要色', '整页的表：选股器、持仓、报告'],
]

function SizePage() {
  const value = (name: string, level: string) => {
    const token = T.density.tokens.find((t) => t.name === name)
    return token && typeof token.value === 'object' ? token.value[level] : '—'
  }
  const rows: [string, string, (level: string) => string][] = [
    ['控件高', 'k-size-base', (l) => value('k-size-base', l) ?? '—'],
    ['行高（表格行、菜单项、图标按钮）', 'k-size-row', (l) => value('k-size-row', l) ?? '—'],
    ['勾选框、开关', '—', (l) => ({ high: '12px', medium: '14px', low: '16px' })[l] ?? '—'],
    ['图标', '—', (l) => ({ high: '12px', medium: '14px', low: '16px' })[l] ?? '—'],
    ['指示条（标签页下划线、导航轨迹）', '—', (l) => ({ high: '1px', medium: '2px', low: '2px' })[l] ?? '—'],
  ]
  return (
    <>
      <Lede>尺寸跟密度走，同一行里的件等高、文字落在同一条基线上。</Lede>
      <Table
        head={['用途', 'token', ...T.density.levels]}
        rows={rows.map(([what, token, at]) => [
          what,
          token === '—' ? '—' : code(`--${token}`),
          ...T.density.levels.map(at),
        ])}
      />
      <ul className="gal-list">
        <li>图标不小于 12×12。</li>
        <li>边框与分隔线固定 1px，不随密度变。</li>
        <li>容器（表格行）= 控件高 + 上下各一档小间距。</li>
        <li>字号不随密度变（数据字固定）。</li>
      </ul>
      <h2>数据表的行高档（DataGrid density）</h2>
      <Table
        head={['档', '行高', '表头（有 sub 时）', '格内左右', '正文', '用在']}
        rows={GRID_DENSITY.map(([level, pad, text, use]) => [
          code(level),
          `${ROW_HEIGHTS[level]}px`,
          `${HEAD_HEIGHTS[level]}px（${HEAD_HEIGHTS[level] + HEAD_SUB_EXTRA[level]}px）`,
          pad,
          text,
          use,
        ])}
      />
      <ul className="gal-list">
        <li>整页的表（选股器、持仓、报告）用 comfortable，面板里的密表用 compact / default；三档旧值不改（#90）。</li>
        <li>comfortable 默认画行间 1px 横线（--k-separable-tertiary-borderColor），不画竖线；悬停整行提亮一档。</li>
        <li>单位 10px w500 次要色、跟在数后空一格；代码芯片 12px w600、高 24、圆角 radius-control。</li>
        <li>
          这两样是共用的 .k-code-chip /
          .k-num-unit（theme/cell-type.css，#92）：QuoteTable、Watchlist、LimitLadder、EventCalendar 与 DataGrid
          同一份；面板密表只换格内排版，行高不变。
        </li>
        <li>
          报告类的原生表（SeriesExplorer、HypothesisLedger、StrategyReport、图的表格视图）给 table 加
          .k-table-comfortable，读同一组 --k-table-* 变量，数值与 comfortable 一致（#92）。
        </li>
        <li>两行表头：有一列带 sub 时所有列头名字顶到同一条线，单行列头与两行的第一行同一基线（#92）。</li>
      </ul>
      <Src href="https://www.saltdesignsystem.com/salt/foundations/size">Salt Design System · Size</Src>
      <Src href="https://www.tradingview.com/screener/">
        TradingView 选股器（comfortable 的数值，#90 记录的 2026-11-18 实测）
      </Src>
    </>
  )
}

function ResponsivenessPage() {
  return (
    <>
      <Lede>工作台是桌面应用：主要在 M 以上。窄屏只保证能看、能退出，不保证能交易。</Lede>
      <Table
        head={['档', '宽度', '栅格列', '版面']}
        rows={[
          ['XS', '0–599', '2', '单列；侧栏收起成抽屉'],
          ['S', '600–959', '4', '单列为主；面板上下叠'],
          ['M', '960–1279', '6', '侧栏 + 内容；面板两列'],
          ['L', '1280–1919', '8', '工作区默认；文字为主的页最宽 1280 居中'],
          ['XL', '≥1920', '12', '大屏模式：面板缝加宽，读数放大'],
        ]}
      />
      <ul className="gal-list">
        <li>看板、工作区用流式栅格（跟着窗口变）；文档、设置这类文字页用固定栅格，最宽 1280 居中。</li>
        <li>页边距与栅格间距跟密度走：高 12、中 24、低 36。</li>
        <li>面板最小 240 × 160；小于它显示「太小」占位，不硬挤。</li>
      </ul>
      <Src href="https://main.saltdesignsystem.com/salt/foundations/responsiveness/breakpoints">
        Salt Design System · Breakpoints
      </Src>
    </>
  )
}

function CursorPage() {
  return (
    <>
      <Lede>光标说明「这里能做什么」。只有能点的地方是手形。</Lede>
      <Table
        head={['光标', '用在']}
        rows={[
          [code('pointer'), '能点的件：悬停、按下、已选中'],
          [code('default'), '不能点的文字、面板底、标签'],
          [code('text'), '能输入、能选中的文字；只读的输入框也是 text'],
          [code('not-allowed'), '禁用的件（同时降透明度，不只靠光标）'],
          [code('grab / grabbing'), '能拖的东西：悬停 grab，拖动中 grabbing'],
          [code('ew-resize / ns-resize'), '只能横向 / 纵向拖的：分割线、列宽'],
          [code('crosshair'), '图表绘图区（十字光标模式）'],
          [code('progress'), '系统忙、用户要等（超过 1 秒时）'],
        ]}
      />
      <Src href="https://www.saltdesignsystem.com/salt/foundations/cursor">Salt Design System · Cursor</Src>
    </>
  )
}

function AssetsPage() {
  return (
    <>
      <Lede>图标、品牌标、品种徽标与徽标来源。</Lede>
      <h2>图标</h2>
      <ul className="gal-list">
        <li>只用 lucide-react（ISC）；控制台专用的少数图标自己画，同样 24 栅格、1.75 线宽。</li>
        <li>尺寸跟密度：12 / 14 / 16；颜色跟文字（currentColor），不单独上色。</li>
        <li>图标按钮必须有读屏名（aria-label）；纯装饰的图标写 aria-hidden。</li>
        <li>导航只给大分组配图标，条目不带。</li>
      </ul>
      <div className="gal-fd-icons">
        {Object.entries(GROUP_ICONS).map(([name, Icon]) => (
          <span key={name}>
            <Icon aria-hidden />
            <small>{name}</small>
          </span>
        ))}
      </div>
      <h2>品牌标</h2>
      <div className="gal-fd-icons">
        <span>
          <KatanaMark size={32} />
          <small>32</small>
        </span>
        <span>
          <KatanaMark size={20} />
          <small>20</small>
        </span>
      </div>
      <p>圆角方框里一道斜刃，刃尖用 --accent。正式标定下来以后替换。</p>
      <h2>品种徽标</h2>
      <div className="gal-fd-icons">
        <span>
          <SymbolMark symbol="AAPL" name="Apple" size="md" />
          <small>字母圆标</small>
        </span>
      </div>
      <p>没有授权的公司标一律用字母圆标（SymbolMark），不抓别人的 logo。</p>
      <h2>徽标</h2>
      <p>
        品种、公司、币种、交易所的图由 <code>@katana-ui/logos</code> 解析（#94，2026-11-19）：应用根上包一次
        LogoProvider，SymbolMark 没给 src 时按来源顺序逐个试，都失败退回字母。
      </p>
      <ul className="gal-list">
        <li>
          加密币用许可清楚的开源包：内置 <code>web3icons()</code> 取 @web3icons/core（MIT，1790 个币、30
          个交易所），每个 SVG 按需载入（1–3 KB 一个）；cryptocurrency-icons（CC0）用命令行下载补缺。
        </li>
        <li>
          币标只配 assetClass crypto：BTCUSDT、BTC-PERP、BINANCE:BTC 这类写法自动认出，裸代码 META
          不配币标（可能是股票）。
        </li>
        <li>
          企业徽标是商标，不进本仓库也不进包：应用自托管（selfHosted），或用徽标服务（urlTemplate，如 Logo.dev），key
          由应用给。
        </li>
        <li>
          自托管按「代码.场所」命名，场所用 ISO MIC：<code>600519.XSHG.svg</code>、<code>00700.XHKG.svg</code>、
          <code>AAPL.XNAS.svg</code>，再退到 <code>AAPL.svg</code>；币在 <code>crypto/BTC.svg</code>，交易所在{' '}
          <code>venues/binance.svg</code>。
        </li>
        <li>
          A 股、港股没有开源合集，三条路，都按「代码.场所」存进应用自己的目录，失败的不中断、写 manifest.json：
          <ul>
            <li>
              付费包下载后自托管：<code>companiesLogo({'{ token }'})</code>（companieslogo.com，沪{' '}
              <code>600519.SS</code>、深 <code>000001.SZ</code>、港股 <code>0700.HK</code>
              ，条款允许下载后自托管；北交所暂不支持），
              <code>katana-logos fetch --provider companieslogo --token …</code>；EODHD 也有 60 多个交易所的徽标包。
            </li>
            <li>
              按官网域名取：<code>logoDev({'{ token }'})</code>（Logo.dev 按代码的接口只收 NYSE /
              NASDAQ，按域名的接口全球通用）或 <code>byDomain(模板)</code>；域名由应用的 <code>domainMap</code>
              （「代码.场所」→ 官网域名，如数据层从公司资料里拿）给， 命令行用 <code>--domains map.json</code>。
            </li>
            <li>
              只能热链：<code>logoKit({'{ token }'})</code>（LogoKit，
              <code>img.logokit.com/ticker/…&amp;fallback=404</code>，没标回 404 由我们退回字母）；免费档
              64px、要放署名链接、条款不许下载自托管（命令行拒绝它），每个应用 / 用户用自己的 publishable key。A
              股后缀默认 <code>.SZ</code> / <code>.SS</code>（它的文档没写，待拿 key 实测后再定，可用{' '}
              <code>suffix</code> 改），北交所不映射。
            </li>
            <li>
              自己整理：按 <code>600519.XSHG.svg</code> 命名放进自托管目录，用 <code>selfHosted</code> 读。
            </li>
          </ul>
        </li>
        <li>
          全市场一次铺满用 <code>katana-logos sync --list market.csv --out public/logos</code>（清单列
          symbol、venue（ISO MIC）、name、domain，A 股、美股、港股、加密币放一份）。推荐：免费源为主（2026-11-19
          定，不付费）——官网图标（清单的 domain，其次 Wikidata 的官网；SVG → apple-touch-icon → 最大的 icon →
          /apple-touch-icon.png → /favicon.ico → Google） → Wikidata 徽标（P154，按交易所 + 代码批量查，每批 200）→
          web3icons → 都没有画字母；companieslogo（沪深 .SS / .SZ，许下载自托管）、
          付费包、LogoKit（只登记热链）写进配置才用。
        </li>
        <li>
          质量过滤：小于 32px、Google 的 16px 地球占位、宽高比大于 2.2
          的横向字标、全透明或一整块单色都丢，记原因，接着试下一个来源； coverage.md
          按市场列命中率、来源占比、被丢原因与缺失清单。
        </li>
        <li>增量：来源没变、没过 --refresh 天的跳过；并发默认 6，失败重试 2 次，一个品种出错不影响别的。</li>
        <li>不抓任何平台（TradingView、东方财富、雪球、富途等）的徽标 CDN：那是平台自有资产，条款不允许转用。</li>
        <li>
          不用 TradingView 等平台自己的 CDN 上的图（如它的 moutai.svg）：那是它的私有资源，没有授权；key
          一律由应用给，包里不写死。
        </li>
        <li>
          代码规范化：BTCUSDT / BTC-USDT / BTC/USDT / BTCUSDT.P → BTC；600519.SH、sh600519 → 600519.XSHG；0700.HK →
          00700.XHKG。
        </li>
        <li>没有图就画字母圆标；同一个地址失败一次就不再请求（失败缓存），成功的下次先用。</li>
        <li>文档站的股票图是自绘示意图（public/logos-demo/），不是这些公司的标志。</li>
      </ul>
      <p className="gal-note">
        与上面「不抓别人的
        logo」的关系：仍不抓、不收进仓库；应用自己有授权（自托管或徽标服务的条款）时由它配来源。Logo.dev
        不默认接（2026-11-19 定），要用时应用自己给 key。
      </p>
    </>
  )
}

function DataVizPage() {
  const pick = (prefix: string) => T.color.tokens.filter((t) => t.name.startsWith(prefix))
  const swatches = (list: Token[]) => (
    <div className="gal-fd-ramp">
      {list.map((t) => (
        <span key={t.name} title={t.usage}>
          <i style={{ background: `var(--${t.name})` }} />
          <small>{t.name}</small>
        </span>
      ))}
    </div>
  )
  return (
    <>
      <Lede>图表的颜色、线与读数。颜色按「数据是什么」选色板，不按好看。</Lede>
      <h2>分类色（series）</h2>
      {swatches(pick('series-'))}
      <p>不同的东西（策略、品种）。最多 7 个，再多合进「其他」。</p>
      <h2>数据浓度（heat）</h2>
      <div className="gal-fd-ramp">
        {HEAT.map((name) => (
          <span key={name}>
            <i style={{ background: `var(--${name})` }} />
            <small>{name}</small>
          </span>
        ))}
      </div>
      <ul className="gal-list">
        <li>
          有大小、没有正负的数据（热力格、直方柱、分层次序、成交量、密度、点阵面）一律用
          --k-heat-1…5，越大越亮；--k-heat-0 是空档（没数据或零值的格）。
        </li>
        <li>数值：主文字色混透明 6 / 16 / 30 / 46 / 64 / 84%（heat-0…5），换主题跟着主文字色走，不另写色值。</li>
        <li>
          Graphite 压在 bg-100 上约 #161616 / #2f2f2f / #515151 / #797979 / #a6a6a6 / #d7d7d7；Console 约 #21201d /
          #373531 / #55524c / #78746c / #9f9a8f / #cac4b6。
        </li>
        <li>
          格上的字：heat-0…2 用 --k-heat-fg-low（主文字色，Graphite 在 heat-2 上 7.9:1），heat-3…5 用
          --k-heat-fg-high（最底层底色，Graphite 在 heat-3 上 4.8:1、Console 4.2:1）。
        </li>
        <li>
          品牌橙只给焦点角括号（#50）：顺序色阶 seq-100…600 是橙系，不再给数据用，token
          留着只为别的项目兼容（2026-11-18，评审 #78 定）。
        </li>
      </ul>
      <h2>顺序色阶（seq，不用于数据）</h2>
      {swatches(pick('seq-'))}
      <p>旧的橙系顺序色阶，数据浓度改用上面的 heat；新代码不读。</p>
      <h2>发散色阶（div）</h2>
      {swatches(pick('div-'))}
      <p>有正负、有中点（涨跌幅、偏离）；跟 data-updown 走。</p>
      <h2>规则</h2>
      <ul className="gal-list">
        <li>网格 chart-grid、轴 chart-axis、十字线 chart-crosshair；网格与零线吸到像素（渲染设置）。</li>
        <li>数值用数据字（--font-num，等宽数字）；单位与币种小一号、淡一档。</li>
        <li>每个图都能切成表格看（图下的表格按钮）。</li>
        <li>颜色不是唯一信号：涨跌同时有正负号，系列同时有图例或末端标签。</li>
      </ul>
      <h2>三种画风</h2>
      <p>同一张迷你图（Sparkline 与 MiniChart 的 look）有三种画风，一屏里只用一种。</p>
      <ul className="gal-list">
        <li>default：行情面板的画风，涨跌色的线加线下渐变，默认外观，不变。</li>
        <li>
          instrument：把数据当成科学档案来排版，1px
          中性墨色细线，全图只有一个信号色（只标「此刻要看的地方」：末端点与批注）， 配 +
          点阵、对位角标、投影谱、极值小十字与研究员批注；用在研究与复盘这种要看清分布的场合。
        </li>
        <li>
          ascii：终端字形，块字符或盲文点阵、等宽字或点阵字体，最新一列用信号色；用在状态栏、日志旁、加载这类终端感的地方。
        </li>
        <li>instrument 不用涨跌色，ascii 默认也不用（要着色传 tone）；涨跌靠旁边的数字与正负号表达。</li>
      </ul>
    </>
  )
}

/* ---------- Token 与主题 ---------- */

function NamingPage() {
  return (
    <>
      <Lede>看名字就知道它属于哪一层、能不能在组件里用。</Lede>
      <Table
        head={['层', '形式', '例子', '组件里能用吗']}
        rows={[
          ['原值（foundation）', '--k-<类>-<名>', code('--k-color-white'), '不能，只给语义特征引用'],
          ['调色（palette）', '--<族>-<档>', code('--ink-200  --bg-300  --signal-green'), '不能（老件在逐步迁走）'],
          [
            '语义特征（characteristics）',
            '--k-<特征>[-<强调>]-<属性>[-<状态>]',
            code('--k-actionable-bold-background-hover'),
            '能，组件只读这一层',
          ],
          ['密度', '--k-size-* / --k-spacing-*', code('--k-size-base  --k-spacing-200'), '能'],
          ['文字档', '--text-<档>（font 简写前三项）', code('font: var(--text-data) var(--font-num)'), '能'],
          ['字族', '--font-<角色>', code('--font-sans  --font-num  --font-mono'), '能'],
          ['动效', '--ease-<名> / --dur-<名>', code('--ease-gentle'), '能'],
        ]}
      />
      <h2>读哪一层（G0，2026-11-18 定）</h2>
      <ul>
        <li>
          次序：原始色阶（{code('--bg-000…400')} {code('--ink-100…400')} {code('--signal-*')}）→ 语义 token（
          {code('--pnl-up')} {code('--chart-grid')} {code('--shadow-overlay')} 这类按用途命名、分主题取值的）→
          characteristics（
          {code('--k-*')}，只引用前两层，不写字面值）。
        </li>
        <li>
          新代码只读 {code('--k-*')} 与语义 token，不直接读色阶：底用 {code('--k-surface-*')}，字用{' '}
          {code('--k-content-*')}
          ，状态色用 {code('--k-status-<ok|warn|danger|info|neutral>-<foreground|background|borderColor>')}，涨跌用{' '}
          {code('--k-tone-<up|down|flat>-foreground')}，图用 {code('--k-chart-*')}。迁移模板是
          Button（primitives/button.tsx）。
        </li>
        <li>
          Tailwind 的颜色类（{code('bg-surface-3')} {code('text-ink-2')} {code('text-danger')}）在 theme.css 里已改指
          characteristics，值与改前逐个相等；{code('bg-alpha-white-N')} 那一列是调色刻度，迁移时换成按用途的{' '}
          {code('--k-*')}。
        </li>
        <li>
          阴影：浮层（popover、hover-card、菜单、toast）读 {code('--shadow-overlay')}
          ，贴着触发器的列表（select、combobox、multi-select）读 {code('--shadow-overlay-sm')}，tooltip 读{' '}
          {code('--shadow-tooltip')}，dialog 与 sheet 读 {code('--shadow-dialog')}，开关滑块读 {code('--shadow-thumb')}
          ；件里不写 rgba。除 Paper 外各主题同值（就是改前写死的值），Paper 轻一档。
        </li>
        <li>
          输入件（G2，2026-11-18）：文本框、日期框、日期区间框读 {code('--k-editable-background')}（alpha-white-3 档）、
          {code('--k-editable-borderColor')}（alpha-white-7 档），聚焦边 {code('--k-editable-borderColor-active')}
          （alpha-white-12 档）； 以拖与按键为主的带框数值件（NumberInput、ShortcutRecorder）读{' '}
          {code('--k-editable-bold-*')}：底更淡（alpha-white-2 档）边更重（alpha-white-10 档），悬停底 4 档、拖动中底 6
          档边 14 档。不合法一律是 {code('--k-status-danger-foreground')} 的实色边（同 Input 的 aria-invalid）；原来
          NumberInput 与 DateTimeInput 写死的 55% 浅红不跟主题，去掉了。
        </li>
        <li>
          选中与键盘位置：日历选中的日子、区间两端是 {code('--k-selectable-bold-background-selected')} 实心底配{' '}
          {code('--k-selectable-bold-foreground-selected')} 字，区间中段 {code('--k-selectable-bold-background')}
          （alpha-white-10 档）；日期框里正在打的那一段是 {code('--k-focused-background')}
          。无框小按钮（日历翻月、清除钮、预设项）的悬停底统一 {code('--k-actionable-subtle-background-hover')}
          （alpha-white-4 档，原来各写 5 档）；胶囊（ChipGroup、FilterBar）的边统一按钮的{' '}
          {code('--k-actionable-borderColor')}（alpha-white-7 档 ，原来 8 档）。
        </li>
        <li>
          状态语气在代码里是 {code("Severity = 'neutral' | 'ok' | 'warn' | 'danger'")}（状态灯与仪表多
          off、accent），涨跌是 {code("Tone = 'up' | 'down' | 'flat'")}，都在 src/lib；状态灯用{' '}
          {code('ledOf(severity)')}，不再各写映射表。
        </li>
        <li>
          基础件（G1，2026-11-18）：原来写 {code('bg-alpha-white-N')} 的地方按用途换成新的
          characteristics，值逐个相等——浮层边 {code('--k-overlay-borderColor')}（7%）/ {code('-compact-')}
          （9%，贴触发器的列表）/ {code('-dialog-')}（9%）；输入框 {code('--k-editable-*')}（4% 底、8% 边、聚焦
          22%）；菜单与列表行 {code('--k-selectable-*')}（密排高亮 4%、悬停 5%、展开 7%、选中 9%）；
          勾选、单选、开关选中是 {code('--k-selectable-bold-*')}（实心 ink-100 + 最深底色的勾）；开关轨道{' '}
          {code('--k-selectable-track-*')}。浮层影子读 {code('--k-overlay-*-shadow')}。
        </li>
        <li>
          尺寸统一 {code("size: 'sm' | 'md'")}（Button、Input、Textarea、Toggle、ToggleGroup、MorphToggle），md
          是默认；旧名 {code("'default'")} 等于 md，ToggleGroup 的 {code('variant')} 改叫 {code('size')}
          ，都留一个版本。Button / Toggle 的 {code("size='icon'")} 是形状（28 见方），不算尺寸档，照旧。
        </li>
      </ul>
      <h2>语义特征的词</h2>
      <Table
        head={['位置', '可选的词']}
        rows={[
          [
            '特征',
            'actionable（可点的）· editable（输入框）· selectable（可选的行、勾选、开关、分段）· content（文字）· separable（分隔线）· container（容器）· focused（焦点）· surface（面：sunken / base / raised / overlay）· status（状态语气）· tone（涨跌）· chart（图）· overlay（浮层的边与影子）',
          ],
          ['强调', 'bold · subtle（中间那档不写）'],
          ['属性', 'background · foreground · borderColor · outlineColor · outlineWidth · outlineOffset · shadow'],
          ['状态', 'hover · active · selected · selectedHover · filled · disabled（静止不写）'],
        ]}
      />
      <Src href="https://www.saltdesignsystem.com/salt/themes/design-tokens">Salt Design System · Design tokens</Src>
    </>
  )
}

function ThemingPage() {
  return (
    <>
      <Lede>别的项目用这套件、换成自己的样子：只覆盖变量。</Lede>
      <CodeBlock
        copyLabel="复制"
        copiedLabel="已复制"
        language="css"
        code={`/* 在 ui.css 之后引 */
:root {
  --accent: #3b82f6;          /* 强调色 */
  --bg-100: #0b0d12;          /* 地面 */
  --radius-control: 6px;      /* 控件圆角 */
  --font-sans: "Inter Variable", var(--font-sans);
}`}
      />
      <Table
        head={['想改', '覆盖', '别碰']}
        rows={[
          ['强调色', '--accent（或 --signal-orange）', '各件里的类'],
          ['底色与文字灰阶', '--bg-*、--ink-*、--line-*', '语义特征（它们引用这些）'],
          ['圆角、阴影', '--radius-*、--plate / --recess / --lift', '—'],
          ['字体', '--font-*，或用 RenderingSettings 让用户自己选', '文字档的字号（会破坏密度对齐）'],
          ['涨跌约定', 'data-updown，不改颜色值', '—'],
        ]}
      />
    </>
  )
}

// 圆角写 Graphite / Console 两个主题的值（tokens.json：Graphite 浮层 8 · 控件 6，Console 10 · 7，面板两边都是 0）。
const MATERIALS = [
  [
    'k-mat-card',
    '卡片',
    '--radius-control',
    '6 / 7',
    'surface-base（bg-100）',
    'separable-tertiary（line-100）',
    '—',
    '页面里的一张独立小卡：QuoteCard、MiniChart、SymbolInfo、SymbolOverview、CompanyProfile、SwapPanel、SwitchboardCard、HoverExpand、AnimatedTags 的框、WebSearch 的占位卡',
  ],
  [
    'k-mat-block',
    '内容块',
    '--radius-overlay',
    '8 / 10',
    'surface-base（bg-100）',
    'separable-tertiary（line-100）',
    '—',
    '对话流与文档里的一整块：AiPromptInput、AiDiff、AiToolCall、AiArtifact、AiApproval、AiTaskList、CodeBlock',
  ],
  [
    'k-mat-inset',
    '内嵌区',
    '--radius-control',
    '6 / 7',
    'container-secondary（bg-200）',
    'separable-tertiary（line-100）',
    '—',
    '卡片里再圈出的一块：AiPromptInput 的附件、TaskList 的行、WebSearch 的来源格',
  ],
  [
    'k-mat-overlay',
    '浮层',
    '--radius-overlay',
    '8 / 10',
    'surface-overlay（bg-400）',
    'overlay（7% 白）',
    '--k-overlay-shadow',
    '浮在页面上面的：Popover、菜单（DropdownMenu、ContextMenu、Menubar 都经 menuContainerClass）、HoverCard、NavigationMenu 的面板、RichPopover、Toast、AiContextMeter 的明细、WebSearch 的预览',
  ],
  [
    'k-panel',
    '面板',
    '--radius-panel',
    '0 / 0',
    'surface-raised（bg-300）',
    '--hairline',
    '--plate',
    '工作台里的一个面板：PanelFrame',
  ],
] as const

// 写成字符串而不是 JSX 文字：JSX 里换行会变成一个空格，中文中间会多出空格。
const MATERIAL_THEME_RULES = [
  '状态色盖在材质上：调用处加一个描边色的工具类就行（AiPromptInput 聚焦时 border-ink-4，Toast 左边 2px 色条是 border-l-2 加 TONE 色），不另起一套材质。',
  'Graphite（默认主题）下，Popover、下拉与右键菜单、Menubar、Select、HoverCard、对话框另由 graphite.css 按 data-slot 与 k-pop 换成玻璃：底 --glass-bg（72% 不透明的 #202020）、边 --glass-edge（10% 白）、模糊 --glass-blur（24px、饱和 1.7），阴影是顶部 1px 内高光加 --glass-shadow（#131）。',
  'k-mat-overlay 自己是实色：用它但不在那份选择器里的 RichPopover、Toast、AiContextMeter 明细、WebSearch 预览、NavigationMenu 面板，在 Graphite 下仍是实色。',
  'Graphite 下 --hairline 换成 line-100 的 70%（#131），面板的描边比 Console 淡。',
]

const MATERIAL_SOURCES = [
  '2026-11-19 清点 src/ 里手拼「圆角 + 描边 + 底色」的容器共 19 处、8 种组合；前三种占 14 处，原样收成上面三个类，换上后像素不变（#73）。',
  '2026-11-23 在 main（81228813，#131 之后）上重清，口径是同一个元素上同时写了圆角、非 0 的描边、不透明的底色（TSX 的 className / cn() 与 CSS 的同一条规则，不含材质类自己）：共 106 处。其中 49 处是控件与小件（按钮、输入框、下拉触发、芯片、标签、键帽、勾选、滑块把手、状态点），各有自己的件，不归材质；容器 57 处。',
  '这次换上材质类 14 处，值逐项相等、像素不变：k-mat-overlay 8 处（Popover、menuContainerClass、HoverCard、NavigationMenu 面板、RichPopover、Toast、AiContextMeter 明细、WebSearch 预览；后四处原来写 alpha-white-6、surface-4、--shadow-overlay，跟 overlay 特征是同一组值）；k-mat-card 5 处（QuoteCard、MiniChart、SymbolInfo、SymbolOverview、CompanyProfile，各自 CSS 里同值的三行删掉）；k-mat-block 1 处（AiPromptInput 外框）。现在 28 处容器用材质类。',
  '值已经等于配方、留到下一批再换的 3 处：OrderTicket 外框（= k-mat-card）、Calendar 的卡与 ListBox 带框（= k-mat-inset：container 边与 separable-tertiary 都是 line-100）。这几件 #103、#104 刚改过，避开并行的改动。',
  '还有 40 处容器不在配方里，没动，待用户定并进配方还是保留。重复两次以上的组合：surface-raised 底 + 7% 白边 + overlay 圆角（GlowHoverCard、TiltCard、ExpandableCards）；对话框（14px 圆角、raised 底、dialog 边与阴影：Dialog、SymbolSearch）；8% 白边 + 4% 白底（SwapPanel 两格）；8px 圆角 + 9% 白边 + container-tertiary 底（DecisionQueue、HypothesisLedger 的卡）。',
  '离配方只差一项的：Card（container-subtle 边，底按 variant）、a2ui 的 Command（overlay 圆角配 container-secondary 底）、.k-render（8px 写死，Console 下不等于 overlay 的 10）、.k-sm-cell（4px 写死，接近 inset）、TimeMachineStack（边是 separable-secondary 8%，浮层是 7%）、Select 的下拉（7px、compact 边与阴影）、Alert 与 Menubar 的条（container-subtle 边）。',
  '其余是单件自己的样子：MacTerminal、HolographicFoil、FolderReveal、FloatingNavbar、ExpandableNavbar、Dock 的条与提示、AnimatedFileUpload 的文件行、PixelBrushCanvas、ComponentCatalog 的缩略图、AiMessage 气泡、EventTimeline 两处、BrushStrip、Loading 两条、MarketHeatmap 悬停卡、NewsFeed 卡片版、PeerCards 主卡、Sparkline 提示、StrategyReport 读数格、Whiteboard 节点与分组。',
  '待用户定：Graphite 下 k-mat-overlay 要不要也上玻璃（把它加进 graphite.css 的玻璃选择器）。加了，上面「仍是实色」的五处跟着变玻璃，像素会变。',
  '待用户定：间距在中密度是 3 / 6 / 9 / 12 / 18，高密度是 2 / 4 / 6 / 8 / 12，要不要统一成 4px 体系。',
]

function MaterialsPage() {
  return (
    <>
      <Lede>材质 = 底色 + 描边 + 圆角（+ 阴影）的固定组合。做容器时挑一个材质类，不再手拼这四样。</Lede>
      <Table
        head={['类', '名字', '圆角（Graphite / Console）', '底色', '描边', '阴影', '用在']}
        rows={MATERIALS.map(([cls, name, radius, px, bg, border, shadow, use]) => [
          <code key="c">{cls}</code>,
          name,
          <span key="r">
            <code>{radius}</code> {px}
          </span>,
          bg,
          border,
          shadow,
          use,
        ])}
      />
      <h2>样子</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {MATERIALS.map(([cls, name]) => (
          <div key={cls} className={cls} style={{ width: 150, height: 84, padding: 12, position: 'relative' }}>
            <span className="k-text-caption">{name}</span>
          </div>
        ))}
      </div>
      <h2>规则</h2>
      <ul className="gal-list">
        <li>强弱从低到高：内嵌区 → 卡片 / 内容块 → 面板 → 浮层。只有面板与浮层带阴影，页面里的卡片不加阴影。</li>
        <li>
          嵌套时里面的圆角比外面小一档：内容块（overlay 圆角）里放卡片或内嵌区（control 圆角），再往里用
          --radius-inner。
        </li>
        <li>材质类只定这四样；内边距、宽高、排布照旧用工具类写在调用处。</li>
        <li>类都包在 :where() 里（优先级 0），调用处的工具类能压过；要改整套样子去改 token，不在各件里另调。</li>
        <li>输入框的材质在 Input（editable 特征），不在这张表里；读数窗在 Lcd。</li>
        {MATERIAL_THEME_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <h2>出处与没收进来的</h2>
      <ul className="gal-list">
        {MATERIAL_SOURCES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  )
}

export const MORE_PAGES = {
  developing: { title: '开发接入', section: 'start', Body: DevelopingPage },
  styling: { title: '样式引入', section: 'start', Body: StylingPage },
  size: { title: '尺寸', section: 'foundations', Body: SizePage },
  duration: { title: '时长与动效', section: 'foundations', Body: DurationPage },
  modes: { title: '主题与模式', section: 'foundations', Body: ModesPage },
  responsiveness: { title: '响应式', section: 'foundations', Body: ResponsivenessPage },
  cursor: { title: '光标', section: 'foundations', Body: CursorPage },
  assets: { title: '图标与资源', section: 'foundations', Body: AssetsPage },
  dataviz: { title: '数据可视化', section: 'foundations', Body: DataVizPage },
  materials: { title: '材质', section: 'foundations', Body: MaterialsPage },
  'token-naming': { title: 'Token 命名', section: 'tokens', Body: NamingPage },
  theming: { title: '主题接入', section: 'tokens', Body: ThemingPage },
} as const
