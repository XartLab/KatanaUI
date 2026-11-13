// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  ScrollArea,
  Separator,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  useFieldControl,
} from '../../src/index'
import { Row } from './parts'

// 分隔线、滚动区、字段、抽屉、悬停卡的演示。文案都是演示用的。

export function SeparatorDemo() {
  return (
    <>
      <Row name="横">
        <div className="gal-wide">
          <span>上面一块</span>
          <Separator data-testid="separator-h" style={{ margin: '8px 0' }} />
          <span>下面一块</span>
        </div>
      </Row>
      <Row name="竖">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 20 }}>
          <span>买</span>
          <Separator orientation="vertical" data-testid="separator-v" />
          <span>卖</span>
          <Separator orientation="vertical" decorative={false} data-testid="separator-semantic" />
          <span>读屏认得的分隔</span>
        </div>
      </Row>
    </>
  )
}

export function ScrollAreaDemo() {
  return (
    <>
      <Row name="竖向">
        <ScrollArea
          style={{ height: 120, width: 220, border: '1px solid var(--line-100)', borderRadius: 6 }}
          data-testid="scroll-area"
        >
          <div style={{ padding: 8 }}>
            {Array.from({ length: 30 }, (_, index) => (
              <div key={index} style={{ height: 24 }}>{`第 ${index + 1} 行`}</div>
            ))}
          </div>
        </ScrollArea>
      </Row>
      <p className="gal-note">滚动条 4px，平时不出现，指到这一块才出一条淡线。Tab 聚焦后方向键、PageDown 也能滚。</p>
    </>
  )
}

function Control({ invalid }: { invalid: boolean }) {
  const control = useFieldControl()
  return <Input placeholder="例如 0.5" defaultValue={invalid ? 'abc' : ''} {...control} />
}

export function FieldDemo() {
  const [invalid, setInvalid] = useState(false)
  return (
    <>
      <Row name="纵向">
        <div className="gal-wide">
          <Field invalid={invalid} data-testid="field">
            <FieldLabel>止损距离</FieldLabel>
            <Control invalid={invalid} />
            <FieldDescription>单位是价格的最小变动价位。</FieldDescription>
            <FieldError>请输入数字。</FieldError>
          </Field>
        </div>
        <Button size="sm" onClick={() => setInvalid((value) => !value)} aria-pressed={invalid}>
          切换出错
        </Button>
      </Row>
      <Row name="横向">
        <div className="gal-wide">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="gal-field-box">下单前确认</FieldLabel>
              <FieldDescription>每一单都弹确认框。</FieldDescription>
            </FieldContent>
            <Checkbox id="gal-field-box" defaultChecked />
          </Field>
        </div>
      </Row>
      <Row name="分组">
        <FieldSet className="gal-wide">
          <FieldLegend>风控</FieldLegend>
          <FieldGroup>
            <Field>
              <Label htmlFor="gal-field-a">日亏损限额</Label>
              <Input id="gal-field-a" defaultValue="500" />
            </Field>
            <FieldSeparator>或</FieldSeparator>
            <Field>
              <Label htmlFor="gal-field-b">日亏损比例</Label>
              <Input id="gal-field-b" defaultValue="2" />
            </Field>
          </FieldGroup>
        </FieldSet>
      </Row>
    </>
  )
}

export function SheetDemo() {
  return (
    <Row name="两边">
      {(['right', 'left'] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button>{side === 'right' ? '右侧抽屉' : '左侧抽屉'}</Button>
          </SheetTrigger>
          <SheetContent side={side} closeLabel="关闭抽屉" data-testid={`sheet-${side}`}>
            <SheetHeader>
              <SheetTitle>{side === 'right' ? '品种详情' : '筛选'}</SheetTitle>
              <SheetDescription>演示用的抽屉内容。</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <Field>
                <FieldLabel>备注</FieldLabel>
                <Control invalid={false} />
              </Field>
            </SheetBody>
            <SheetFooter>
              <SheetClose asChild>
                <Button>取消</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="primary">确定</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Row>
  )
}

export function HoverCardDemo() {
  return (
    <Row name="悬停">
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#/hover-card" data-testid="hover-trigger">
            BTCUSDT.P
          </a>
        </HoverCardTrigger>
        <HoverCardContent data-testid="hover-content">
          <strong>BTCUSDT 永续</strong>
          <p className="gal-note">示例：最小变动价位 0.1，合约乘数 1。</p>
        </HoverCardContent>
      </HoverCard>
    </Row>
  )
}
