// SPDX-License-Identifier: MIT
// 照 Salt 文档站补齐的页（2026-11-17，用户：「这些都得补上，而不是那些 MD 文档」）：入门两页、基础七页、Token 与主题两页。
// 写法照 Salt：每页一张表或几条规则，一条一句；数值从 tokens.json / motion.tokens.json 读，不手抄。
// Salt 有、我们原来没定过的（光标、响应式断点、时长档）照搬 Salt 的规则，页上写出处。

import type { ReactNode } from 'react'
import motion from '@katana-ui/tokens/motion.tokens.json'
import tokens from '../src/tokens-json'
import { CodeBlock, SymbolMark } from '../src/index'
import { GROUP_ICONS, KatanaMark } from './nav-icons'

type Token = { name: string; value: string | Record<string, string>; usage?: string }
const T = tokens as unknown as {
  color: { themes: { id: string; name: string; note?: string }[]; tokens: Token[] }
  density: { levels: string[]; tokens: Token[] }
  motion: { tokens: Token[] }
}

const Lede = ({ children }: { children: ReactNode }) => <p className="gal-lede">{children}</p>
const Src = ({ href, children }: { href: string; children: ReactNode }) => (
  <p className="gal-fd-source">
    出处：
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  </p>
)

function Table({ head, rows }: { head: readonly string[]; rows: readonly (readonly ReactNode[])[] }) {
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
        用自研的 pixelgate（MIT，本地跑，没有云服务）把文档站每个组件页的预览截下来，跟提交进仓库的基线逐像素比；
        有变化就退出码 1，给 CI、推送前和 worker 自查用。
      </p>
      <Table
        head={['规则', '做法']}
        rows={[
          [
            '平时改了组件',
            <>{code('pnpm vr:fast')}：只截这次改动影响到的页（graphite、dpr 1、开发服务器），改一个组件约半分钟</>,
          ],
          [
            '合并前、改了共用层',
            <>
              {code('pnpm vr')}：全量，两个主题 × 每个组件页（1440x900、dpr 1），外加文档站外壳三张与 dpr 2
              的几页关键页；改了令牌、theme 样式、lib、primitives 一定跑它
            </>,
          ],
          ['看什么', '只看报告（.pixelgate/report/index.html）里 changed 的图，并排、滑块、红色标出变化的像素'],
          ['确认是预期改动', <>{code('pnpm vr:approve')} 收为新基线，连同代码一起提交；不预期就改代码</>],
          [
            'CI',
            '只在 PR 上跑 pnpm vr --ci：不写基线，缺基线算失败；失败时 report 作为 artifact 上传，摘要写进 job summary',
          ],
          [
            '基线在哪',
            '.pixelgate/baseline/（Linux 渲染，要提交）；在别的系统上字体光栅不同，要接受 CI 的图时用 pnpm vr:approve --from <下载的 artifact 目录>',
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
      <Src href="https://www.saltdesignsystem.com/salt/foundations/size">Salt Design System · Size</Src>
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
      <Lede>图标、品牌标与品种徽标。</Lede>
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
          <SymbolMark code="AAPL" name="Apple" size={28} />
          <small>字母圆标</small>
        </span>
      </div>
      <p>没有授权的公司标一律用字母圆标（SymbolMark），不抓别人的 logo。</p>
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
      <h2>顺序色阶（seq）</h2>
      {swatches(pick('seq-'))}
      <p>有大小、没有正负（成交量、密度）。</p>
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
          状态语气在代码里是 {code("Severity = 'neutral' | 'ok' | 'warn' | 'danger'")}（状态灯与仪表多
          off、accent），涨跌是 {code("Tone = 'up' | 'down' | 'flat'")}，都在 src/lib；状态灯用{' '}
          {code('ledOf(severity)')}，不再各写映射表。
        </li>
      </ul>
      <h2>语义特征的词</h2>
      <Table
        head={['位置', '可选的词']}
        rows={[
          [
            '特征',
            'actionable（可点的）· content（文字）· separable（分隔线）· container（容器）· focused（焦点）· surface（面：sunken / base / raised / overlay）· status（状态语气）· tone（涨跌）· chart（图）· overlay（浮层影子）',
          ],
          ['强调', 'bold · subtle（中间那档不写）'],
          ['属性', 'background · foreground · borderColor · outlineColor · outlineWidth · outlineOffset · shadow'],
          ['状态', 'hover · active · disabled（静止不写）'],
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
  'token-naming': { title: 'Token 命名', section: 'tokens', Body: NamingPage },
  theming: { title: '主题接入', section: 'tokens', Body: ThemingPage },
} as const
