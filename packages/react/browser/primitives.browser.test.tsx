// SPDX-License-Identifier: MIT
// 组件截图：src/primitives 里的公开件。演示数据取自 gallery/usage 与 gallery/pages/open.tsx；浮层件用 OpenFrame 摆成打开态。
import { Info } from 'lucide-react'
import { beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarGroup,
  Breadcrumb,
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupItem,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
  MorphToggle,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  OtpField,
  Pagination,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Slider,
  Splitter,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useFieldControl,
} from '../src/index.ts'
import { CardUsage } from '../gallery/usage/CardUsage.tsx'
import { OpenFrame } from './open-frame.tsx'
import { mount } from './render.tsx'

function StopInput() {
  const control = useFieldControl()
  return <Input defaultValue="abc" {...control} />
}

const col = { display: 'flex', flexDirection: 'column', gap: 12, width: 300 } as const

beforeAll(async () => {
  await page.viewport(900, 700)
})

for (const theme of ['graphite', 'console'] as const) {
  const shot = async (name: string, node: React.ReactNode) => {
    await mount(node, theme)
    // 等有限时长的动画与过渡走完再截（Breadcrumb 逐项入场、链接 150ms 换色，CI 忙时截在半路，#190）。
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    )
    await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-${name}`)
  }
  describe(theme, () => {
    test('accordion', () =>
      shot(
        'accordion',
        <div style={col}>
          <Accordion type="single" collapsible defaultValue="source">
            <AccordionItem value="source">
              <AccordionTrigger>Where does the data come from?</AccordionTrigger>
              <AccordionContent>Public market data; the reason is shown when it is unavailable.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="refresh">
              <AccordionTrigger>How often does it refresh?</AccordionTrigger>
              <AccordionContent>Every minute.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>,
      ))
    test('alert', () =>
      shot(
        'alert',
        <div style={col}>
          {(['neutral', 'ok', 'warn', 'danger'] as const).map((tone) => (
            <Alert key={tone} tone={tone}>
              <AlertTitle>Close to the daily loss limit ({tone})</AlertTitle>
              <AlertDescription>80% used; trading locks at 100%.</AlertDescription>
            </Alert>
          ))}
        </div>,
      ))
    test('avatar', () =>
      shot(
        'avatar',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Avatar alt="Alice Chen" fallback="AC" size="sm" />
            <Avatar alt="Bo Wang" fallback="BW" size="md" status="online" statusLabel="Online" />
            <Avatar alt="Cai Li" fallback="CL" size="lg" status="away" statusLabel="Away" />
            <Avatar alt="Dan Zhao" fallback="DZ" status="busy" statusLabel="Busy" />
          </div>
          <AvatarGroup label="Strategy reviewers" max={3} size="md" overflowLabel={(count) => `${count} more`}>
            <Avatar alt="Alice Chen" fallback="AC" status="online" statusLabel="Online" />
            <Avatar alt="Bo Wang" fallback="BW" />
            <Avatar alt="Cai Li" fallback="CL" status="away" statusLabel="Away" />
            <Avatar alt="Dan Zhao" fallback="DZ" />
          </AvatarGroup>
        </div>,
      ))
    test('breadcrumb', () =>
      shot(
        'breadcrumb',
        <Breadcrumb
          label="Location"
          items={[{ label: 'Strategies', href: '#' }, { label: 'Momentum', href: '#' }, { label: 'Backtest 2026-11' }]}
        />,
      ))
    test('button', () =>
      shot(
        'button',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="primary">Primary</Button>
            <Button>Default</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="icon" aria-label="Info">
              <Info />
            </Button>
          </div>
        </div>,
      ))
    test('card', () => shot('card', <CardUsage />))
    test('checkbox', () =>
      shot(
        'checkbox',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Checkbox aria-label="Checked" defaultChecked />
            <Checkbox aria-label="Unchecked" />
            <Checkbox aria-label="Mixed" checked="indeterminate" />
            <Checkbox aria-label="Disabled" disabled defaultChecked />
          </div>
          <CheckboxGroup aria-label="Markets" allValues={['sh', 'sz', 'bj']} defaultValue={['sh']}>
            <CheckboxGroupItem parent>All markets</CheckboxGroupItem>
            {['sh', 'sz', 'bj'].map((market) => (
              <CheckboxGroupItem key={market} value={market}>
                {market.toUpperCase()}
              </CheckboxGroupItem>
            ))}
          </CheckboxGroup>
        </div>,
      ))
    test('collapsible', () =>
      shot(
        'collapsible',
        <div style={col}>
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Advanced parameters</CollapsibleTrigger>
            <CollapsibleContent>Slippage, commission and the rebalance calendar.</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Closed section</CollapsibleTrigger>
            <CollapsibleContent>Hidden.</CollapsibleContent>
          </Collapsible>
        </div>,
      ))
    test('command', () =>
      shot(
        'command',
        <div style={{ width: 320 }}>
          <Command label="Commands">
            <CommandInput placeholder="Search commands" />
            <CommandList aria-label="Commands">
              <CommandEmpty>No matching command</CommandEmpty>
              <CommandItem value="trend-line">Trend line</CommandItem>
              <CommandItem value="fib">Fibonacci retracement</CommandItem>
            </CommandList>
          </Command>
        </div>,
      ))
    test('context-menu', async () => {
      await mount(
        <OpenFrame width={260} height={200}>
          <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>
              <div>Right-click here</div>
            </ContextMenuTrigger>
            <ContextMenuContent aria-label="Panel menu">
              <ContextMenuLabel>Panel</ContextMenuLabel>
              <ContextMenuItem>
                Clone panel <ContextMenuShortcut>C</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem disabled>Disabled item</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem checked>Show grid</ContextMenuCheckboxItem>
            </ContextMenuContent>
          </ContextMenu>
        </OpenFrame>,
        theme,
      )
      document
        .querySelector(
          '[data-testid="frame"] [data-slot="context-menu-trigger"], [data-testid="frame"] .shot-open > div',
        )!
        .dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 20, clientY: 20 }),
        )
      await new Promise((r) => setTimeout(r, 500))
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-context-menu`)
    })
    test('dialog', () =>
      shot(
        'dialog',
        <OpenFrame width={620} height={260}>
          <Dialog open modal={false}>
            <DialogContent closeLabel="Close">
              <DialogHeader>
                <DialogTitle>Reset layout</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <DialogDescription>Widgets you added will be removed.</DialogDescription>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary">Reset</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </OpenFrame>,
      ))
    test('alert-dialog', () =>
      shot(
        'alert-dialog',
        <OpenFrame width={620} height={260}>
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close BTCUSDT long</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogBody>
                <AlertDialogDescription>Sells 0.250 contracts at market. This cannot be undone.</AlertDialogDescription>
              </AlertDialogBody>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="danger">Close position</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </OpenFrame>,
      ))
    test('dropdown-menu', () =>
      shot(
        'dropdown-menu',
        <OpenFrame width={260} height={240}>
          <DropdownMenu open modal={false}>
            <DropdownMenuTrigger asChild>
              <Button>Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Board</DropdownMenuLabel>
              <DropdownMenuItem>
                Add widget <DropdownMenuShortcut>A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Disabled item</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Show grid</DropdownMenuCheckboxItem>
              <DropdownMenuItem variant="danger">Delete board</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </OpenFrame>,
      ))
    test('field', () =>
      shot(
        'field',
        <div style={col}>
          <Field invalid>
            <FieldLabel>Stop distance</FieldLabel>
            <StopInput />
            <FieldDescription>In price ticks.</FieldDescription>
            <FieldError>Enter a number.</FieldError>
          </Field>
          <Field>
            <FieldLabel>Valid field</FieldLabel>
            <StopInput />
            <FieldDescription>In price ticks.</FieldDescription>
          </Field>
        </div>,
      ))
    test('hover-card', () =>
      shot(
        'hover-card',
        <OpenFrame width={300} height={120}>
          <HoverCard open>
            <HoverCardTrigger asChild>
              <a href="#/hover-card" className="text-ink underline">
                BTCUSDT.P
              </a>
            </HoverCardTrigger>
            <HoverCardContent align="start">Perpetual swap, tick size 0.1.</HoverCardContent>
          </HoverCard>
        </OpenFrame>,
      ))
    test('input', () =>
      shot(
        'input',
        <div style={col}>
          <Input aria-label="Quantity" placeholder="0.00" />
          <Input aria-label="Filled" defaultValue="1,250.00" />
          <Input aria-label="Disabled" disabled defaultValue="Disabled" />
          <Input aria-label="Invalid" aria-invalid defaultValue="abc" />
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>¥</InputGroupText>
            </InputGroupAddon>
            <Input aria-label="Limit price" placeholder="0.00" />
            <InputGroupAddon align="end">
              <InputGroupText>CNY</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <Textarea aria-label="Order note" placeholder="Why this entry" rows={3} />
        </div>,
      ))
    test('label', () =>
      shot(
        'label',
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Checkbox id="shot-label" defaultChecked />
          <Label htmlFor="shot-label">Confirm before ordering</Label>
        </div>,
      ))
    // Open menu content is positioned by Radix inside the bar and does not lay out in flow; the closed bar is captured instead.
    test('menubar', () =>
      shot(
        'menubar',
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New strategy</MenubarItem>
              <MenubarItem>Import data</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Export report</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="view">
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Compact rows</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>,
      ))
    test('morph-toggle', () =>
      shot(
        'morph-toggle',
        <>
          <MorphToggle aria-label="On" variant="morph" defaultChecked />
          <MorphToggle aria-label="Off" variant="morph" />
        </>,
      ))
    // The open viewport animates its content in and is not stable; the closed bar is captured instead.
    test('navigation-menu', () =>
      shot(
        'navigation-menu',
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem value="markets">
              <NavigationMenuTrigger>Markets</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Watchlist</NavigationMenuLink>
                <NavigationMenuLink href="#">Sector heatmap</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="research">
              <NavigationMenuTrigger>Research</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">Backtests</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      ))
    test('otp-field', () =>
      shot('otp-field', <OtpField aria-label="Trade verification code" length={6} groupSize={3} defaultValue="123" />))
    test('pagination', () =>
      shot(
        'pagination',
        <Pagination
          page={5}
          totalPages={20}
          onPageChange={() => {}}
          labels={{ nav: 'Pagination', previous: 'Previous', next: 'Next', page: (n) => `Go to page ${n}` }}
        />,
      ))
    test('popover', () =>
      shot(
        'popover',
        <OpenFrame width={320} height={160}>
          <Popover open>
            <PopoverTrigger asChild>
              <Button>Details</Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <PopoverHeader>
                <PopoverTitle>Data scope</PopoverTitle>
                <PopoverDescription>The default trading day is the latest one.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </OpenFrame>,
      ))
    test('progress', () =>
      shot(
        'progress',
        <div style={col}>
          <Progress aria-label="Import progress" value={60} />
          <Progress aria-label="Done" value={100} />
          <Progress aria-label="Empty" value={0} />
        </div>,
      ))
    test('radio-group', () =>
      shot(
        'radio-group',
        <RadioGroup defaultValue="limit" aria-label="Order type">
          {['market', 'limit', 'stop'].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <RadioGroupItem value={type} id={`order-${type}`} />
              <Label htmlFor={`order-${type}`}>{type}</Label>
            </div>
          ))}
        </RadioGroup>,
      ))
    test('scroll-area', () =>
      shot(
        'scroll-area',
        <ScrollArea style={{ height: 120, width: 200 }}>
          {Array.from({ length: 30 }, (_, index) => (
            <div key={index}>{`Row ${index + 1}`}</div>
          ))}
        </ScrollArea>,
      ))
    test('select', () =>
      shot(
        'select',
        <OpenFrame width={220} height={160}>
          <Select open value="candles">
            <SelectTrigger aria-label="Chart type" style={{ width: 160 }}>
              <SelectValue>Candles</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="candles">Candles</SelectItem>
              <SelectItem value="bars">Bars</SelectItem>
            </SelectContent>
          </Select>
        </OpenFrame>,
      ))
    test('separator', () =>
      shot(
        'separator',
        <div style={{ width: 200 }}>
          <span>Above</span>
          <Separator />
          <span>Below</span>
        </div>,
      ))
    test('sheet', () =>
      shot(
        'sheet',
        <OpenFrame width={520} height={260}>
          <Sheet open modal={false}>
            <SheetContent side="right" closeLabel="Close">
              <SheetHeader>
                <SheetTitle>Symbol details</SheetTitle>
                <SheetDescription>Details of the selected symbol.</SheetDescription>
              </SheetHeader>
              <SheetBody>Body</SheetBody>
            </SheetContent>
          </Sheet>
        </OpenFrame>,
      ))
    test('slider', () =>
      shot(
        'slider',
        <div style={col}>
          <Slider thumbLabels={['Opacity']} value={[40]} onValueChange={() => {}} min={0} max={100} />
          <Slider thumbLabels={['Low', 'High']} value={[20, 70]} onValueChange={() => {}} min={0} max={100} />
          <Slider thumbLabels={['Disabled']} value={[50]} onValueChange={() => {}} min={0} max={100} disabled />
        </div>,
      ))
    test('splitter', () =>
      shot(
        'splitter',
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.4fr) 8px minmax(0, 0.6fr)',
            width: 420,
            height: 120,
          }}
        >
          <div style={{ background: 'var(--bg-200)' }}>40%</div>
          <Splitter
            axis="row"
            ratio={0.4}
            minFirst={80}
            minSecond={80}
            onPreview={() => {}}
            onChange={() => {}}
            label="Resize panes"
            valueText={(value) => `First pane ${Math.round(value * 100)}%`}
          />
          <div style={{ background: 'var(--bg-200)' }}>60%</div>
        </div>,
      ))
    test('switch', () =>
      shot(
        'switch',
        <>
          <Switch aria-label="On" defaultChecked />
          <Switch aria-label="Off" />
          <Switch aria-label="Disabled" disabled defaultChecked />
        </>,
      ))
    test('tabs', () =>
      shot(
        'tabs',
        <div style={{ width: 260 }}>
          <Tabs defaultValue="gainers">
            <TabsList>
              <TabsTrigger value="gainers">Gainers</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
            </TabsList>
            <TabsContent value="gainers">Top gainers</TabsContent>
            <TabsContent value="volume">Top by volume</TabsContent>
          </Tabs>
        </div>,
      ))
    test('toggle', () =>
      shot(
        'toggle',
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Toggle defaultPressed>Follow latest</Toggle>
            <Toggle>Idle</Toggle>
          </div>
          <ToggleGroup aria-label="Timeframe" value="d" onValueChange={() => {}}>
            <ToggleGroupItem value="d">Day</ToggleGroupItem>
            <ToggleGroupItem value="w">Week</ToggleGroupItem>
            <ToggleGroupItem value="m">Month</ToggleGroupItem>
          </ToggleGroup>
        </div>,
      ))
    test('tooltip', () =>
      shot(
        'tooltip',
        <OpenFrame width={300} height={100}>
          <TooltipProvider>
            <Tooltip open>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Info">
                  <Info />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fill ratio = filled / touched</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </OpenFrame>,
      ))
  })
}
