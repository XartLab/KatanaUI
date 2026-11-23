// SPDX-License-Identifier: MIT
// 联动组（#150 G8）的演示：三张小件（报价卡、迷你图、文字）分两组联动，标题栏里是 LinkGroupPicker；下面是选择件的五种样子。
// 下面所有数据都是演示用的示例（在这个展示页里构造，不是行情），页上也写明了。
import { useState, type ReactNode } from 'react'
import {
  LINK_GROUPS,
  LinkGroupPicker,
  LinkGroupProvider,
  MiniChart,
  QuoteCard,
  ToggleGroup,
  ToggleGroupItem,
  useLinkGroup,
  type LinkGroup,
  type LinkGroupPickerLabels,
  type LinkGroupValues,
} from '../../src/index'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks/index.ts'
import { Row } from './parts'

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

const bySymbol = (symbol: string): DemoSymbol => DEMO.find((item) => item.symbol === symbol) ?? DEMO[0]!

export const LINK_LABELS: LinkGroupPickerLabels = {
  trigger: '联动组',
  none: '不联动',
  groups: { A: '组 A', B: '组 B', C: '组 C', D: '组 D' },
}

/** 一张联动的小件：标题栏最左是选择件，内容区顶上一排品种按钮（点了就改整组），下面画调用方给的内容。 */
function LinkedPanel({
  title,
  defaultValue,
  defaultGroup,
  children,
}: {
  title: string
  defaultValue: string
  defaultGroup: LinkGroup | null
  children: (item: DemoSymbol) => ReactNode
}) {
  const link = useLinkGroup({ defaultValue, defaultGroup })
  const item = bySymbol(link.value)
  return (
    <div style={{ width: 236, height: 248 }} data-gallery-link-panel={title} data-symbol={item.symbol}>
      <PanelFrame aria-label={title}>
        <PanelFrameHeader>
          <LinkGroupPicker value={link.group} onValueChange={link.setGroup} labels={LINK_LABELS} />
          <h2>{title}</h2>
          <span className="k-panel-object">· {item.symbol}</span>
        </PanelFrameHeader>
        <PanelFrameBody>
          <div style={{ display: 'grid', gap: 8, padding: 8 }}>
            <ToggleGroup size="sm" value={link.value} onValueChange={link.setValue} aria-label={`${title}：换品种`}>
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

const groupText = (values: LinkGroupValues<string>) =>
  LINK_GROUPS.filter((group) => values[group] !== undefined)
    .map((group) => `${LINK_LABELS.groups?.[group] ?? group}：${values[group]}`)
    .join(' · ')

/** 三张小件分两组：报价卡与迷你图在组 A，文字在组 B。 */
export function LinkGroupPanels() {
  const initial: LinkGroupValues<string> = { A: 'AAA', B: 'CCC' }
  const [values, setValues] = useState(initial)
  return (
    <LinkGroupProvider defaultValue={initial} onValueChange={setValues}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <LinkedPanel title="报价" defaultValue="AAA" defaultGroup="A">
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
        <LinkedPanel title="迷你图" defaultValue="AAA" defaultGroup="A">
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
        <LinkedPanel title="说明" defaultValue="CCC" defaultGroup="B">
          {(item) => (
            <p className="gal-note" style={{ margin: 0 }}>
              {item.note}
            </p>
          )}
        </LinkedPanel>
      </div>
      <output data-gallery-link-values>{groupText(values)}</output>
    </LinkGroupProvider>
  )
}

/** 选择件的五种样子：A–D 四组与不联动。 */
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
      <Row name="三张小件 · 两组">
        <LinkGroupPanels />
      </Row>
      <p className="gal-note">
        {SAMPLE}
        。点哪张件顶上的品种，同组的件跟着换；点标题栏最左的灯换组或不联动：进有值的组就改看组的品种，进空组时组取这件的品种，离组时留着最后的品种。
      </p>
      <Row name="选择件的五种样子">
        <LinkGroupPickerStates />
      </Row>
    </>
  )
}
