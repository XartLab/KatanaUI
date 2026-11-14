# Meter

横向仪表，三种形态：条（进度、负载、敞口）、刻度（0 到 100 的读数带指针）、同步率条（带齿分段加琥珀评估刻度与右侧大百分比）；颜色只传 tone。

## Provide

`*` marks a required prop.

### Meter

名字与数永远在，不做只有一根条。填充与指针走 gentle 弹簧；tone 一变成 warn，条体脉冲一次。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | 名字（左上，ink-300）。 |
| `value` | `number` | — | 当前值；越界贴边。 |
| `max` | `number` | `100` | 满量程。 |
| `valueText` | `string` | — | 右边的数怎么写；不给就是四舍五入的百分数。 |
| `tone` | `'accent' \| 'ok' \| 'warn' \| 'danger' \| 'off'` | `'accent'` | 进行中（橙）、健康（绿）、受限或越界（琥珀）、弱势（红）、停用。 |
| `display` | `'bar' \| 'gauge' \| 'sync'` | `'bar'` | sync 只给 paper 进度、容量使用、偏离门距离、回放进度。 |
| `mark` | `number` | — | 刻度（跟 value 同单位）：琥珀竖线，sync 里是评估点；gauge 不画。 |
| `markLabel` | `string` | — | 读屏用：刻度是什么（评估点、上限）；有 mark 时要给。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Meter } from '@katana-ui/react/quant'

export function MeterUsage() {
  const state = { ok: '正常', warn: '接近', breach: '越限' }
  const ticks = { soft: '软限 80', hard: '硬限 100' }
  const pctText = (v: number) => `${v}%`
  return (
    <>
      <div className="gal-wide" data-gallery-meter="bar" style={{ maxWidth: 360, display: 'grid', gap: 10 }}>
        <Meter label="LOAD · 敞口" value={72} tone="ok" valueText="敞口 72%" formatValue={pctText} />
        <Meter label="LOAD · 受锁" value={38} tone="warn" valueText="受锁 38%" formatValue={pctText} />
        <Meter label="回测进度" value={61} tone="accent" valueText="回测进度 61%" formatValue={pctText} />
        <Meter label="OFF" value={0} tone="off" valueText="停用 0%" formatValue={pctText} />
      </div>
      <div className="gal-wide" data-gallery-meter="limits" style={{ maxWidth: 420, display: 'grid', gap: 14 }}>
        <Meter
          label="总敞口"
          value={40}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 40，软限 80，硬限 100，满刻度 120"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
        <Meter
          label="单日亏损"
          value={85}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 85，软限 80，硬限 100，满刻度 120"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
        <Meter
          label="连亏笔数"
          value={130}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 130，超过满刻度 120，硬限 100"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
      </div>

      <div className="gal-wide" data-gallery-meter="gauge" style={{ maxWidth: 360, display: 'grid', gap: 10 }}>
        <Meter
          display="gauge"
          label="RS-20 · 电子"
          value={94}
          weakBelow={30}
          valueText="RS-20 电子 94"
          formatValue={String}
        />
        <Meter
          display="gauge"
          label="RS-20 · 军工"
          value={27}
          weakBelow={30}
          valueText="RS-20 军工 27"
          formatValue={String}
        />
        <Meter display="gauge" label="RS-20 · 受锁" value={60} locked valueText="RS-20 受锁 60" formatValue={String} />
      </div>

      <div className="gal-wide" data-gallery-meter="sync" style={{ maxWidth: 360 }}>
        <Meter
          display="sync"
          label="PAPER 进度"
          value={64}
          mark={80}
          valueText="paper 进度 64%，评估点 80%"
          formatValue={pctText}
        />
      </div>
    </>
  )
}

/** 演示用的一年每日盈亏：2025-11-15 到 2026-11-14，周末休市（open: false），工作日有数；十月前后撒几个演示事件。 */
```

## States

- bar：10px 凹槽里点阵纹理填充（4px 实 2px 空），长度编码量。
- gauge：34px 凹槽、中线、底部 0/25/50/75/100 刻度，指针带光；弱势用 danger（红）。
- sync：14px 带齿条，右侧大百分比（display-dense 字），琥珀刻度是评估点。
- warn：条与数转琥珀，条体脉冲一次；off：全部转灰。

## Don't

- 不要传颜色，只传 tone。
- 越界、受限要在名字或数里写字，不只靠琥珀色。
- 不要用 sync 做普通进度条。
- 高频（> 2Hz）更新的量不要用它，用读数。

## Composition

```
Meter
  role="meter" 的槽（读屏读 aria-valuenow 与 valuetext）
```
