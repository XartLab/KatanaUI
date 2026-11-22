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
| `tone` | `SeverityExt` | `'accent'` | 进行中 accent（橙）、健康 ok（绿）、受限或越界 warn（琥珀）、弱势 danger（红）、停用 off / neutral。 |
| `display` | `'bar' \| 'gauge' \| 'sync'` | `'bar'` | sync 只给 paper 进度、容量使用、偏离门距离、回放进度。 |
| `mark` | `number` | — | 刻度（跟 value 同单位）：琥珀竖线，sync 里是评估点；gauge 不画。 |
| `markLabel` | `string` | — | 读屏用：刻度是什么（评估点、上限）；有 mark 时要给。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Meter } from '@katana-ui/react/blocks'

export function MeterUsage() {
  return (
    <>
      <div className="gal-stack" data-testid="meter-bars">
        <Meter label="LOAD · 敞口" value={72} tone="ok" />
        <Meter label="LOAD · 受锁（超过 60% 上限）" value={38} tone="warn" mark={60} markLabel="上限" />
        <Meter label="回测进度" value={61} />
        <Meter label="OFF" value={0} tone="off" />
      </div>

      <div className="gal-stack" data-testid="meter-gauges">
        <Meter label="RS-20 · 电子" value={94} display="gauge" />
        <Meter label="RS-20 · 军工（弱势）" value={27} display="gauge" tone="danger" />
      </div>

      <div className="gal-stack" data-testid="meter-sync">
        <Meter label="PAPER · 第 21 / 30 天" value={70} display="sync" mark={100} markLabel="评估点" />
        <Meter label="容量使用" value={52} display="sync" tone="ok" mark={80} markLabel="容量上限" />
      </div>
    </>
  )
}
```

## States

- bar：10px 凹槽里点阵纹理填充（4px 实 2px 空），长度编码量。
- gauge：34px 凹槽、中线、底部 0/25/50/75/100 刻度，指针带光；弱势用 danger（红）。
- sync：14px 带齿条，右侧大百分比（display-dense 字），琥珀刻度是评估点。
- warn：条与数转琥珀，条体脉冲一次；off：全部转灰。
- tone 是 SeverityExt（G6）：neutral 画法同 off（没有判断就不着色）。

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
