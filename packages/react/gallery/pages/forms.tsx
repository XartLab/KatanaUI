// SPDX-License-Identifier: MIT
import { Plus } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox,
  Input,
  MultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from '../../src/index'
import { Row } from './parts'

// 表单控件的演示：每个件的各个状态摆开。悬停、按下、键盘焦点三个瞬时状态没法静态摆出来：直接用鼠标和 Tab 键去碰页上的件，
// e2e/ui-gallery.spec.ts 量它们的计算样式。数据和文案都是演示用的。

const VARIANTS = ['default', 'primary', 'danger', 'ghost', 'link'] as const
const TIMEFRAMES = [
  ['d', '日'],
  ['w', '周'],
  ['m', '月'],
] as const
const COLUMNS = [
  ['name', '名称'],
  ['value', '值'],
  ['line', '线形图'],
  ['volume', 'Volume'],
] as const

// 主题 × 密度（#1943）：主题用页头切换，密度用 data-density 挂在容器上；同一组按钮读同一批 characteristics，高度与内距随档变。
const DENSITY_VARIANTS = ['default', 'primary', 'ghost', 'danger', 'link'] as const
const DENSITIES = [
  ['high', '26'],
  ['medium', '30'],
  ['low', '36'],
] as const

export function ButtonDemo() {
  return (
    <>
      {VARIANTS.map((variant) => (
        <Row key={variant} name={variant}>
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
        </Row>
      ))}
      {DENSITIES.map(([density, height]) => (
        <div key={density} className="gal-row" data-density={density}>
          <span className="gal-cap">
            {density} · {height}
          </span>
          {DENSITY_VARIANTS.map((variant) => (
            // 可访问名带上档名（字在前，符合「标签含可见文字」）：免得与上面变体行里的同名按钮混成一个。
            <Button key={variant} variant={variant} aria-label={`${variant} · ${density}`}>
              {variant}
            </Button>
          ))}
          <Button variant="icon" size="icon" aria-label={`icon · ${density}`}>
            <Plus />
          </Button>
        </div>
      ))}
      <Row name="icon / 带图标">
        <Button variant="icon" size="icon" aria-label="图标按钮">
          <Plus />
        </Button>
        <Button variant="icon" size="icon" disabled aria-label="图标按钮 禁用">
          <Plus />
        </Button>
        <Button>
          <Plus />
          带图标
        </Button>
      </Row>
      <Row name="effect（SmoothUI）">
        <Button effect="magnetic" variant="primary" data-gallery-magnet>
          买入 600519
        </Button>
        <Button effect="dot-morph" data-gallery-dot>
          新建委托
        </Button>
        <Button effect="clip-corners" variant="primary" data-gallery-clip>
          一键平仓
        </Button>
      </Row>
    </>
  )
}

export function InputDemo() {
  return (
    <>
      <Row>
        <Input aria-label="输入" placeholder="默认" style={{ width: 160 }} />
        <Input aria-label="输入 sm" size="sm" placeholder="sm" style={{ width: 120 }} />
        <Input aria-label="输入 禁用" disabled defaultValue="禁用" style={{ width: 120 }} />
        <Input aria-label="输入 有值" defaultValue="1,234.50" style={{ width: 120 }} />
      </Row>
      <Row name="floatingLabel">
        <div data-gallery-float style={{ width: 180 }}>
          <Input floatingLabel="限价" />
        </div>
        <div style={{ width: 140 }}>
          <Input floatingLabel="数量" size="sm" defaultValue="500" />
        </div>
        <div style={{ width: 140 }}>
          <Input floatingLabel="止损价" aria-invalid defaultValue="abc" />
        </div>
      </Row>
    </>
  )
}

export function SelectDemo() {
  const [kind, setKind] = useState('line')
  return (
    <Row>
      <Select value={kind} onValueChange={setKind}>
        <SelectTrigger aria-label="图表类型" style={{ width: 160 }}>
          <SelectValue>{{ line: '折线', candles: 'K 线', bars: '美国线' }[kind]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line">折线</SelectItem>
          <SelectItem value="candles">K 线</SelectItem>
          <SelectItem value="bars">美国线</SelectItem>
        </SelectContent>
      </Select>
      <Select value="">
        <SelectTrigger aria-label="还没选" style={{ width: 160 }}>
          <SelectValue placeholder="还没选" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">甲</SelectItem>
        </SelectContent>
      </Select>
      <Select value="a" disabled>
        <SelectTrigger aria-label="禁用的下拉" style={{ width: 160 }}>
          <SelectValue>甲</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">甲</SelectItem>
        </SelectContent>
      </Select>
    </Row>
  )
}

export function MultiSelectDemo() {
  const [columns, setColumns] = useState<string[]>(['name'])
  return (
    <Row>
      <MultiSelect
        values={columns}
        options={COLUMNS}
        onValuesChange={setColumns}
        empty="隐藏"
        label="显示的列"
        separator="、"
        width={160}
      />
    </Row>
  )
}

export function CheckboxDemo() {
  const [drawn, setDrawn] = useState(true)
  return (
    <>
      <Row>
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
      </Row>
      <Row name="indicator=check">
        <label className="gal-label">
          <Checkbox
            indicator="check"
            checked={drawn}
            onCheckedChange={(next) => setDrawn(next === true)}
            aria-label="描边勾"
            data-gallery-draw
          />{' '}
          描边勾
        </label>
        <label className="gal-label">
          <Checkbox indicator="check" checked="indeterminate" aria-label="半选" /> 半选
        </label>
        <label className="gal-label">
          <Checkbox checked="indeterminate" aria-label="半选方块" /> 半选（默认符号）
        </label>
        <Button size="sm" onClick={() => setDrawn((value) => !value)}>
          重播
        </Button>
      </Row>
    </>
  )
}

export function SwitchDemo() {
  const [on, setOn] = useState(true)
  return (
    <Row>
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
    </Row>
  )
}

export function ToggleGroupDemo() {
  const [timeframe, setTimeframe] = useState<string | null>('d')
  const [toolbar, setToolbar] = useState<string | null>('w')
  return (
    <Row>
      <ToggleGroup value={timeframe} onValueChange={setTimeframe} aria-label="周期（设置页样式）">
        {TIMEFRAMES.map(([id, text]) => (
          <ToggleGroupItem key={id} value={id}>
            {text}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem value="off" disabled>
          禁用
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup size="sm" value={toolbar} onValueChange={setToolbar} aria-label="周期（工具条样式）">
        {TIMEFRAMES.map(([id, text]) => (
          <ToggleGroupItem key={id} value={id}>
            {text}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Row>
  )
}

export function SliderDemo() {
  const [volume, setVolume] = useState(40)
  const [committed, setCommitted] = useState(40)
  const [range, setRange] = useState([20, 70])
  return (
    <Row>
      <div className="gal-slider">
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={10}
          thumbLabels={['音量']}
          onValueChange={(next) => setVolume(next[0])}
          onValueCommit={(next) => setCommitted(next[0])}
        />
        <output data-testid="slider-value">{volume}</output>
        <output data-testid="slider-committed">{committed}</output>
      </div>
      <div className="gal-slider">
        <Slider value={range} min={0} max={100} thumbLabels={['起', '止']} onValueChange={(next) => setRange(next)} />
      </div>
      <div className="gal-slider">
        <Slider value={[30]} disabled thumbLabels={['禁用的滑块']} onValueChange={() => {}} />
      </div>
    </Row>
  )
}
