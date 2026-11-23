// SPDX-License-Identifier: MIT
import { AgentRecapUsage } from '../usage/AgentRecapUsage.tsx'
import { AgentLanesUsage } from '../usage/AgentLanesUsage.tsx'
import { AgentQueueUsage } from '../usage/AgentQueueUsage.tsx'
import { AwaySummaryUsage } from '../usage/AwaySummaryUsage.tsx'
import { CostWaterfallUsage } from '../usage/CostWaterfallUsage.tsx'
import { DecisionTreeUsage } from '../usage/DecisionTreeUsage.tsx'
import { FanOutGridUsage } from '../usage/FanOutGridUsage.tsx'
import { RunningNowUsage } from '../usage/RunningNowUsage.tsx'
import { ScheduledRunsUsage } from '../usage/ScheduledRunsUsage.tsx'
import { SmartRecommendationUsage } from '../usage/SmartRecommendationUsage.tsx'
import { Row } from './parts.tsx'

// 参照 affectUI 补的第二批（KATANAview #1908）的文档站演示。数据全是示例：手写或按固定规则生成的演示值，不是任何数据源、账户或 Agent 的真实记录。

export function ScheduledRunsDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：回补 130% 一格放不下，自动模式拆成两块。拖卡进格子，或聚焦卡后 Space 拿起、方向键瞄准、Space 放下、Esc
        放回；Enter 开合详情。切到「手动」，栈里的卡回到栈里，订好的不动。
      </p>
      <Row name="自动排">
        <ScheduledRunsUsage />
      </Row>
    </>
  )
}

export function AgentQueueDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：排队 4 个超过背压线 3，排队数变 warn 色；一个在跑的任务被限流，写倒计时。Tab
        进任务（一个停点），方向键走、Enter 钉住看详情、Esc 收起；步进器改并发数。
      </p>
      <Row name="限流中">
        <AgentQueueUsage />
      </Row>
    </>
  )
}

export function CostWaterfallDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：一次写周报的会话。条从前面各步的累计处起，最后一行是缓存抵扣、条往回走；「最贵一步」跳到写草稿那一步并打开详情。切到
        token 看用量。
      </p>
      <Row name="跑完">
        <CostWaterfallUsage />
      </Row>
    </>
  )
}

export function AgentRecapDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：昨夜 8 小时里后台做的 7 件事，每列最多 2 张卡。点「批准」等 0.6 秒（模拟回调的
        Promise），之后换成「撤销」；悬停一张卡，分布条上它的点变亮。
      </p>
      <Row name="三列">
        <AgentRecapUsage />
      </Row>
    </>
  )
}

export function AwaySummaryDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：离开 2 小时 14 分。要你的排最前；「再看 2 件」展开；「知道了」或 Esc 折成一行分隔条，点它再展开。
      </p>
      <Row name="展开">
        <AwaySummaryUsage />
      </Row>
    </>
  )
}

export function RunningNowDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：五个后台任务。点胶囊或聚焦后 ↓ 打开，↑↓ 在行间走，Tab 到这一行的暂停 / 继续 / 打开，Esc 关上。
      </p>
      <Row name="标题栏">
        <RunningNowUsage />
      </Row>
    </>
  )
}

export function AgentLanesDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：研究员读完研报交给风控（竖线），风控的块在等你。点等人的块弹出「批准」「拒绝」；没给回调时件自己改状态，只为演示。
      </p>
      <Row name="三个 Agent">
        <AgentLanesUsage />
      </Row>
    </>
  )
}

export function FanOutGridDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：48 个子任务按固定规则排的状态。Tab 进格子（一个停点），方向键走、看下面的详情，Enter
        钉住；点底下的计数只看那一种。
      </p>
      <Row name="跑到一半">
        <FanOutGridUsage />
      </Row>
    </>
  )
}

export function SmartRecommendationDemo() {
  return (
    <>
      <p className="gal-note">示例数据：一条止损建议。「其他选项」换一项，「采用」之后可以撤销；点标题收起。</p>
      <Row name="默认展开">
        <SmartRecommendationUsage />
      </Row>
    </>
  )
}

export function DecisionTreeDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：两个待定的决定。按 1–3 选分支、4 写指示（Enter 发出），←→ 或 K / J 换决定，F
        跳到下一条有风险的后果看注释。
      </p>
      <Row name="两个待定">
        <DecisionTreeUsage />
      </Row>
    </>
  )
}
