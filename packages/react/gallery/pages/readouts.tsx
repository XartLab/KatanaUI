// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  BadgeGroup,
  DotMatrix,
  Kbd,
  Lcd,
  Led,
  LINK_GROUPS,
  RollingText,
  SymbolMark,
  type LedState,
} from '../../src/index.ts'
import { LiveLedLcdDemo } from './live-readouts.tsx'
import { Cell, Row, SAMPLE_MARK_SRC } from './parts.tsx'

// KATANA 自有的读数件的演示（#1860 从 src/ui 搬进包）：状态灯、LCD 读数、点阵、滚动数字、徽标、快捷键方块。数据和文案都是演示用的。

const LED_STATES: readonly LedState[] = ['off', 'on', 'ok', 'warn', 'danger']

export function LedDemo() {
  return (
    <>
      <Row name="状态">
        {LED_STATES.map((state) => (
          <Cell key={state} name={state}>
            <Led state={state} label={`状态 ${state}`} />
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
          <Led hollow state="ok" label="空心灯" />
        </Cell>
        <Cell name="bare">
          <Led bare label="旁边没有文字的熄灭灯" />
        </Cell>
        <Cell name="small">
          <Led small state="on" label="小灯" />
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
        <DotMatrix id="gal-dots-orange" color="var(--signal-orange)" />
      </defs>
      <rect x="0" y="0" width="100" height="72" fill="url(#gal-dots-default)" />
      <rect x="120" y="0" width="100" height="72" fill="url(#gal-dots-orange)" />
    </svg>
  )
}

export function RollingTextDemo() {
  const [value, setValue] = useState(106977.4)
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
        <SymbolMark code="AAPL" name="Apple" />
        <SymbolMark code="600519" name="贵州茅台" />
        <SymbolMark code="00700" name="腾讯控股" />
        <SymbolMark code="BTCUSDT" name="Bitcoin" />
      </Row>
      <Row name="有图">
        <SymbolMark code="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} />
        <SymbolMark code="BTC" name="Bitcoin" src={SAMPLE_MARK_SRC} size={28} />
      </Row>
      <Row name="加载失败">
        <SymbolMark code="ETH" name="Ethereum" src="data:image/png;base64,broken" />
      </Row>
      <p className="gal-note">示意图标：自绘的 SVG，演示有图的样子；不是任何真实币种或公司的标志。</p>
    </>
  )
}
