// SPDX-License-Identifier: AGPL-3.0-only
import { Info, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../src/index'

// 组件框架的样板间：每个件的各个状态摆在一页上，改 token 或件的样子在这页一眼看全（配合开发服务器的 token 热更新）。
// 悬停、按下、键盘焦点三个瞬时状态没法静态摆出来：直接用鼠标和 Tab 键去碰页上的件，e2e/ui-gallery.spec.ts 量它们的计算样式。
// 数据和文案都是演示用的。

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="gal-sec" data-gallery={id} aria-label={title}>
      <h2>{title}</h2>
      {children}
      {note ? <p className="gal-note">{note}</p> : null}
    </section>
  )
}

const VARIANTS = ['default', 'primary', 'danger', 'ghost', 'link'] as const

function Buttons() {
  return (
    <Section
      id="button"
      title="Button 按钮"
      note="变体 × 默认 / 禁用；悬停提亮、按下再深一档并缩到 0.97，Tab 到它有焦点环。"
    >
      {VARIANTS.map((variant) => (
        <div className="gal-row" key={variant}>
          <Button variant={variant}>{variant}</Button>
          <Button variant={variant} disabled>
            {variant} 禁用
          </Button>
          <Button variant={variant} size="sm">
            {variant} sm
          </Button>
          <Button variant={variant} size="icon" aria-label={`${variant} 图标`}>
            <Plus />
          </Button>
        </div>
      ))}
    </Section>
  )
}

function Boxes() {
  const [on, setOn] = useState(true)
  return (
    <Section
      id="checkbox-switch"
      title="Checkbox 勾选 · Switch 开关"
      note="选中 / 未选中 / 禁用 / 错误（aria-invalid）。"
    >
      <div className="gal-row">
        <label className="gal-label">
          <Checkbox aria-label="未勾" /> 未勾
        </label>
        <label className="gal-label">
          <Checkbox defaultChecked aria-label="已勾" /> 已勾
        </label>
        <label className="gal-label">
          <Checkbox disabled aria-label="禁用" /> 禁用
        </label>
        <label className="gal-label">
          <Checkbox disabled defaultChecked aria-label="禁用已勾" /> 禁用已勾
        </label>
        <label className="gal-label">
          <Checkbox aria-invalid aria-label="错误" /> 错误
        </label>
      </div>
      <div className="gal-row">
        <label className="gal-label">
          <Switch checked={on} onCheckedChange={setOn} aria-label="受控开关" /> 受控（{on ? '开' : '关'}）
        </label>
        <label className="gal-label">
          <Switch aria-label="关" /> 关
        </label>
        <label className="gal-label">
          <Switch defaultChecked aria-label="开" /> 开
        </label>
        <label className="gal-label">
          <Switch disabled aria-label="禁用关" /> 禁用关
        </label>
        <label className="gal-label">
          <Switch disabled defaultChecked aria-label="禁用开" /> 禁用开
        </label>
      </div>
    </Section>
  )
}

function Overlays() {
  const [grid, setGrid] = useState(true)
  const [mode, setMode] = useState('normal')
  return (
    <Section
      id="overlays"
      title="Tooltip 提示 · Popover 弹层 · Dialog 对话框 · DropdownMenu 菜单"
      note="菜单：↓ 走到「更多」按 → 开二级菜单、← 关；二级菜单最多一层。"
    >
      <TooltipProvider>
        <div className="gal-row">
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="说明">
                <Info />
              </Button>
            </TooltipTrigger>
            <TooltipContent>封板率 = 封住的 ÷ 触及涨停的</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button>弹层</Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <PopoverHeader>
                <PopoverTitle>取数口径</PopoverTitle>
                <PopoverDescription>交易日没选时，按数据集默认的最近一个交易日取。</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <Dialog>
            <DialogTrigger asChild>
              <Button>对话框</Button>
            </DialogTrigger>
            <DialogContent closeLabel="关闭">
              <DialogHeader>
                <DialogTitle>恢复默认布局</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <DialogDescription>这块看板会回到模板的排法，你加的格子会被移除。</DialogDescription>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>取消</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary">恢复</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>菜单</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>看板</DropdownMenuLabel>
              <DropdownMenuItem>
                添加组件 <DropdownMenuShortcut>A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>编辑布局</DropdownMenuItem>
              <DropdownMenuItem disabled>已禁用的一项</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
                显示网格
              </DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
                <DropdownMenuRadioItem value="normal">正常</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dense">紧凑</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>更多</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>导出为图片</DropdownMenuItem>
                  <DropdownMenuItem>导出为 CSV</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem variant="danger">删除看板</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </Section>
  )
}

function Navigation() {
  return (
    <Section
      id="tabs-accordion"
      title="Tabs 页签 · Accordion 折叠"
      note="页签的选中块是一块跟着滑的底（弹簧）；折叠高度从 0 长出来。"
    >
      <div className="gal-row">
        <Tabs defaultValue="gainers">
          <TabsList>
            <TabsTrigger value="gainers">涨幅榜</TabsTrigger>
            <TabsTrigger value="amount">成交额榜</TabsTrigger>
            <TabsTrigger value="turnover">换手榜</TabsTrigger>
            <TabsTrigger value="off" disabled>
              已禁用
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gainers">涨幅榜的内容</TabsContent>
          <TabsContent value="amount">成交额榜的内容</TabsContent>
          <TabsContent value="turnover">换手榜的内容</TabsContent>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">日线</TabsTrigger>
            <TabsTrigger value="b">周线</TabsTrigger>
          </TabsList>
          <TabsContent value="a">日线的内容</TabsContent>
          <TabsContent value="b">周线的内容</TabsContent>
        </Tabs>
      </div>
      <Accordion type="single" collapsible defaultValue="a" className="gal-wide">
        <AccordionItem value="a">
          <AccordionTrigger>数据从哪来</AccordionTrigger>
          <AccordionContent>A 股公开数据连接，取不到时写原因，不放样本数据。</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>多久更新一次</AccordionTrigger>
          <AccordionContent>盘中按数据集各自的间隔刷新，盘后停在收盘。</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  )
}

export function Gallery({ theme }: { theme: 'console' | 'graphite' }) {
  return (
    <main className="gal" data-gallery-theme={theme}>
      <header className="gal-head">
        <h1>@katanaview/ui</h1>
        <p>组件框架展示页 · {theme === 'console' ? 'Console' : 'Graphite'} · 演示数据</p>
      </header>
      <Buttons />
      <Boxes />
      <Overlays />
      <Navigation />
    </main>
  )
}
