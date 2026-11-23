// SPDX-License-Identifier: MIT
import { ChangeSummary, KpiChart, ParallelAttempts } from '../../src/quant'
import { ChangeSummaryUsage } from '../usage/ChangeSummaryUsage.tsx'
import { ExperimentCardUsage } from '../usage/ExperimentCardUsage.tsx'
import { KpiChartUsage } from '../usage/KpiChartUsage.tsx'
import { ParallelAttemptsUsage } from '../usage/ParallelAttemptsUsage.tsx'
import { RootCauseTreeUsage } from '../usage/RootCauseTreeUsage.tsx'
import { Row } from './parts.tsx'

// 参照 affectUI 补的量化与排查件（KATANAview #1908 第一批）的文档站演示。数据全是示例：手写的演示值或固定种子合成，不是回测结果。

export function ExperimentCardDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：三组参数，A 是基准。切指标看谁领先（回撤越小越好）；点一行或 Space
        选为胜者，再点一次撤回；选了胜者底栏出「采用」。
      </p>
      <Row name="三组参数、三个指标">
        <ExperimentCardUsage />
      </Row>
    </>
  )
}

export function ParallelAttemptsDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：五组参数，两组跑完、一组运行中、一组失败、一组排队。默认选中分最好的（标「最优」），点别的「用这组」改选。
      </p>
      <Row name="跑到一半的扫描">
        <ParallelAttemptsUsage />
      </Row>
      <Row name="还没有尝试">
        <div className="gal-wide" style={{ maxWidth: 520 }}>
          <ParallelAttempts
            title="参数扫描"
            label="示例：空的参数组"
            attempts={[]}
            labels={{
              status: { queued: '排队', running: '运行中', done: '跑完', failed: '失败' },
              best: '最优',
              use: '用这组',
              picked: '已选',
              counts: () => '0 组',
              empty: '还没有参数组：先在参数面板里设扫描范围',
            }}
          />
        </div>
      </Row>
    </>
  )
}

export function ChangeSummaryDemo() {
  return (
    <>
      <p className="gal-note">示例数据：好坏色与箭头分开——回撤变大是「坏」，箭头照样朝上；没有变化写成文字。</p>
      <Row name="一周的变化">
        <ChangeSummaryUsage />
      </Row>
      <Row name="没有变化">
        <div className="gal-wide" style={{ maxWidth: 360 }}>
          <ChangeSummary title="本周变化（示例）" changes={[]} empty="这段时间没有指标变化" />
        </div>
      </Row>
    </>
  )
}

export function KpiChartDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：固定种子合成的周频权益。移到图上或聚焦后按 ←→（Shift 三格、Home / End、Esc
        清掉），提示窗写三条线这一周的真值。
      </p>
      <Row name="单位不同的三条线（normalized）">
        <KpiChartUsage />
      </Row>
      <Row name="同一单位共用纵轴（shared）">
        <div className="gal-wide" style={{ maxWidth: 520 }}>
          <KpiChart
            title="两个策略的累计收益（示例）"
            label="示例：共用纵轴"
            value="+18.4%"
            delta={0.031}
            labels={['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月']}
            series={[
              { key: 'a', label: '双均线', values: [0, 0.021, 0.034, 0.029, 0.081, 0.122, 0.184] },
              { key: 'b', label: '突破', values: [0, -0.012, 0.018, 0.047, 0.052, 0.061, 0.09] },
            ]}
            format={(v) => `${(v * 100).toFixed(0)}%`}
            emptyText="还没有回测结果"
          />
        </div>
      </Row>
      <Row name="没有数据">
        <div className="gal-wide" style={{ maxWidth: 520 }}>
          <KpiChart title="权益" label="示例：空的 KPI 图" labels={[]} series={[]} emptyText="还没有回测结果" />
        </div>
      </Row>
    </>
  )
}

export function RootCauseTreeDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：一次日 K 缺口的排查。Tab 进树后 ↑↓ 上下、← 回父、→ 到第一个子、Home / End；Enter 打开这一行的证据，Esc
        收起。 根因（已确认的叶子）到故障的一条线点亮。
      </p>
      <Row name="两条排除、一条确认">
        <RootCauseTreeUsage />
      </Row>
    </>
  )
}
