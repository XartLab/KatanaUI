// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '../../src/index'
import { Row } from './parts'

// 命令面板与可搜索下拉的演示。条目都是演示用的。

export function CommandDemo() {
  const [last, setLast] = useState('（还没选）')
  const [open, setOpen] = useState(false)
  return (
    <>
      <Row name="内嵌">
        <div className="gal-wide" style={{ border: '1px solid var(--line-100)', borderRadius: 8 }}>
          <Command label="演示命令" onValueChange={() => {}}>
            <CommandInput placeholder="搜命令…" />
            <CommandList aria-label="命令">
              <CommandEmpty>没有匹配的命令</CommandEmpty>
              <CommandGroup heading="图表">
                <CommandItem value="趋势线" keywords={['trend']} onSelect={() => setLast('趋势线')}>
                  趋势线
                  <CommandShortcut>Alt+T</CommandShortcut>
                </CommandItem>
                <CommandItem value="斐波那契回撤" keywords={['fib']} onSelect={() => setLast('斐波那契回撤')}>
                  斐波那契回撤
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="设置">
                <CommandItem value="显示时区" keywords={['time zone']} onSelect={() => setLast('显示时区')}>
                  显示时区
                </CommandItem>
                <CommandItem value="声音（未实装）" disabled>
                  声音（未实装）
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <output data-testid="command-last">{last}</output>
      </Row>
      <Row name="对话框">
        <Button onClick={() => setOpen(true)}>打开命令面板</Button>
        <CommandDialog open={open} onOpenChange={setOpen} title="命令面板" description="搜索并执行命令，回车执行。">
          <CommandInput placeholder="搜命令…" />
          <CommandList>
            <CommandEmpty>没有匹配的命令</CommandEmpty>
            <CommandItem
              value="新开面板"
              onSelect={() => {
                setLast('新开面板')
                setOpen(false)
              }}
            >
              新开面板
            </CommandItem>
            <CommandItem
              value="新建告警"
              onSelect={() => {
                setLast('新建告警')
                setOpen(false)
              }}
            >
              新建告警
            </CommandItem>
          </CommandList>
        </CommandDialog>
      </Row>
    </>
  )
}

const FRAMES: readonly [string, string, string][] = [
  ['1m', '1 分钟', 'm1'],
  ['5m', '5 分钟', 'm5'],
  ['1h', '1 小时', 'h1'],
  ['4h', '4 小时', 'h4'],
  ['1d', '日线', 'd1'],
  ['1w', '周线', 'w1'],
]

// 演示用的交易所：只是举例，不连行情。
const VENUES: readonly [string, string, string, string][] = [
  ['sh', '上海证券交易所', '沪市 · A 股', 'SH'],
  ['sz', '深圳证券交易所', '深市 · A 股', 'SZ'],
  ['hk', '香港交易所', '港股 · 主板', 'HK'],
  ['us', '纳斯达克', '美股 · 科技为主', 'US'],
]

export function ComboboxDemo() {
  const [value, setValue] = useState('1h')
  const [open, setOpen] = useState(false)
  const [venue, setVenue] = useState('hk')
  const [richOpen, setRichOpen] = useState(false)
  const [many, setMany] = useState<string[]>(['5m'])
  const shown = FRAMES.find(([id]) => id === value)?.[1]
  return (
    <>
      <Row name="单选（选了收起）">
        <Combobox open={open} onOpenChange={setOpen}>
          <ComboboxTrigger aria-label="周期" style={{ width: 160 }}>
            <span>{shown ?? '选周期'}</span>
          </ComboboxTrigger>
          <ComboboxContent label="搜周期">
            <ComboboxInput placeholder="搜周期…" />
            <ComboboxList>
              <ComboboxEmpty>没有匹配的周期</ComboboxEmpty>
              {FRAMES.map(([id, name, code]) => (
                <ComboboxItem
                  key={id}
                  value={id}
                  keywords={[name, code]}
                  selected={id === value}
                  onSelect={() => {
                    setValue(id)
                    setOpen(false)
                  }}
                >
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <output data-testid="combobox-value">{value}</output>
      </Row>
      <Row name="带前缀与说明（单选，选了收起）">
        <Combobox open={richOpen} onOpenChange={setRichOpen}>
          <ComboboxTrigger aria-label="交易所" style={{ width: 200 }}>
            <span>{VENUES.find(([id]) => id === venue)?.[1] ?? '选交易所'}</span>
          </ComboboxTrigger>
          <ComboboxContent label="搜交易所">
            <ComboboxInput placeholder="搜交易所…" />
            <ComboboxList>
              <ComboboxEmpty>没有匹配的交易所</ComboboxEmpty>
              {VENUES.map(([id, name, note, code]) => (
                <ComboboxItem
                  key={id}
                  value={id}
                  keywords={[note, code]}
                  selected={id === venue}
                  prefix={<span className="k-text-micro text-(color:--k-content-secondary-foreground)">{code}</span>}
                  description={note}
                  onSelect={() => {
                    setVenue(id)
                    setRichOpen(false)
                  }}
                >
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Row>
      <Row name="多选（不收）">
        <Combobox>
          <ComboboxTrigger aria-label="常用周期" style={{ width: 160 }}>
            <span>{many.length > 0 ? `已选 ${many.length} 个` : '没选'}</span>
          </ComboboxTrigger>
          <ComboboxContent label="搜常用周期">
            <ComboboxInput placeholder="搜周期…" />
            <ComboboxList>
              <ComboboxEmpty>没有匹配的周期</ComboboxEmpty>
              {FRAMES.map(([id, name, code]) => (
                <ComboboxItem
                  key={id}
                  value={id}
                  keywords={[name, code]}
                  selected={many.includes(id)}
                  onSelect={() => setMany((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))}
                >
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Row>
    </>
  )
}
