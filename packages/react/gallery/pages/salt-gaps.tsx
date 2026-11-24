// SPDX-License-Identifier: MIT
import { Bell, LayoutGrid, Wallet } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Calendar,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Link,
  ListBox,
  Panel,
  Pill,
  SystemStatus,
  type ListBoxGroup,
  type SystemStatusTone,
} from '../../src/index.ts'
import { Row } from './parts.tsx'
import { CalendarEventsRow } from './research-calendar.tsx'

// #104 对照 Salt 补的七件（Pill、SystemStatus、Calendar、ListBox、Link、Card、Panel）的演示。条件、账户、日期、消息都是示例，不是真实数据。

const FILTERS = [
  { id: 'pe', label: 'P/E < 20' },
  { id: 'cap', label: '市值 > 100 亿' },
  { id: 'chg', label: '涨幅 > 3%' },
  { id: 'sector', label: '行业：半导体' },
]

export function PillDemo() {
  const [filters, setFilters] = useState(FILTERS)
  const [edited, setEdited] = useState('无')
  const [live, setLive] = useState(true)
  return (
    <>
      <Row name="可点可关 · 选股器已生效的条件（示例）">
        {filters.map((filter) => (
          <Pill
            key={filter.id}
            data-testid={`pill-${filter.id}`}
            onClick={() => setEdited(filter.label)}
            onDismiss={() => setFilters((list) => list.filter((item) => item.id !== filter.id))}
            dismissLabel={`去掉条件 ${filter.label}`}
          >
            {filter.label}
          </Pill>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setFilters(FILTERS)}>
          重置
        </Button>
      </Row>
      <Row name="点开改的条件">
        <output data-gallery-pill-edit>{edited}</output>
      </Row>
      <Row name="开关 · 带图标 · sm · 禁用">
        <Pill
          selected={live}
          onClick={() => setLive((on) => !on)}
          icon={<Bell aria-hidden />}
          data-testid="pill-toggle"
        >
          到价提醒
        </Pill>
        <Pill size="sm" onDismiss={() => {}} dismissLabel="移除叠加 BTCUSDT">
          BTCUSDT
        </Pill>
        <Pill disabled onClick={() => {}}>
          已停用
        </Pill>
      </Row>
      <p className="gal-note">点条件本体是「改」，点 × 或在本体上按 Backspace / Delete 是「去掉」。条件是示例。</p>
    </>
  )
}

const STATUS_TONES: readonly { tone: SystemStatusTone; title: string; text: string }[] = [
  { tone: 'info', title: '计划维护', text: '周六 02:00–04:00 交易通道停机维护，期间只能看行情、不能下单。' },
  { tone: 'ok', title: '已恢复', text: '行情源已重新连上，数据补齐到 10:31:05。' },
  { tone: 'warn', title: '数据延迟', text: '港股行情延迟 15 分钟。' },
  { tone: 'danger', title: '连接中断', text: '券商通道断开，正在重连（第 3 次）。' },
  { tone: 'neutral', title: '新功能', text: '自选表支持按旗标过滤。' },
]

export function SystemStatusDemo() {
  const [shown, setShown] = useState(true)
  return (
    <>
      {STATUS_TONES.map((item, index) =>
        index === 0 && !shown ? (
          <Button key={item.tone} size="sm" onClick={() => setShown(true)}>
            再显示维护通知
          </Button>
        ) : (
          <SystemStatus
            key={item.tone}
            tone={item.tone}
            title={item.title}
            role="note"
            data-testid={`sysstat-${item.tone}`}
            actions={item.tone === 'danger' ? <Button size="sm">立即重连</Button> : undefined}
            onDismiss={index === 0 ? () => setShown(false) : undefined}
            dismissLabel={index === 0 ? '关闭维护通知' : undefined}
          >
            {item.text}
          </SystemStatus>
        ),
      )}
      <p className="gal-note">
        消息都是示例。演示里 role 传了 note（页面一打开就在）；真实使用时后冒出来的 warn / danger 不传
        role，读屏会马上读。
      </p>
    </>
  )
}

const CALENDAR_LABELS = { previousMonth: '上个月', nextMonth: '下个月' }
// 示例：周末与一个假定的休市日不可选（不是真实的交易日历）。
const HOLIDAY = '2026-11-26'
const isClosed = (day: string) => {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6 || day === HOLIDAY
}

export function CalendarDemo() {
  const [day, setDay] = useState('2026-11-20')
  return (
    <>
      <Row name="选一天 · 周末与休市日不可选（示例）">
        <Calendar
          label="转到日期"
          locale="zh-CN"
          labels={CALENDAR_LABELS}
          value={day}
          onValueChange={setDay}
          unavailable={isClosed}
          min="2026-01-01"
          max="2026-12-31"
        />
        <output data-gallery-calendar>{day || '无'}</output>
      </Row>
      <Row name="周日开头 · en-US · 禁用">
        <Calendar
          label="Go to date"
          locale="en-US"
          labels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
          defaultValue="2026-11-05"
          weekStart="sun"
          disabled
        />
      </Row>
      <CalendarEventsRow />
      <p className="gal-note">
        ← → ↑ ↓ 按天走，PageUp / PageDown 换月，Enter 选；不可选的日子带删除线。休市日 {HOLIDAY} 是示例。
      </p>
    </>
  )
}

const ACCOUNTS: readonly ListBoxGroup[] = [
  {
    id: 'live',
    title: '实盘',
    options: [
      { id: 'a', label: '账户 A', description: '中信 · 普通', icon: <Wallet aria-hidden />, trailing: '182,400.00' },
      { id: 'b', label: '账户 B', description: '中信 · 信用', icon: <Wallet aria-hidden />, trailing: '56,120.50' },
    ],
  },
  {
    id: 'paper',
    title: '模拟',
    options: [
      { id: 'sim', label: '模拟盘', description: '本机', icon: <Wallet aria-hidden />, trailing: '1,000,000.00' },
      { id: 'old', label: '旧模拟盘', description: '已归档', disabled: true },
    ],
  },
]

const LAYOUTS = [
  { id: 'scalp', label: '盯盘四宫格', icon: <LayoutGrid aria-hidden /> },
  { id: 'review', label: '复盘', icon: <LayoutGrid aria-hidden /> },
  { id: 'cn', label: 'A 股盘面', icon: <LayoutGrid aria-hidden /> },
  { id: 'crypto', label: '加密合约', icon: <LayoutGrid aria-hidden /> },
]

export function ListBoxDemo() {
  const [account, setAccount] = useState<string[]>(['a'])
  const [layouts, setLayouts] = useState<string[]>(['scalp', 'cn'])
  const [opened, setOpened] = useState('无')
  return (
    <>
      <Row name="单选 · 分组 · 说明与余额（示例账户）">
        <div style={{ width: 280 }}>
          <ListBox label="选账户" items={ACCOUNTS} value={account} onValueChange={setAccount} bordered />
        </div>
        <output data-gallery-listbox>{account.join(',') || '无'}</output>
      </Row>
      <Row name="多选 · Enter 或双击打开">
        <div style={{ width: 220 }}>
          <ListBox
            label="布局"
            items={LAYOUTS}
            selectionMode="multiple"
            value={layouts}
            onValueChange={setLayouts}
            onAction={setOpened}
            bordered
            maxHeight={120}
          />
        </div>
        <output data-gallery-listbox-multi>{layouts.join(',') || '无'}</output>
        <output data-gallery-listbox-open>{opened}</output>
      </Row>
      <Row name="空">
        <div style={{ width: 220 }}>
          <ListBox label="自选分组" items={[]} emptyLabel="还没有分组" bordered />
        </div>
      </Row>
      <p className="gal-note">
        账户、余额、布局都是示例。↑ ↓ 走，打字跳到以它开头的项，Space 选；多选里 Shift + ↑ ↓ 连选。
      </p>
    </>
  )
}

export function LinkDemo() {
  return (
    <>
      <Row name="正文里">
        <p style={{ margin: 0, maxWidth: 520 }}>
          央行下调存款准备金率 0.5 个百分点（
          <Link href="#/link" external externalLabel="（在新窗口打开）">
            原文
          </Link>
          ），科技股领涨，详见 <Link href="#/link">行业资金流</Link>。
        </p>
      </Row>
      <Row name="secondary · 脚注">
        <Link href="#/link" tone="secondary">
          数据说明
        </Link>
      </Row>
      <p className="gal-note">新闻与链接地址是示例。</p>
    </>
  )
}

export function CardDemo() {
  return (
    <>
      <Row name="secondary（默认）· 头部带动作">
        <Card style={{ width: 280 }} data-testid="card-default">
          <CardHeader>
            <CardTitle>账户 A</CardTitle>
            <CardDescription>中信 · 普通 · 示例</CardDescription>
            <CardAction>
              <Button size="sm" variant="ghost">
                切换
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>可用 182,400.00 · 持仓 6 只</CardContent>
          <CardFooter>
            <Button size="sm">入金</Button>
            <Button size="sm">明细</Button>
          </CardFooter>
        </Card>
      </Row>
      <Row name="primary · tertiary · ghost">
        {(['primary', 'tertiary', 'ghost'] as const).map((variant) => (
          <Card key={variant} variant={variant} style={{ width: 160 }}>
            <CardTitle>{variant}</CardTitle>
            <CardContent>示例内容</CardContent>
          </Card>
        ))}
      </Row>
      <Row name="可点 · 整张卡是一个链接">
        <Card asChild interactive style={{ width: 240 }}>
          <a href="#/card" data-testid="card-link">
            <CardTitle>半导体周报</CardTitle>
            <CardDescription>研报 · 示例</CardDescription>
          </a>
        </Card>
      </Row>
    </>
  )
}

export function PanelDemo() {
  return (
    <>
      <Row name="primary · secondary · tertiary（占满格子的高度）">
        {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
          <div key={variant} style={{ width: 160, height: 96 }}>
            <Panel variant={variant} data-testid={`panel-${variant}`}>
              {variant}
            </Panel>
          </div>
        ))}
      </Row>
    </>
  )
}
