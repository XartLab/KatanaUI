// SPDX-License-Identifier: MIT
// 联动组（#22 G8）的演示：自选与两张「图」同在 A 组，点品种一起换、十字线一起走；换到别的组或不联动就各走各的。数据是示例，不是行情。
// 下面一节是标题栏的选组件 LinkGroupPicker（#150）：三张小件分两组，各接自己的一张联动表（不和上面的演示串组）；再下面是选组件的五种样子。
import { useState, type ReactNode } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks/index.ts'
import {
  LINK_GROUPS,
  LinkGroupPicker,
  LinkGroupProvider,
  MiniChart,
  QuoteCard,
  ToggleGroup,
  ToggleGroupItem,
  createLinkHub,
  useLinkGroup,
  type LinkGroup,
  type LinkGroupPickerLabels,
} from '../../src/index'
import { LinkGroupUsage } from '../usage/LinkGroupUsage.tsx'
import { Row } from './parts.tsx'

const SAMPLE = '示例数据，不是行情'

type DemoSymbol = {
  symbol: string
  name: string
  last: number
  change: number
  changePct: number
  spark: readonly number[]
  note: string
}

const DEMO: readonly DemoSymbol[] = [
  {
    symbol: 'AAA',
    name: '示例甲',
    last: 11.8,
    change: 1.8,
    changePct: 18,
    spark: [10, 10.4, 10.2, 10.9, 11.3, 11.1, 11.8],
    note: '示例甲：演示用的品种，这一段一路走高。',
  },
  {
    symbol: 'BBB',
    name: '示例乙',
    last: 10.2,
    change: -1.8,
    changePct: -15,
    spark: [12, 11.6, 11.8, 11.1, 10.7, 10.9, 10.2],
    note: '示例乙：演示用的品种，这一段一路走低。',
  },
  {
    symbol: 'CCC',
    name: '示例丙',
    last: 10,
    change: 0,
    changePct: 0,
    spark: [10, 10.2, 9.9, 10.1, 10, 10.2, 10],
    note: '示例丙：演示用的品种，横盘不动。',
  },
  {
    symbol: 'DDD',
    name: '示例丁',
    last: 23.45,
    change: 0.45,
    changePct: 1.96,
    spark: [23, 23.1, 22.9, 23.2, 23.3, 23.25, 23.45],
    note: '示例丁：演示用的品种，小幅上涨。',
  },
]

const bySymbol = (symbol: string | undefined): DemoSymbol => DEMO.find((item) => item.symbol === symbol) ?? DEMO[0]!

export const LINK_LABELS: LinkGroupPickerLabels = {
  trigger: '联动组',
  none: '不联动',
  groups: { A: '组 A', B: '组 B', C: '组 C', D: '组 D' },
}

/** 一张联动的小件：标题栏最左是选组件，内容区顶上一排品种按钮（点了就改整组），下面画调用方给的内容。组由这张件自己存。 */
function LinkedPanel({
  title,
  symbol,
  defaultGroup,
  children,
}: {
  title: string
  symbol: string
  defaultGroup: LinkGroup | null
  children: (item: DemoSymbol) => ReactNode
}) {
  const [group, setGroup] = useState(defaultGroup)
  const [link, set] = useLinkGroup(group, { fields: ['symbol'], initial: { symbol } })
  const item = bySymbol(link.symbol)
  return (
    <div style={{ width: 236, height: 248 }} data-gallery-link-panel={title} data-symbol={item.symbol}>
      <PanelFrame aria-label={title}>
        <PanelFrameHeader>
          <LinkGroupPicker value={group} onValueChange={setGroup} carry={link} labels={LINK_LABELS} />
          <h2>{title}</h2>
          <span className="k-panel-object">· {item.symbol}</span>
        </PanelFrameHeader>
        <PanelFrameBody>
          <div style={{ display: 'grid', gap: 8, padding: 8 }}>
            <ToggleGroup
              size="sm"
              value={item.symbol}
              onValueChange={(next) => next && set({ symbol: next })}
              aria-label={`${title}：换品种`}
            >
              {DEMO.map((option) => (
                <ToggleGroupItem key={option.symbol} value={option.symbol}>
                  {option.symbol}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {children(item)}
          </div>
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

/** 三张小件分两组：报价卡与迷你图在组 A，文字在组 B；接自己的一张联动表，组 A 起头是 AAA、组 B 是 CCC。 */
export function LinkGroupPanels() {
  const [hub] = useState(() => createLinkHub({ A: { symbol: 'AAA' }, B: { symbol: 'CCC' } }))
  return (
    <LinkGroupProvider hub={hub}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <LinkedPanel title="报价" symbol="AAA" defaultGroup="A">
          {(item) => (
            <QuoteCard
              name={item.name}
              symbol={item.symbol}
              last={item.last}
              change={item.change}
              changePct={item.changePct}
              spark={item.spark}
              labels={{ spark: `${item.name}示例走势` }}
              size="sm"
            />
          )}
        </LinkedPanel>
        <LinkedPanel title="迷你图" symbol="AAA" defaultGroup="A">
          {(item) => (
            <MiniChart
              symbol={item.symbol}
              name={item.name}
              price={item.last}
              unit="USD"
              change={item.changePct}
              values={item.spark}
              labels={{ card: item.name, chart: `${item.name}示例走势` }}
            />
          )}
        </LinkedPanel>
        <LinkedPanel title="说明" symbol="CCC" defaultGroup="B">
          {(item) => (
            <p className="gal-note" style={{ margin: 0 }}>
              {item.note}
            </p>
          )}
        </LinkedPanel>
      </div>
    </LinkGroupProvider>
  )
}

/** 选组件的五种样子：A–D 四组与不联动。 */
export function LinkGroupPickerStates() {
  return (
    <>
      {LINK_GROUPS.map((group) => (
        <LinkGroupPicker key={group} value={group} onValueChange={() => {}} labels={LINK_LABELS} />
      ))}
      <LinkGroupPicker value={null} onValueChange={() => {}} labels={LINK_LABELS} />
    </>
  )
}

export function LinkGroupDemo() {
  return (
    <>
      <Row name="自选 → 图 1、图 2（A 组）；在图的灰条上移动指针，同组的图同时画十字线">
        <LinkGroupUsage />
      </Row>
      <Row name="选组件 · 三张小件 · 两组">
        <LinkGroupPanels />
      </Row>
      <p className="gal-note">
        {SAMPLE}
        。点哪张件顶上的品种，同组的件跟着换；点标题栏最左的灯换组或不联动，菜单每组行尾是这组现在的品种：进有品种的组就改看组的，进空组时组取这件的品种，不联动时件回到自己起头的品种。
      </p>
      <Row name="选组件的五种样子">
        <LinkGroupPickerStates />
      </Row>
    </>
  )
}
