// SPDX-License-Identifier: MIT
import {
  BarChart3,
  FlaskConical,
  MessageCircle,
  Newspaper,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AnimatedFileUpload,
  Avatar,
  AvatarGroup,
  Breadcrumb,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dock,
  ExpandableCards,
  ExpandableNavbar,
  FileTree,
  FloatingNavbar,
  FolderReveal,
  GlassCard,
  GlowHoverCard,
  GooeyPopover,
  MacTerminal,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MorphSurface,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  RichPopover,
  TiltCard,
  TimeMachineStack,
  type FileTreeItem,
  type TerminalLine,
} from '../../src/index'
import { Row } from './parts'

// 「浮层、导航、展示与布局」这批（照 SmoothUI 搬）的演示。数据与文案都是演示用的，场景取交易工作台。

const replay = (children: (key: number) => React.ReactNode) => {
  function Replay() {
    const [key, setKey] = useState(0)
    return (
      <div className="gal-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
        {children(key)}
        <Button size="sm" onClick={() => setKey((k) => k + 1)}>
          <RotateCcw /> 重播
        </Button>
      </div>
    )
  }
  return Replay
}

export function AvatarDemo() {
  return (
    <>
      <Row name="状态点">
        <Avatar alt="陈 A" fallback="陈A" status="online" statusLabel="在线" />
        <Avatar alt="王 B" fallback="王B" status="away" statusLabel="离开" />
        <Avatar alt="李 C" fallback="李C" status="busy" statusLabel="忙碌" size="lg" />
        <Avatar alt="赵 D" fallback="赵D" status="offline" statusLabel="离线" size="sm" />
      </Row>
      <Row name="叠放，最多 3 个">
        <AvatarGroup label="策略评审人" max={3} overflowLabel={(n) => `另有 ${n} 人`}>
          {['陈A', '王B', '李C', '赵D', '孙E'].map((n) => (
            <Avatar key={n} alt={n} fallback={n} />
          ))}
        </AvatarGroup>
      </Row>
    </>
  )
}

export const BreadcrumbDemo = replay((key) => (
  <Breadcrumb
    key={key}
    label="当前位置"
    items={[{ label: '策略', href: '#' }, { label: '动量', href: '#' }, { label: '回测 2026-11' }]}
  />
))

export function PaginationDemo() {
  const [page, setPage] = useState(5)
  return (
    <Row>
      <Pagination
        page={page}
        totalPages={20}
        onPageChange={setPage}
        labels={{ nav: '分页', previous: '上一页', next: '下一页', page: (n) => `第 ${n} 页` }}
      />
    </Row>
  )
}

export function CollapsibleDemo() {
  return (
    <Collapsible defaultOpen className="gal-wide">
      <CollapsibleTrigger>高级参数</CollapsibleTrigger>
      <CollapsibleContent>滑点、手续费、调仓日历。默认收起，改过的才展开。</CollapsibleContent>
    </Collapsible>
  )
}

export function MenubarDemo() {
  return (
    <Row>
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger>文件</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>新建策略</MenubarItem>
            <MenubarItem>导入数据</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>导出报告</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>视图</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>紧凑行高</MenubarItem>
            <MenubarItem>显示成交量</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="run">
          <MenubarTrigger>运行</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>开始回测</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </Row>
  )
}

export function NavigationMenuDemo() {
  return (
    <div style={{ minHeight: 200 }}>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>行情</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div style={{ width: 220, display: 'grid', gap: 2 }}>
                <NavigationMenuLink href="#">自选列表</NavigationMenuLink>
                <NavigationMenuLink href="#">板块热力图</NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>研究</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div style={{ width: 280, display: 'grid', gap: 2 }}>
                <NavigationMenuLink href="#">回测</NavigationMenuLink>
                <NavigationMenuLink href="#">因子库</NavigationMenuLink>
                <NavigationMenuLink href="#">研究笔记</NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const FILES: FileTreeItem[] = [
  {
    id: 'strategies',
    name: 'strategies',
    type: 'folder',
    children: [
      { id: 'momentum', name: 'momentum.py', type: 'file', badge: 'M' },
      { id: 'meanrev', name: 'mean_reversion.py', type: 'file' },
      {
        id: 'pairs',
        name: 'pairs',
        type: 'folder',
        children: [{ id: 'p1', name: 'etf_spread.py', type: 'file', badge: 'A' }],
      },
    ],
  },
  {
    id: 'backtests',
    name: 'backtests',
    type: 'folder',
    children: [
      { id: 'b1', name: '2026-11-17-momentum.json', type: 'file', badge: '2.1 MB' },
      { id: 'b2', name: '2026-11-10-momentum.json', type: 'file', badge: '2.0 MB' },
    ],
  },
  { id: 'readme', name: 'README.md', type: 'file' },
]

export function FileTreeDemo() {
  const [selected, setSelected] = useState<string>()
  return (
    <div className="gal-wide" style={{ width: 300 }}>
      <FileTree label="策略与回测文件" items={FILES} defaultExpanded={['strategies']} onSelectedChange={setSelected} />
      <p className="gal-note">选中：{selected ?? '无'}</p>
    </div>
  )
}

export function DockDemo() {
  return (
    <Row>
      <Dock
        label="工作台工具"
        items={[
          { id: 'chart', label: '图表', icon: <BarChart3 />, active: true },
          { id: 'backtest', label: '回测', icon: <FlaskConical /> },
          { id: 'news', label: '新闻', icon: <Newspaper /> },
          { id: 'signal', label: '信号', icon: <TrendingUp /> },
          { id: 'settings', label: '设置', icon: <Settings2 /> },
        ]}
      />
    </Row>
  )
}

export function RichPopoverDemo() {
  return (
    <Row name="点品种代码">
      <RichPopover
        trigger={<Button>NVDA</Button>}
        title="NVIDIA Corp"
        icon={<TrendingUp size={14} />}
        description="数据中心业务决定板块节奏，财报在收盘后公布。"
        meta="财报 16:05"
        actionLabel="打开图表"
        actionIcon={<Play />}
      />
      <RichPopover
        trigger={<Button>600519</Button>}
        title="贵州茅台"
        href="#"
        hrefLabel="在新窗口打开"
        description="白酒龙头，北向资金昨日净流入。"
        meta="盘中"
        side="bottom"
      />
    </Row>
  )
}

export function AnimatedFileUploadDemo() {
  return (
    <div className="gal-wide" style={{ width: 380 }}>
      <AnimatedFileUpload
        accept=".csv,.parquet"
        maxSize={5 * 1024 * 1024}
        onFilesSelected={() => {}}
        labels={{
          zone: '导入回测数据。拖文件到这里，或按键盘选择',
          idle: '拖入数据文件，或点击选择',
          dragging: '松开即可导入',
          list: '已选文件',
          remove: (name) => `移除 ${name}`,
          tooLarge: (count, limit) => `${count} 个文件超过 ${limit}，已忽略`,
        }}
      />
    </div>
  )
}

export function ExpandableCardsDemo() {
  const versions = [
    ['v1', '1.12', '固定 20 日回看，不做过滤。'],
    ['v2', '1.31', '加入波动率过滤：高波动日不开新仓。'],
    ['v3', '1.42', '换手约束放宽到 30%，最大回撤从 -11% 降到 -8%。'],
    ['v4', '1.38', '试了行业中性，收益下降，已回退。'],
  ] as const
  return (
    <div className="gal-wide">
      <ExpandableCards
        label="策略版本"
        cards={versions.map(([id, sharpe, note]) => ({
          id,
          title: id,
          face: <span className="tabular-nums">Sharpe {sharpe}</span>,
          detail: note,
        }))}
      />
    </div>
  )
}

export function TimeMachineStackDemo() {
  const versions = [
    ['v3', '当前', 'Sharpe 1.42 · 最大回撤 -8.3%'],
    ['v2', '2026-11-10', 'Sharpe 1.31 · 最大回撤 -11.0%'],
    ['v1', '2026-11-03', 'Sharpe 1.12 · 最大回撤 -14.6%'],
    ['v0', '2026-10-27', '原型，仅用于验证数据管线'],
  ] as const
  return (
    <div className="gal-wide" style={{ width: 360, height: 280 }}>
      <TimeMachineStack
        label="策略版本史"
        status={(index, total) => `第 ${index + 1} 个，共 ${total} 个`}
        items={versions.map(([id, date, note]) => ({
          id,
          content: (
            <div style={{ padding: 16 }}>
              <strong>{id}</strong> <span style={{ opacity: 0.6 }}>{date}</span>
              <p style={{ margin: '8px 0 0' }}>{note}</p>
            </div>
          ),
        }))}
      />
    </div>
  )
}

export function FloatingNavbarDemo() {
  const scroller = useRef<HTMLDivElement>(null)
  return (
    <div style={{ position: 'relative', width: 460 }} className="gal-wide">
      <div
        ref={scroller}
        style={{ height: 220, overflow: 'auto', border: '1px solid var(--line-100)', borderRadius: 8 }}
        data-testid="floating-scroller"
      >
        <FloatingNavbar
          label="报告章节"
          containerRef={scroller}
          items={[
            { id: 'summary', label: '摘要' },
            { id: 'risk', label: '风险' },
            { id: 'trades', label: '成交' },
          ]}
        />
        <div style={{ padding: '72px 16px 16px', display: 'grid', gap: 16 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} style={{ margin: 0 }}>
              第 {i + 1} 段：回测区间内策略的收益来源、回撤来源与换手的拆解。往下滚时导航条让路，往回滚立刻回来。
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ExpandableNavbarDemo() {
  return (
    <div style={{ minHeight: 190 }}>
      <ExpandableNavbar
        label="工作区"
        width={460}
        items={[
          { id: 'markets', label: '行情', panel: '自选、板块热力图与新闻快讯。' },
          {
            id: 'research',
            label: '研究',
            panel: '回测、因子库与研究笔记：这里放一段比较长的说明，面板高度跟着内容变。',
          },
          { id: 'tools', label: '工具', panel: '数据导入、导出报告。' },
        ]}
      />
    </div>
  )
}

const LOG: TerminalLine[] = [
  { id: '1', type: 'command', text: 'katana backtest momentum --from 2024-01-01' },
  { id: '2', type: 'output', text: '载入 1,248 根日线，覆盖 312 只标的' },
  { id: '3', type: 'comment', text: '# 过滤高波动日' },
  { id: '4', type: 'output', text: '开仓 184 笔，平仓 181 笔' },
  { id: '5', type: 'error', text: '警告：3 只标的停牌，已剔除' },
  { id: '6', type: 'success', text: 'sharpe 1.42  maxdd -8.3%  胜率 54%' },
]

export const MacTerminalDemo = replay((key) => (
  <MacTerminal
    key={key}
    title="backtest"
    labels={{ window: '回测日志回放' }}
    lines={LOG}
    typingSpeed={60}
    className="gal-wide"
  />
))

const scene = (text: string) => (
  <p className="gal-note" style={{ margin: 0 }}>
    {text}
  </p>
)

export function FolderRevealDemo() {
  return (
    <>
      <Row name="悬停或聚焦">
        <FolderReveal
          label="季度报告"
          tone="accent"
          items={['Q1', 'Q2', 'Q3'].map((q) => ({ id: q, content: <div style={{ padding: 8 }}>{q} 回测</div> }))}
        />
        <FolderReveal
          label="因子库"
          tone="up"
          trigger="click"
          size={200}
          items={['动量', '价值'].map((q) => ({ id: q, content: <div style={{ padding: 8 }}>{q}</div> }))}
        />
      </Row>
      {scene('适用：首页、营销页里「一组东西收在一起」的示意；不进交易主界面。')}
    </>
  )
}

export function GlassCardDemo() {
  return (
    <>
      <div
        style={{
          padding: 28,
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--signal-orange-dim), var(--bg-400) 60%, var(--signal-blue))',
        }}
      >
        <GlassCard className="gal-wide">一个工作台装下回测、因子与新闻快讯。移动指针看高光。</GlassCard>
      </div>
      {scene('适用：压在图片或渐变上的首页、营销页卡片；压在纯色底上没有意义，不进交易主界面。')}
    </>
  )
}

export function GlowHoverCardDemo() {
  return (
    <>
      <Row>
        {[
          ['策略实验室', '写、测、比较'],
          ['新闻快讯', '标题进场，不抢眼'],
          ['AI 建议', '每条都要人审'],
        ].map(([t, d]) => (
          <GlowHoverCard key={t} className="gal-wide">
            <strong>{t}</strong>
            <p style={{ margin: '4px 0 0' }}>{d}</p>
          </GlowHoverCard>
        ))}
      </Row>
      {scene('适用：首页的功能入口卡、营销页并排卡片；不进交易主界面。')}
    </>
  )
}

export function GooeyPopoverDemo() {
  return (
    <>
      <div style={{ paddingTop: 110, minHeight: 170 }}>
        <GooeyPopover trigger={<MessageCircle size={18} />} triggerLabel="打开咨询" contentWidth={240}>
          对策略有疑问？在这里问，我们会回到你的邮箱。
        </GooeyPopover>
      </div>
      {scene('适用：首页或营销页的小彩蛋式入口；交易主界面的弹层用 Popover。')}
    </>
  )
}

export function MorphSurfaceDemo() {
  return (
    <>
      <MorphSurface
        pill={
          <>
            <Sparkles size={14} /> 问 AI
          </>
        }
        openLabel="问 AI"
        width={340}
        height={150}
      >
        <div style={{ padding: 12, display: 'grid', gap: 8 }}>
          <strong>问一个关于当前策略的问题</strong>
          <textarea
            aria-label="问题"
            rows={3}
            style={{
              resize: 'none',
              background: 'var(--bg-200)',
              color: 'inherit',
              border: '1px solid var(--line-200)',
              borderRadius: 6,
              padding: 8,
            }}
          />
        </div>
      </MorphSurface>
      {scene('适用：首页、浮在页面一角的「问 AI」入口；交易主界面提问走命令面板或 AI 输入件。')}
    </>
  )
}

export function TiltCardDemo() {
  return (
    <>
      <Row>
        <TiltCard>
          <div style={{ padding: 24, width: 220 }}>
            <div data-tilt-depth="0.6" style={{ fontWeight: 600 }}>
              策略实验室
            </div>
            <div data-tilt-depth="0.2" style={{ opacity: 0.7, marginTop: 6 }}>
              写、测、比较，一处完成。
            </div>
          </div>
        </TiltCard>
        <TiltCard parallax glare={false}>
          <div style={{ padding: 24, width: 220 }}>
            <div data-tilt-depth="0.8" style={{ fontWeight: 600 }}>
              带视差
            </div>
          </div>
        </TiltCard>
      </Row>
      {scene('适用：首页、营销页的功能卡；行情与下单区的东西要稳，不进交易主界面。')}
    </>
  )
}
