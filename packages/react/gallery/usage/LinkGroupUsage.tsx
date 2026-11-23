// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import { ToggleGroup, ToggleGroupItem, useLinkGroup, type LinkGroup } from '../../src/index'

// 示例数据：四个品种、一段固定的 60 分钟窗口，不是行情。
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'NVDA', 'QQQ']
const T0 = Date.UTC(2026, 10, 20, 1, 30)
const SPAN = 60 * 60_000
const clock = (time: number) => new Date(time).toISOString().slice(11, 16)

/** 联动组的选择：A、B 两组，或不联动。 */
function GroupPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: LinkGroup | null
  onChange: (next: LinkGroup | null) => void
}) {
  return (
    <ToggleGroup
      size="sm"
      aria-label={label}
      value={value ?? 'none'}
      onValueChange={(next) => next && onChange(next === 'none' ? null : (next as LinkGroup))}
    >
      <ToggleGroupItem value="A">A</ToggleGroupItem>
      <ToggleGroupItem value="B">B</ToggleGroupItem>
      <ToggleGroupItem value="none">不联动</ToggleGroupItem>
    </ToggleGroup>
  )
}

/** 自选：点一个品种写进组里（只订阅 symbol，十字线变了不重画）。 */
function Watch({ group }: { group: LinkGroup | null }) {
  const [link, set] = useLinkGroup(group, { fields: ['symbol'], initial: { symbol: SYMBOLS[0] } })
  return (
    <ToggleGroup
      size="sm"
      aria-label="自选"
      value={link.symbol ?? ''}
      onValueChange={(next) => next && set({ symbol: next })}
    >
      {SYMBOLS.map((symbol) => (
        <ToggleGroupItem key={symbol} value={symbol}>
          {symbol}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** 一张「图」：品种与周期跟组走，指针在条上移动时把十字线时刻写进组里，同组的另一张跟着画竖线。 */
function Chart({
  name,
  group,
  onGroup,
}: {
  name: string
  group: LinkGroup | null
  onGroup: (g: LinkGroup | null) => void
}) {
  const [link, set] = useLinkGroup(group, { initial: { symbol: SYMBOLS[0], interval: '5' } })
  const at = link.crosshairTime ?? null
  return (
    <PanelFrame aria-label={name} data-link-chart={name} style={{ width: 280 }}>
      <PanelFrameHeader
        heading={name}
        object={link.symbol}
        linkGroup={group}
        labels={{ link: `联动组 ${group ?? '无'}` }}
      />
      <PanelFrameBody>
        <div style={{ display: 'grid', gap: 8, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <ToggleGroup
              size="sm"
              aria-label={`${name} 周期`}
              value={link.interval ?? ''}
              onValueChange={(next) => next && set({ interval: next })}
            >
              <ToggleGroupItem value="1">1m</ToggleGroupItem>
              <ToggleGroupItem value="5">5m</ToggleGroupItem>
              <ToggleGroupItem value="60">1h</ToggleGroupItem>
            </ToggleGroup>
            <GroupPicker label={`${name} 联动组`} value={group} onChange={onGroup} />
          </div>
          <div
            data-slot="crosshair-strip"
            style={{ position: 'relative', height: 40, borderRadius: 4, background: 'var(--alpha-white-5)' }}
            onPointerMove={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              set({ crosshairTime: T0 + Math.round(((event.clientX - box.left) / box.width) * SPAN) })
            }}
            onPointerLeave={() => set({ crosshairTime: null })}
          >
            {at === null ? null : (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${((at - T0) / SPAN) * 100}%`,
                  width: 1,
                  background: 'var(--k-content-secondary-foreground)',
                }}
              />
            )}
          </div>
          <span className="gal-note" data-slot="crosshair-readout" style={{ margin: 0 }}>
            {at === null ? '十字线：—' : `十字线：${clock(at)}`}
          </span>
        </div>
      </PanelFrameBody>
    </PanelFrame>
  )
}

// 自选与两张图默认都在 A 组：点品种两张图一起换；在一张图的条上移动指针，另一张同时画十字线。把一张图换到 B 或「不联动」，它就各走各的。
export function LinkGroupUsage() {
  const [watchGroup, setWatchGroup] = useState<LinkGroup | null>('A')
  const [left, setLeft] = useState<LinkGroup | null>('A')
  const [right, setRight] = useState<LinkGroup | null>('A')
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} data-slot="link-watch">
        <Watch group={watchGroup} />
        <GroupPicker label="自选 联动组" value={watchGroup} onChange={setWatchGroup} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Chart name="图 1" group={left} onGroup={setLeft} />
        <Chart name="图 2" group={right} onGroup={setRight} />
      </div>
    </div>
  )
}
