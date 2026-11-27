// SPDX-License-Identifier: MIT
import { AgentCrewUsage } from '../usage/AgentCrewUsage.tsx'
import { AgentFleetUsage } from '../usage/AgentFleetUsage.tsx'
import { AgentTreeUsage } from '../usage/AgentTreeUsage.tsx'
import { FlowBuilderUsage } from '../usage/FlowBuilderUsage.tsx'
import { Row } from './parts.tsx'

// 参照 affectUI 补的第三批（KATANAview #1908）的文档站演示。数据全是示例：手写的演示值，不是任何数据源、账户或 Agent 的真实记录；时钟是固定的演示值。

export function FlowBuilderDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：收盘后检查跳空，超过 3%
        交给研究员看公告，否则记一笔。点线上的「+」从模板加一步；方向键按读的次序走步骤，Alt+↑↓ 挪、Backspace 删、Ctrl+Z
        撤销；拖空白处平移。「测试运行」只把一份写好的结果交给件：研究员那一步在跑，「否」那条路跳过变淡。
      </p>
      <Row name="条件分两条路">
        <FlowBuilderUsage />
      </Row>
    </>
  )
}

export function AgentTreeDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：编排派出研究员、风控与撰稿，研究员又派出两个取数的子 Agent。分支卡写整个分支的花费；方向键走、← →
        收起展开；风控要你、取公告失败，Enter 打开小窗回答（回答后状态由示例数据改）。
      </p>
      <Row name="运行中">
        <AgentTreeUsage />
      </Row>
    </>
  )
}

export function AgentFleetDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：盘后研究、风控巡检、回补数据三个主 Agent。环是子 Agent 做完的占比；点主卡在右边打开它的子 Agent
        树，再点收起；↑↓ 在主卡间走，Tab 进打开的树。
      </p>
      <Row name="三个主 Agent">
        <AgentFleetUsage />
      </Row>
    </>
  )
}

export function AgentCrewDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：盘后复盘小组与可转债轮动小组。上下文到 80% 变 warn、95% 变
        danger；点「交接一次」看接手的卡亮一下；点卡或 Enter 打开详情与引导动作，左上角切项目。
      </p>
      <Row name="复盘小组">
        <AgentCrewUsage />
      </Row>
    </>
  )
}
