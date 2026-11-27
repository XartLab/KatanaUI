// SPDX-License-Identifier: MIT
import { CompsTableUsage } from '../usage/CompsTableUsage.tsx'
import { StatementTableUsage } from '../usage/StatementTableUsage.tsx'
import { ValuationBandUsage } from '../usage/ValuationBandUsage.tsx'
import { Row } from './parts.tsx'

// 投研三件（KATANAview #2395）的文档站演示。数据全是虚构公司、固定种子合成的（fundamentals-data.ts），不是任何真实公司的数。

export function StatementTableDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：一家虚构公司 8
        个季度的利润表。「期间费用」能折叠；切「同比」「环比」看变化率（涨跌色只给变化率）；2026 Q1
        的营业收入右上有一个小点，是更正过的格，悬停看第几版。
      </p>
      <Row name="科目成树，期间做列，原值 / 同比 / 环比">
        <StatementTableUsage />
      </Row>
    </>
  )
}

export function CompsTableDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：7 家虚构公司，第一家是本公司（置顶、左侧竖线、写「本公司」）。上方页签切估值 / 增长 /
        盈利；底色是相对中位数好多少，方向由指标定（PE 越低越好）；「净负债率」没写方向，只写数不着色。
      </p>
      <Row name="本公司置顶，表尾中位数与均值">
        <CompsTableUsage />
      </Row>
    </>
  )
}

export function ValuationBandDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：5 年周线。五条带是 PE 历史的 10 / 25 / 50 / 75 / 90 分位折回价格；中间一段亏损（PE
        为负），那一段带线断开；右上读出当前分位。
      </p>
      <Row name="价格叠 PE 分位带">
        <ValuationBandUsage />
      </Row>
    </>
  )
}
