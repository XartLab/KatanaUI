// SPDX-License-Identifier: MIT
import { selfHosted } from '@katana-ui/logos'
import { LogoProvider } from '@katana-ui/logos/react'
import { web3icons } from '@katana-ui/logos/web3icons'
import { type ReactNode, useState } from 'react'
import {
  BadgeGroup,
  DotMatrix,
  Kbd,
  Lcd,
  Led,
  LINK_GROUPS,
  RollingText,
  SymbolMark,
  Tag,
  type Severity,
  type SeverityExt,
} from '../../src/index.ts'
import { LiveToggle } from '../LiveToggle.tsx'
import { randomWalk, useLiveTicker } from '../live-sim.ts'
import { LiveLedLcdDemo } from './live-readouts.tsx'
import { Cell, Row, SAMPLE_MARK_SRC } from './parts.tsx'

// KATANA 自有的读数件的演示（#1860 从 src/ui 搬进包）：状态灯、LCD 读数、点阵、滚动数字、徽标、快捷键方块。数据和文案都是演示用的。

const LED_TONES: readonly SeverityExt[] = ['off', 'accent', 'ok', 'warn', 'danger']

export function LedDemo() {
  return (
    <>
      <Row name="状态">
        {LED_TONES.map((tone) => (
          <Cell key={tone} name={tone}>
            <Led tone={tone} label={`状态 ${tone}`} />
          </Cell>
        ))}
      </Row>
      <Row name="联动组">
        {LINK_GROUPS.map((group) => (
          <Cell key={group} name={`组 ${group}`}>
            <Led group={group} label={`联动组 ${group}`} />
          </Cell>
        ))}
      </Row>
      <Row name="形态">
        <Cell name="hollow">
          <Led hollow tone="ok" label="空心灯" />
        </Cell>
        <Cell name="bare">
          <Led bare label="旁边没有文字的熄灭灯" />
        </Cell>
        <Cell name="small">
          <Led small tone="accent" label="小灯" />
        </Cell>
      </Row>
      <LiveLedLcdDemo />
    </>
  )
}

export function LcdDemo() {
  return (
    <>
      <Row name="色调">
        <Lcd label="PNL" value="+1,284.50" tone="up" />
        <Lcd label="DD" value="-3.2%" tone="down" />
        <Lcd label="LAST" value="106,977.4" />
        <Lcd label="FOCUS" value="12" tone="accent" />
        <Lcd label="WARN" value="0.82" tone="warn" />
        <Lcd label="LAST" value={null} />
      </Row>
      <Row name="小字">
        <Lcd label="PNL" value="+1,284.50" tone="up" note="USDT · 今日" />
      </Row>
      <Row name="inline">
        <Lcd label="BID" value="106,969.4" inline />
        <Lcd label="ASK" value="106,977.4" inline />
      </Row>
      <div className="gal-wide">
        <Lcd label="FILL" value="撑满所在的格子" fill />
      </div>
      <LiveLedLcdDemo />
    </>
  )
}

export function DotMatrixDemo() {
  return (
    <svg width="220" height="72" role="img" aria-label="点阵纹理的演示">
      <defs>
        <DotMatrix id="gal-dots-default" />
        <DotMatrix id="gal-dots-deep" color="var(--k-heat-5)" />
      </defs>
      <rect x="0" y="0" width="100" height="72" fill="url(#gal-dots-default)" />
      <rect x="120" y="0" width="100" height="72" fill="url(#gal-dots-deep)" />
    </svg>
  )
}

const fmt2 = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 报价实时跳动：个位先转、十位随后（stagger），带边的格子（boxed）；暂停时「步进」按钮与 window.__liveStep 各走一步。 */
function QuoteFlowRows() {
  const { state } = useLiveTicker({ price: 187.42, qty: 998 }, (s, rng) => ({
    price: randomWalk(s.price, rng, 0.004),
    // 数量偶尔跨过 999 到 1,000：看位数变化（resize）。
    qty: Math.max(990, s.qty + Math.round((rng() - 0.45) * 6)),
  }))
  return (
    <>
      <Row name="报价 stagger">
        <output data-gallery-quote-stagger style={{ fontSize: 'var(--text-lcd)' }}>
          <RollingText text={fmt2(state.price)} value={state.price} animate stagger={60} />
        </output>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </Row>
      <Row name="计数 boxed">
        <output data-gallery-quote-boxed>
          <RollingText text={String(Math.round(state.price))} value={state.price} animate boxed stagger={60} />
        </output>
      </Row>
      <Row name="位数 resize">
        <output data-gallery-quote-resize>
          <RollingText text={state.qty.toLocaleString('en-US')} value={state.qty} animate resize />
        </output>
      </Row>
    </>
  )
}

export function RollingTextDemo() {
  const [value, setValue] = useState(106977.4)
  const [codeIndex, setCodeIndex] = useState(0)
  const code = ['AAPL.US', 'TSLA.US', 'NVDA.US', 'MSFT.US'][codeIndex % 4]!
  const text = value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <>
      <Row name="价格">
        <output data-gallery-price>
          <RollingText text={text} value={value} animate />
        </output>
      </Row>
      <Row>
        <button type="button" onClick={() => setValue((v) => v + 8)}>
          涨 8
        </button>
        <button type="button" onClick={() => setValue((v) => v - 8)}>
          跌 8
        </button>
        <button type="button" onClick={() => setValue((v) => v + 0.2)}>
          涨 0.2
        </button>
      </Row>
      <Row name="代码 ramp=4">
        <output data-gallery-code>
          <RollingText text={code} value={codeIndex} animate ramp={4} />
        </output>
        <button type="button" onClick={() => setCodeIndex((i) => i + 1)}>
          换代码
        </button>
      </Row>
      <QuoteFlowRows />
      <p className="gal-note">
        变了的那几位像里程表一样把中间的数字依次转过去，涨往上、跌往下，整串闪一下涨色或跌色；距上次滚动不到 1
        秒直接换字。
      </p>
    </>
  )
}

export function BadgeDemo() {
  return (
    <>
      <Row name="板块">
        <span>
          科创正股
          <BadgeGroup items={[{ id: 'star', label: '科', text: '科创板：涨跌幅 20%' }]} />
        </span>
      </Row>
      <Row name="多个">
        <span>
          某某退市
          <BadgeGroup
            items={[
              { id: 'st', label: 'ST', text: '风险警示：涨跌幅 5%' },
              { id: 'delist', label: '退', text: '退市整理期' },
            ]}
          />
        </span>
      </Row>
      <Row name="没有徽标">
        <span>
          主板正股
          <BadgeGroup items={[]} />
        </span>
      </Row>
    </>
  )
}

export function KbdDemo() {
  return (
    <>
      <Row name="组合">
        <Kbd parts={['Ctrl', 'Shift', 'H']} label="Ctrl+Shift+H" />
        <Kbd parts={['⌘', 'K']} label="Command+K" />
      </Row>
      <Row name="单键">
        <Kbd parts={['Esc']} label="Esc" />
        <Kbd parts={['+']} label="+" />
      </Row>
    </>
  )
}

export function SymbolMarkDemo() {
  return (
    <>
      <Row name="字母">
        <SymbolMark symbol="AAPL" name="Apple" />
        <SymbolMark symbol="600519" name="贵州茅台" />
        <SymbolMark symbol="00700" name="腾讯控股" />
        <SymbolMark symbol="BTCUSDT" name="Bitcoin" />
      </Row>
      <Row name="有图">
        <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} />
        <SymbolMark symbol="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} size="md" />
      </Row>
      <Row name="加载失败">
        <SymbolMark symbol="ETH" name="Ethereum" src="data:image/png;base64,broken" />
      </Row>
      <p className="gal-note">示意图标：自绘的 SVG，演示有图的样子；不是任何真实币种或公司的标志。</p>
      <SymbolMarkLogosDemo />
    </>
  )
}

// 徽标来源（#94）：加密币取 @web3icons/core 的 SVG（MIT，按需载入）；股票走自托管目录，文档站 public/logos-demo/ 里是自绘的示意图，
// 不是这些公司的标志（企业徽标是商标，不进本仓库）。
const DEMO_LOGO_PROVIDERS = [
  web3icons(),
  selfHosted({ baseUrl: `${import.meta.env.BASE_URL}logos-demo`, assetClasses: ['stock'] }),
]

/** 演示行：标签与图标之间 8px、图标之间 6px（写在行内，组件截图里没有文档站的 preview.css 也一样）。 */
function LogoRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="gal-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="gal-cap">{name}</span>
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>{children}</span>
    </div>
  )
}

/** 包在 LogoProvider 里的 SymbolMark：没给 src，按来源逐个试，都失败退回字母。 */
export function SymbolMarkLogosDemo() {
  return (
    <LogoProvider providers={DEMO_LOGO_PROVIDERS}>
      <LogoRow name="加密币 · web3icons">
        {['BTCUSDT', 'ETH-USDT', 'SOL/USDT', 'BNBUSDT.P', 'XRP-PERP', 'DOGEUSDT'].map((symbol) => (
          <SymbolMark key={symbol} symbol={symbol} />
        ))}
        <SymbolMark symbol="BTCUSDT" name="Bitcoin" size="md" />
      </LogoRow>
      <LogoRow name="股票 · 自托管">
        <SymbolMark symbol="600519.SH" name="示例甲" />
        <SymbolMark symbol="00700.HK" name="示例乙" />
        <SymbolMark symbol="AAPL.O" name="示例丙" />
        <SymbolMark symbol="600519.SH" name="示例甲" size="md" />
      </LogoRow>
      <LogoRow name="找不到 → 字母">
        <SymbolMark symbol="601318.SH" name="示例丁" />
        <SymbolMark symbol="NOSUCHCOIN-USDT" />
      </LogoRow>
      <p className="gal-note">
        股票的图是文档站自绘的示意图（public/logos-demo/600519.XSHG.svg 这类「代码.场所」命名），不是这些公司的标志。
      </p>
    </LogoProvider>
  )
}

const TAG_TONES: readonly Severity[] = ['neutral', 'ok', 'warn', 'danger']

export function TagDemo() {
  return (
    <>
      <Row name="填充 · md">
        {TAG_TONES.map((tone) => (
          <Tag key={tone} tone={tone} data-testid={`tag-${tone}`}>
            {tone}
          </Tag>
        ))}
      </Row>
      <Row name="描边 · md">
        {TAG_TONES.map((tone) => (
          <Tag key={tone} tone={tone} outlined data-testid={`tag-${tone}-outlined`}>
            {tone}
          </Tag>
        ))}
      </Row>
      <Row name="sm">
        {TAG_TONES.map((tone) => (
          <Tag key={tone} tone={tone} size="sm" data-testid={`tag-${tone}-sm`}>
            {tone.slice(0, 1).toUpperCase()}
          </Tag>
        ))}
      </Row>
    </>
  )
}
