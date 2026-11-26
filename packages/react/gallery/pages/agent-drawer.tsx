// SPDX-License-Identifier: MIT
import { AgentDrawerUsage } from '../usage/AgentDrawerUsage.tsx'
import { AgentTableUsage } from '../usage/AgentTableUsage.tsx'
import { Row } from './parts.tsx'

// Agent 档案抽屉（KatanaUI #225）的文档站演示。数据全是示例：手写的演示值，不是任何 Agent 的真实记录；时钟是固定的演示值。

export function AgentDrawerDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：「盘前扫描」，每个交易日 08:30
        跑，周末不跑。三个状态各一份：在跑（中性亮色加转圈图标，不用强调色）、暂停（warn）、停用（neutral）。 热力格 0
        次是空格，跑过的分 5 档；悬停或 Tab 进格子后用方向键，格子下面读出「11-03 跑了 12
        次」。点最近运行的一行只回调运行 id。
      </p>
      <Row name="在跑">
        <AgentDrawerUsage status="running" />
      </Row>
      <Row name="暂停">
        <AgentDrawerUsage status="paused" />
      </Row>
      <Row name="停用">
        <AgentDrawerUsage status="disabled" />
      </Row>
      <p className="gal-note">
        Agent 列表不新建件：DataGrid 的自定义列画「触发」，点一行在右边的 Sheet 里打开 AgentDrawer。
      </p>
      <Row name="DataGrid 加 Sheet">
        <div className="gal-wide" style={{ maxWidth: 560 }} data-testid="agent-table">
          <AgentTableUsage />
        </div>
      </Row>
    </>
  )
}
