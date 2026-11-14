# Meter

仪表的三种形态：条（进度、负载、敞口，点阵填充）、刻度盘（0 到 100 的读数带指针）、同步率（分段齿条加评估点刻度加大百分比）。限额板传软限与硬限，达到软限算接近、达到硬限算越限。对设计稿的 Meter 卡；功能参照 Arc 的 Budget variance。

## Provide

`*` marks a required prop.

### Meter

角色是 meter。调用方只传 tone，不传颜色。外观读 CSS 变量（点阵纹理、强调色、数字字体），见 theme/chart-kit.css 开头。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value / max` | `number` | — | 读数与满刻度（max 默认 100；gauge 与 sync 固定按 0 到 100 读）。超出满刻度的条画满。 |
| `display` | `bar \| gauge \| sync` | `bar` | 形态。sync 只给 paper 进度、容量使用、偏离门距离、回放进度。 |
| `tone` | `accent \| ok \| warn \| off \| ink` | `accent` | 进行中 / 健康 / 受限或越界 / 停用。有软限或硬限且已达到时自动换成 warn。 |
| `soft / hard` | `number` | — | 软限（接近，琥珀刻度）与硬限（越限，红刻度）；都可以不给。状态按「达到」算。 |
| `label` | `string` | — | 量的是什么：左上角的字，也是读屏名。 |
| `valueText` | `string` | — | 读屏整句，调用方按界面语言写。 |
| `formatValue` | `(value: number) => string` | — | 读数写成什么字（sync 是右侧大百分比）。 |
| `stateLabels` | `{ ok?, warn?, breach? }` | — | 三种状态的词，写在读数后面；不给就不写。状态不单靠颜色。 |
| `tickLabels` | `{ soft?, hard? }` | — | bar 里刻度下面的小字。 |
| `weakBelow / locked` | `number / boolean` | — | gauge：读数低于 weakBelow 指针转红（Meter 卡写 30）；locked 转琥珀。 |
| `mark` | `number` | — | sync：评估点（0 到 100），画琥珀刻度。 |

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

- 健康 / 进行中 / 停用：tone 决定点阵填充的颜色。
- 接近（已用 ≥ 软限）：tone 转 warn，状态词转琥珀，条体脉冲一次。
- 越限（已用 ≥ 硬限）：tone 仍是 warn，状态词转红，硬限刻度红。
- 刻度盘弱势 / 受锁：指针转红 / 琥珀。

## Don't

- 不要传颜色：只传 tone。
- 不要做「只有一根条」：条永远有标签和读数。
- 不要做环形仪表（第一版不做）。
- 不要在包里决定软限、硬限是多少：限额由风控设置传进来。

## Composition

```
Meter
  标题行（label · 读数 · 状态词）
  bar：div[role=meter]（点阵填充 · 软限刻度 · 硬限刻度）+ 刻度小字
  gauge：div[role=meter]（中线 · 指针 · 0/25/50/75/100）
  sync：标签 + 分段齿条（评估点刻度）+ 大百分比
```
