// SPDX-License-Identifier: MIT
import { MaeMfeScatterUsage } from '../usage/MaeMfeScatterUsage.tsx'
import { ParamSurfaceHeatmapUsage } from '../usage/ParamSurfaceHeatmapUsage.tsx'
import { PeriodReturnsTableUsage } from '../usage/PeriodReturnsTableUsage.tsx'
import { RobustnessGateUsage } from '../usage/RobustnessGateUsage.tsx'
import { UnderwaterChartUsage, UnderwaterWithEquityUsage } from '../usage/UnderwaterChartUsage.tsx'
import { WalkForwardMatrixUsage } from '../usage/WalkForwardMatrixUsage.tsx'
import { Row } from './parts.tsx'

// 研究报告件与优化结果件（#120）的文档站演示。数据全是固定种子合成的演示数据（research-data.ts），不是回测结果；金样例在各 usage 里。

export function MaeMfeScatterDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：140
        笔合成交易。切「最大浮盈」看亏单曾经浮盈多少；切「金额」看绝对值。移到点上或用方向键走点，读数区写这一笔的盈亏、MAE、MFE。
      </p>
      <Row name="横轴 MAE / MFE 可切，纵轴最终盈亏">
        <MaeMfeScatterUsage />
      </Row>
    </>
  )
}

export function UnderwaterChartDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：144 个周频点，中间一段约 -17%
        的回撤并在之后恢复。灰底是最大回撤段（前高到恢复），顶上写深度、下跌与恢复用时；未恢复时这一段改琥珀底。
      </p>
      <Row name="单独一张">
        <UnderwaterChartUsage />
      </Row>
      <Row name="与权益曲线共用时间轴（同一对 xDomain 与 formatTime，左侧留白一致）">
        <UnderwaterWithEquityUsage />
      </Row>
    </>
  )
}

export function PeriodReturnsTableDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：约 720
        个工作日的合成日收益，按东八区复利聚合成月、季、周；行尾是全年合计。颜色是涨跌发散色，零附近中性灰，没有彩虹色阶。周视图格子窄，数字在读数区。
      </p>
      <Row name="年 × 月，可切季与周">
        <PeriodReturnsTableUsage />
      </Row>
    </>
  )
}

export function ParamSurfaceHeatmapDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：三个参数（快线、慢线、止损）的合成优化结果。止损 = 1 的切片里有一根孤峰（快线 13、慢线 80，夏普
        1.95，周围一圈只有 0.2 上下），最优格带「孤峰」标记；把止损切到 2，最优落在一片平台上，保留率回到 80% 左右。
      </p>
      <Row name="两个轴 + 目标值可切 + 其余参数固定为切片">
        <ParamSurfaceHeatmapUsage />
      </Row>
    </>
  )
}

export function WalkForwardMatrixDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：八个步进窗口，样本内两年（滚动）或自 2018
        年起累计（锚定），样本外半年。看行首时间轴小条：锚定的样本内条都从左端起、越拉越长，滚动的整条后移。底部是汇总与步进效率。
      </p>
      <Row name="滚动 / 锚定可切">
        <WalkForwardMatrixUsage />
      </Row>
    </>
  )
}

export function RobustnessGateDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据与演示阈值：步进效率、样本外盈利占比取自步进窗口矩阵那一页的滚动窗口，邻域保留率取自参数曲面止损 = 1
        的切片（有孤峰）。最后一条没测出来，算「未测出」，整组不过门。
      </p>
      <Row name="一组判定条">
        <RobustnessGateUsage />
      </Row>
    </>
  )
}
