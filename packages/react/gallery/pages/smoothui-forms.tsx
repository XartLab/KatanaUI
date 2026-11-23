// SPDX-License-Identifier: MIT
import { Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  CheckboxGroup,
  CheckboxGroupItem,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  MORPH_ICON_VARIANTS,
  MorphIcon,
  MorphToggle,
  OtpField,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  Toggle,
} from '../../src/index'
import { SwapPanel, type SwapPanelLabels, type SwapQuote, type SwapStatus } from '../../src/blocks'
import { Row } from './parts'

// 表单与输入补件的演示（改自 SmoothUI，MIT）：场景是交易工作台的下单、风控、二次验证。文字与数据都是演示用的。

export function TextareaDemo() {
  return (
    <>
      <Row name="默认">
        <div className="gal-wide">
          <Textarea aria-label="下单备注" placeholder="这笔单子的理由" />
        </div>
      </Row>
      <Row name="sm · 禁用 · 错误">
        <Textarea aria-label="备注 sm" size="sm" rows={2} defaultValue="突破前高后回踩" style={{ width: 180 }} />
        <Textarea aria-label="备注 禁用" disabled rows={2} defaultValue="已锁定" style={{ width: 140 }} />
        <Textarea aria-label="备注 错误" aria-invalid rows={2} defaultValue="" style={{ width: 140 }} />
      </Row>
    </>
  )
}

const ORDER_TYPES = [
  ['market', '市价'],
  ['limit', '限价'],
  ['stop', '止损'],
] as const

export function RadioGroupDemo() {
  const [type, setType] = useState('limit')
  return (
    <>
      <Row name="竖排">
        <RadioGroup value={type} onValueChange={setType} aria-label="委托类型">
          {ORDER_TYPES.map(([value, name]) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`gal-radio-${value}`} />
              <Label htmlFor={`gal-radio-${value}`}>{name}</Label>
            </div>
          ))}
        </RadioGroup>
        <output data-gallery-radio>当前：{type}</output>
      </Row>
      <Row name="横排 · 禁用 · 错误">
        <RadioGroup defaultValue="b" orientation="horizontal" aria-label="方向">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="b" id="gal-radio-h-b" />
            <Label htmlFor="gal-radio-h-b">买入</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="s" id="gal-radio-h-s" />
            <Label htmlFor="gal-radio-h-s">卖出</Label>
          </div>
        </RadioGroup>
        <RadioGroup defaultValue="x" aria-label="禁用组" disabled>
          <RadioGroupItem value="x" aria-label="禁用已选" />
        </RadioGroup>
        <RadioGroup aria-label="错误组">
          <RadioGroupItem value="y" aria-invalid aria-label="错误" />
        </RadioGroup>
      </Row>
    </>
  )
}

export function ToggleDemo() {
  const [follow, setFollow] = useState(true)
  return (
    <Row>
      <Toggle pressed={follow} onPressedChange={setFollow}>
        跟随最新
      </Toggle>
      <Toggle size="sm" defaultPressed>
        均线
      </Toggle>
      <Toggle size="sm">成交量</Toggle>
      <Toggle disabled>禁用</Toggle>
      <Toggle size="icon" aria-label="夜间模式">
        <Moon />
      </Toggle>
    </Row>
  )
}

const MARKETS = [
  ['sh', '沪市主板'],
  ['sz', '深市主板'],
  ['gem', '创业板'],
] as const

export function CheckboxGroupDemo() {
  const [value, setValue] = useState<string[]>(['sh'])
  return (
    <Row>
      <CheckboxGroup aria-label="监控市场" allValues={MARKETS.map(([id]) => id)} value={value} onValueChange={setValue}>
        <CheckboxGroupItem parent>全部市场</CheckboxGroupItem>
        {MARKETS.map(([id, name]) => (
          <CheckboxGroupItem key={id} value={id}>
            {name}
          </CheckboxGroupItem>
        ))}
      </CheckboxGroup>
      <output data-gallery-checkbox-group>已选：{value.join('、') || '无'}</output>
    </Row>
  )
}

export function InputGroupDemo() {
  return (
    <>
      <Row name="前后附件">
        <div className="gal-wide">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>¥</InputGroupText>
            </InputGroupAddon>
            <Input aria-label="限价" placeholder="0.00" defaultValue="1,688.00" />
            <InputGroupAddon align="end">
              <InputGroupText>CNY</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Row>
      <Row name="带按钮 · 禁用 · 错误">
        <InputGroup style={{ width: 200 }}>
          <Input aria-label="数量" defaultValue="500" />
          <InputGroupAddon align="end" className="pr-0.5">
            <Button size="sm" variant="ghost" aria-label="全仓">
              全仓
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup style={{ width: 140 }}>
          <Input aria-label="禁用" disabled defaultValue="锁定" />
        </InputGroup>
        <InputGroup style={{ width: 140 }}>
          <Input aria-label="错误" aria-invalid defaultValue="abc" />
        </InputGroup>
      </Row>
    </>
  )
}

export function OtpFieldDemo() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<'idle' | 'ok' | 'bad'>('idle')
  const verify = (value: string) => setResult(value === '246810' ? 'ok' : 'bad')
  return (
    <>
      <Row name="二次验证（正确码 246810）">
        <div data-gallery-otp>
          <OtpField
            aria-label="下单二次验证码"
            groupSize={3}
            value={code}
            invalid={result === 'bad'}
            onValueChange={(value) => {
              setCode(value)
              setResult('idle')
            }}
            onComplete={verify}
          />
        </div>
        <output data-gallery-otp-result>
          {{ idle: '输入 6 位', ok: '验证通过，放行下单', bad: '验证码错误' }[result]}
        </output>
        <Button
          size="sm"
          onClick={() => {
            setCode('')
            setResult('idle')
          }}
        >
          重来
        </Button>
      </Row>
      <Row name="mask · 4 位字母数字 · 禁用">
        <OtpField aria-label="口令" length={4} mask pattern="alphanumeric" defaultValue="A7" />
        <OtpField aria-label="禁用验证码" disabled defaultValue="123" />
      </Row>
    </>
  )
}

export function MorphToggleDemo() {
  const [live, setLive] = useState(false)
  return (
    <>
      <Row name="morph">
        <label className="gal-label">
          <MorphToggle aria-label="实盘模式" variant="morph" checked={live} onCheckedChange={setLive} />
          实盘模式（{live ? '开' : '关'}）
        </label>
        <label className="gal-label">
          <MorphToggle aria-label="plain" variant="plain" defaultChecked /> plain
        </label>
      </Row>
      <Row name="icon · lg">
        <label className="gal-label">
          <MorphToggle
            aria-label="主题"
            variant="icon"
            size="lg"
            icons={{ on: <Moon size={12} />, off: <Sun size={12} /> }}
          />
          主题
        </label>
        <label className="gal-label">
          <MorphToggle aria-label="禁用" disabled /> 禁用
        </label>
      </Row>
    </>
  )
}

export function MorphIconDemo() {
  const [active, setActive] = useState(false)
  return (
    <>
      <Row name="八个字形">
        {MORPH_ICON_VARIANTS.map((variant) => (
          <Button key={variant} size="icon" aria-label={variant} onClick={() => setActive((value) => !value)}>
            <MorphIcon variant={variant} active={active} size={16} />
          </Button>
        ))}
      </Row>
      <p className="gal-note">点任意一个，八个图标一起在两个形状间补间（线条在动，不是淡入淡出）。</p>
    </>
  )
}

const SWAP_LABELS: SwapPanelLabels = {
  pay: '卖出',
  receive: '买入',
  balance: '可用',
  max: '全部',
  flip: '对调两边',
  chooseAsset: '更换{side}币种，当前 {symbol}',
  rate: '汇率',
  fee: '手续费',
  impact: '价格影响',
  slippage: '最大滑点',
  submit: '确认换汇',
  submitting: '换汇中…',
  retry: '重试',
  expires: '报价有效期',
}
const RATE = { cnhUsd: 0.1382, usdCnh: 7.236 } as const

export function SwapPanelDemo() {
  const [amount, setAmount] = useState('1000')
  const [flipped, setFlipped] = useState(false)
  const [status, setStatus] = useState<SwapStatus>('ready')
  const [quote, setQuote] = useState<SwapQuote>(() => makeQuote(1000, RATE.cnhUsd))
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // 改了数额或对调后重新「报价」：先 quoting（扫光），600ms 后给新报价与 8 秒有效期。
  const requote = (nextAmount: string, nextFlipped: boolean) => {
    setStatus('quoting')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setQuote(makeQuote(Number(nextAmount) || 0, nextFlipped ? RATE.usdCnh : RATE.cnhUsd))
      setStatus('ready')
    }, 600)
  }
  const pair = flipped ? (['USD', 'CNH'] as const) : (['CNH', 'USD'] as const)
  return (
    <Row>
      <SwapPanel
        amount={amount}
        onAmountChange={(next) => {
          setAmount(next)
          requote(next, flipped)
        }}
        from={{ symbol: pair[0], balance: 25000 }}
        to={{ symbol: pair[1] }}
        quote={quote}
        slippage={0.005}
        status={status}
        labels={SWAP_LABELS}
        locale="zh-CN"
        onFlip={() => {
          setFlipped(!flipped)
          requote(amount, !flipped)
        }}
        onSubmit={() => {
          setStatus('submitting')
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => setStatus('ready'), 1200)
        }}
      />
    </Row>
  )
}

function makeQuote(amount: number, rate: number): SwapQuote {
  const output = amount * rate
  // 有效期 8 秒：渲染时不取当前时间，这里在事件里算。
  return { output, rate, fee: output * 0.0008, priceImpact: 0.0012, expiresAt: Date.now() + 8000 }
}
